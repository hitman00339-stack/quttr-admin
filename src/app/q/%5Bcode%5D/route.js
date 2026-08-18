import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const code = params.code;
  const LANDING_URL =
    process.env.NEXT_PUBLIC_LANDING_URL || 'https://www.quttrr.com/get';

  try {
    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });

    // QR not found → send to generic landing page
    if (!qrCode) {
      return NextResponse.redirect(`${LANDING_URL}?qr=unknown`, {
        status: 302,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const activation = await db
      .collection('qr_activations')
      .findOne({ qr_id: qrCode._id });

    // ============================================================
    // 🎯 LOCATION PRIORITY: town > city > area > state
    // ⚠️ NEVER use shop_name — it's a business name, not a location.
    // Landing page shows: "अब आपके शहर [LOCATION] में भी!"
    // "SHARMA SHOP में भी" makes no sense → must be a town/city.
    // ============================================================
    let locationText = 'आपके शहर';
    if (activation?.location) {
      locationText =
        activation.location.town ||
        activation.location.city ||
        activation.location.area ||
        activation.location.state ||
        'आपके शहर';
    }

    // Build redirect URL with town/city ONLY (no shop_name)
    const redirectUrl = `${LANDING_URL}?qr=${encodeURIComponent(
      code
    )}&loc=${encodeURIComponent(locationText)}`;

    // ---------- Device / IP analytics ----------
    const ua = request.headers.get('user-agent') || '';
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const country = request.headers.get('x-vercel-ip-country') || 'IN';
    const ipCity = request.headers.get('x-vercel-ip-city') || '';

    const deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
    let os = 'unknown';
    if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad/i.test(ua)) os = 'ios';
    else if (/windows/i.test(ua)) os = 'windows';
    else if (/mac/i.test(ua)) os = 'macos';

    // Fire-and-forget analytics
    setTimeout(async () => {
      try {
        await db.collection('scan_events').insertOne({
          qr_id: qrCode._id,
          qr_code: code,
          activation_id: activation?._id || null,
          scanned_at: new Date(),
          location_text: locationText,
          device: {
            type: deviceType,
            os,
            ua: ua.substring(0, 200),
          },
          scanner_location: {
            country,
            city: ipCity,
            ip: ip.substring(0, 20),
          },
          shop_location: activation
            ? {
                shop_name: activation.shop_name || null,
                location_type: activation.location_type || null,
                town: activation.location?.town || null,
                city: activation.location?.city || null,
                state: activation.location?.state || null,
                area: activation.location?.area || null,
              }
            : null,
          activated_by: activation?.activated_by || null,
        });

        await db.collection('qr_codes').updateOne(
          { _id: qrCode._id },
          {
            $inc: { total_scans: 1 },
            $set: { last_scanned_at: new Date() },
          }
        );
      } catch (err) {
        console.error('[q/[code]] scan log error:', err);
      }
    }, 0);

    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('[q/[code]] redirect error:', error);
    return NextResponse.redirect(
      `${LANDING_URL}?qr=${encodeURIComponent(code)}&error=1`,
      { status: 302 }
    );
  }
}
