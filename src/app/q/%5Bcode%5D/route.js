import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const code = params.code;
  const LANDING_URL = 'https://www.quttrr.com/get';
  
  try {
    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
    
    // QR not found
    if (!qrCode) {
      return NextResponse.redirect(`${LANDING_URL}?qr=unknown`, {
        status: 302,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    
    const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
    
    // Priority: TOWN > shop_name > city
    let locationText = 'आपके शहर';
    if (activation) {
      locationText = 
        activation.location?.town ||
        activation.shop_name ||
        activation.location?.city ||
        'आपके शहर';
    }
    
    // Build redirect URL
    const redirectUrl = `${LANDING_URL}?qr=${encodeURIComponent(code)}&loc=${encodeURIComponent(locationText)}`;
    
    // Get device info for analytics
    const ua = request.headers.get('user-agent') || '';
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const country = request.headers.get('x-vercel-ip-country') || 'IN';
    const ipCity = request.headers.get('x-vercel-ip-city') || '';
    
    const deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
    let os = 'unknown';
    if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad/i.test(ua)) os = 'ios';
    else if (/windows/i.test(ua)) os = 'windows';
    
    // Log scan in background (don't wait)
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
            os: os,
            ua: ua.substring(0, 200),
          },
          scanner_location: {
            country: country,
            city: ipCity,
            ip: ip.substring(0, 20),
          },
          shop_location: activation ? {
            shop_name: activation.shop_name,
            location_type: activation.location_type,
            town: activation.location?.town,
            city: activation.location?.city,
            state: activation.location?.state,
            area: activation.location?.area,
          } : null,
          activated_by: activation?.activated_by || null,
        });
        
        // Update scan counter
        await db.collection('qr_codes').updateOne(
          { _id: qrCode._id },
          { 
            $inc: { total_scans: 1 },
            $set: { last_scanned_at: new Date() }
          }
        );
      } catch (err) {
        console.error('Scan log error:', err);
      }
    }, 0);
    
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('QR redirect error:', error);
    return NextResponse.redirect(
      `${LANDING_URL}?qr=${encodeURIComponent(code)}&error=1`, 
      { status: 302 }
    );
  }
}
