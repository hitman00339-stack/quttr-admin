import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDirectMongoCollection } from '@/lib/omni-data';
import { checkRateLimit } from '@/lib/admin-auth';

const WEBHOOK_SECRET = process.env.OMNIDIM_WEBHOOK_SECRET || process.env.OMNI_API_SECRET || '';

/**
 * Validates HMAC SHA-256 signature from OmniDimension
 */
function verifySignature(req, rawBody) {
  if (!WEBHOOK_SECRET) {
    // Non-production fallback when secret not yet provisioned
    return true;
  }

  const sigHeader =
    req.headers.get('x-omnidim-signature') ||
    req.headers.get('x-signature') ||
    req.headers.get('x-hub-signature-256');

  if (!sigHeader) return false;

  try {
    const computed = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(computed));
  } catch (_) {
    return false;
  }
}

export async function POST(request) {
  try {
    // 1. Rate Limiting: Max 60 requests per minute
    const clientIp = request.headers.get('x-forwarded-for') || 'omnidim_webhook';
    if (!checkRateLimit(`webhook_${clientIp}`, 60, 60)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 2. Read Raw Body & Verify Signature
    const rawBody = await request.text();
    if (!verifySignature(request, rawBody)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    let body = {};
    try {
      body = JSON.parse(rawBody);
    } catch (_) {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const event = body.event || body.type || 'call.update';
    const providerCallId = body.call_id || body.call_sid || body.id;

    if (!providerCallId) {
      return NextResponse.json({ success: true, message: 'Ignored: No call ID present' });
    }

    // 3. Find Session in MongoDB
    const sessionsCol = await getDirectMongoCollection('booking_call_sessions');
    if (!sessionsCol) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    let session = await sessionsCol.findOne({ providerCallId });
    if (!session) {
      // Upsert: Create session row from webhook if arriving for the first time
      const newSession = {
        providerCallId,
        bookingId: body.metadata?.booking_id || body.booking_id || `book_${Date.now()}`,
        shopId: body.metadata?.shop_id || body.shop_id || '',
        destinationPhone: body.to_number || body.phone || '+919999999999',
        barberName: body.metadata?.barber_name || body.barber_name || 'Barber',
        customerName: body.metadata?.customer_name || body.customer_name || 'Customer',
        serviceName: body.metadata?.service_name || body.service_name || 'Haircut',
        amount: body.metadata?.amount || body.amount || '₹100',
        slotTime: body.metadata?.slot_time || 'Today',
        shopName: body.metadata?.shop_name || 'Partner Salon',
        provider: 'omnidimension',
        sessionStatus: body.status || 'completed',
        decision: 'pending',
        decisionSource: 'none',
        retryCount: 0,
        maxRetries: 2,
        callStartedAt: new Date(),
        webhookPayloads: [],
        createdAt: new Date(),
      };
      const insertRes = await sessionsCol.insertOne(newSession);
      session = { ...newSession, _id: insertRes.insertedId };
    }

    // 4. Idempotency Check: Exit early if already resolved to terminal decision
    if (['accepted', 'declined'].includes(session.decision)) {
      return NextResponse.json({
        success: true,
        message: 'Already processed (idempotent)',
        decision: session.decision,
      });
    }

    // 5. Semantic Decision Extraction
    let decision = 'pending';
    let decisionSource = 'none';
    let confidence = 1.0;

    const transcript = body.transcript || body.text || '';
    const digits = body.dtmf_digits || body.digits || '';

    // DTMF Priority
    if (digits === '1') {
      decision = 'accepted';
      decisionSource = 'dtmf';
    } else if (digits === '2') {
      decision = 'declined';
      decisionSource = 'dtmf';
    } else if (body.decision) {
      const dec = String(body.decision).toLowerCase();
      if (['accept', 'accepted', 'confirm', 'confirmed'].includes(dec)) {
        decision = 'accepted';
        decisionSource = 'voice';
      } else if (['decline', 'declined', 'reject', 'rejected'].includes(dec)) {
        decision = 'declined';
        decisionSource = 'voice';
      }
    } else if (transcript) {
      const lower = transcript.toLowerCase();
      const acceptMatches = ['हाँ', 'हाँ जी', 'स्वीकार', 'कर दीजिए', 'ले लीजिए', 'yes', 'accept', 'theek hai', 'bhej do'];
      const declineMatches = ['नहीं', 'नहीं चाहिए', 'मना', 'फुर्सत नहीं', 'टाइम नहीं', 'no', 'decline', 'reject', 'busy'];

      const hasAccept = acceptMatches.some((m) => lower.includes(m));
      const hasDecline = declineMatches.some((m) => lower.includes(m));

      if (hasAccept && !hasDecline) {
        decision = 'accepted';
        decisionSource = 'voice';
      } else if (hasDecline && !hasAccept) {
        decision = 'declined';
        decisionSource = 'voice';
      } else {
        decision = 'unclear';
      }
    }

    // 6. Update Session Record in MongoDB
    const now = new Date();
    const updateDoc = {
      $push: { webhookPayloads: { event, payload: body, receivedAt: now } },
      $set: {
        sessionStatus: body.status || 'completed',
        callEndedAt: now,
        durationSeconds: body.duration || body.call_duration || session.durationSeconds || 0,
        transcriptSnippet: transcript || session.transcriptSnippet || '',
      },
    };

    if (decision !== 'pending') {
      updateDoc.$set.decision = decision;
      updateDoc.$set.decisionSource = decisionSource;
    }

    await sessionsCol.updateOne({ _id: session._id }, updateDoc);

    return NextResponse.json({
      success: true,
      providerCallId,
      decision,
      decisionSource,
      sessionStatus: body.status || 'completed',
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

