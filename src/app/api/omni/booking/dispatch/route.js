import { NextResponse } from 'next/server';
import { getDirectMongoCollection, cleanPhone } from '@/lib/omni-data';
import { verifyServerAuth, checkRateLimit } from '@/lib/admin-auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    // 1. Server-side Authentication Guard
    const authCheck = verifyServerAuth(request, { requireAdmin: false });
    if (!authCheck.success) {
      return authCheck.response;
    }

    const body = await request.json();
    const {
      booking_id,
      shop_id,
      to_number,
      barber_name = 'Barber',
      customer_name = 'Customer',
      service_name = 'Salon Service',
      booking_amount = '₹100',
      slot_time = 'Today (Live Queue)',
      shop_name = 'Quttr Partner Salon',
      agent_id,
    } = body;

    // 2. Validate Required Fields
    if (!booking_id || !to_number) {
      return NextResponse.json(
        { success: false, error: 'booking_id and to_number are strictly required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const digits = cleanPhone(to_number);
    if (!digits) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400, headers: corsHeaders }
      );
    }
    const formattedPhone = `+91${digits}`;

    // 3. Rate Limit: Max 5 dispatches per minute per shop
    const rateLimitKey = `dispatch_${shop_id || formattedPhone}`;
    if (!checkRateLimit(rateLimitKey, 5, 60)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded: Too many call attempts for this shop. Please wait 60s.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // 3b. Config Gating: Check Global & Per-Shop Calling Toggles
    const configCol = await getDirectMongoCollection('booking_call_config');
    if (configCol) {
      const cfgDoc = await configCol.findOne({ key: 'booking_acceptance_config' });
      const cfg = cfgDoc?.value || { globalCallingEnabled: true, shopCallingOverrides: {} };

      if (cfg.globalCallingEnabled === false) {
        return NextResponse.json(
          { success: false, error: 'Voice call dispatch is temporarily paused by system administrator.' },
          { status: 503, headers: corsHeaders }
        );
      }

      if (shop_id && cfg.shopCallingOverrides && cfg.shopCallingOverrides[shop_id] === false) {
        return NextResponse.json(
          { success: false, error: `Voice call dispatch is disabled for shop ${shop_id}.` },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // 4. Construct OmniDimension AI Context (Hindi Pronunciation: कटर / Kutter)
    const targetAgentId = agent_id || process.env.OMNI_AGENT_ID || '282318';
    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const officialCallerId = process.env.OMNIDIM_CALLER_ID || '+919429492250';

    const greeting = `नमस्ते ${barber_name} जी! कटर ऐप से बुकिंग आई है। क्या मेरी आवाज़ आ रही है आपको?`;
    const callGoal = `Verify and accept/decline new appointment for ${customer_name} (${service_name}, ${slot_time}) at ${shop_name}`;
    const agentDirective = `आप 'कटर' (QUTTR) ऐप की बुकिंग कोऑर्डिनेटर 'रिया' हैं। ${barber_name} जी को बताएं कि ${customer_name} ने ${slot_time} के लिए ${service_name} (${booking_amount}) की बुकिंग की है। पूछें कि क्या वे यह बुकिंग स्वीकार करते हैं। यदि हाँ कहें, तो धन्यवाद दें। यदि ना कहें या व्यस्त बताएं, तो विनम्रता से विदा लें।`;

    // 5. Create Booking Call Session in MongoDB Collection 'booking_call_sessions'
    const sessionsCol = await getDirectMongoCollection('booking_call_sessions');
    let callSessionId = `sess_${Date.now()}`;
    let insertedSessionId = null;

    if (sessionsCol) {
      const insertResult = await sessionsCol.insertOne({
        bookingId: booking_id,
        shopId: shop_id || '',
        destinationPhone: formattedPhone,
        barberName: barber_name,
        customerName: customer_name,
        serviceName: service_name,
        amount: booking_amount,
        slotTime: slot_time,
        shopName: shop_name,
        provider: 'omnidimension',
        agentId: targetAgentId,
        sessionStatus: 'initiated',
        decision: 'pending',
        decisionSource: 'none',
        retryCount: 0,
        maxRetries: 2,
        callStartedAt: new Date(),
        webhookPayloads: [],
        createdAt: new Date(),
      });
      insertedSessionId = insertResult.insertedId;
      callSessionId = insertResult.insertedId ? insertResult.insertedId.toString() : callSessionId;
    }

    const webhookUrl = process.env.OMNIDIM_WEBHOOK_URL || 'https://stolen-cartoons-bargains-amplifier.trycloudflare.com/api/v1/telephony/webhook';
    // 6. Dispatch Outbound Call via OmniDimension Carrier
    const payload = {
      agent_id: targetAgentId,
      to_number: formattedPhone,
      phone_number: formattedPhone,
      to: formattedPhone,
      from: officialCallerId,
      from_number: officialCallerId,
      caller_id: officialCallerId,
      caller_number: officialCallerId,
      outbound_phone_number: officialCallerId,
      caller_phone_number: officialCallerId,
      source_number: officialCallerId,
      webhook_url: webhookUrl,
      callback_url: webhookUrl,
      call_context: {
        greeting,
        call_type: 'booking_acceptance',
        call_goal: callGoal,
        booking_id,
        session_id: callSessionId,
        barber_name,
        customer_name,
        service_name,
        booking_amount,
        slot_time,
        shop_name,
        brand_name: 'कटर',
        agent_directive: agentDirective,
      },
      dynamic_variables: {
        greeting,
        booking_id,
        barber_name,
        customer_name,
        service_name,
        booking_amount,
        slot_time,
        shop_name,
        brand_name: 'कटर',
      },
      metadata: {
        platform: 'quttr_booking',
        booking_id,
        session_id: callSessionId,
        shop_id: shop_id || '',
        destination_phone: formattedPhone,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    };

    let apiSuccess = false;
    let providerCallId = `call_${Date.now()}`;
    let apiErrorMessage = '';

    if (body.dry_run === true || body.dryRun === true) {
      // Safe Simulation / Dry-run Mode: never dials external SIP carrier
      apiSuccess = true;
      providerCallId = `mock_dry_run_${Date.now()}`;
      apiErrorMessage = 'Dry-run simulated successfully (no real call dispatched)';
    } else {
      const dispatchUrl = 'https://backend.omnidim.io/api/v1/calls/dispatch';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for SIP carrier

        const omniRes = await fetch(dispatchUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (omniRes.ok) {
          const resData = await omniRes.json().catch(() => ({}));
          apiSuccess = true;
          providerCallId = resData.requestId || resData.call_id || resData.id || providerCallId;
        } else {
          const errData = await omniRes.json().catch(() => ({}));
          apiErrorMessage = errData.message || errData.error || `HTTP ${omniRes.status}`;
        }
      } catch (carrierErr) {
        apiErrorMessage = carrierErr.name === 'AbortError' ? 'Carrier trunk allocation timeout' : carrierErr.message;
      }
    }

    // 7. Update Session with Provider Call ID or Failure
    if (sessionsCol && insertedSessionId) {
      if (apiSuccess) {
        await sessionsCol.updateOne(
          { _id: insertedSessionId },
          { $set: { providerCallId, sessionStatus: 'initiated' } }
        ).catch(() => {});
      } else {
        await sessionsCol.updateOne(
          { _id: insertedSessionId },
          { $set: { sessionStatus: 'failed', failureReason: apiErrorMessage } }
        ).catch(() => {});
      }
    }

    return NextResponse.json(
      {
        success: apiSuccess,
        bookingId: booking_id,
        callSessionId,
        providerCallId,
        phone: formattedPhone,
        message: apiSuccess
          ? `Outbound booking call dispatched to ${barber_name} (${formattedPhone})`
          : `Call dispatch failed: ${apiErrorMessage}`,
        error: apiSuccess ? undefined : apiErrorMessage,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

