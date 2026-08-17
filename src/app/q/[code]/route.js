import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const code = params.code;
  const baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://quttrr.com/get';
  
  try {
    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
    
    // QR not found in database
    if (!qrCode) {
      return NextResponse.redirect(`${baseUrl}?qr=unknown`, {
        status: 302,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    
    // Get activation details
    const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
    
    // Get location text (priority: shop_name > town > city)
    let locationText = 'आपके शहर';
    if (activation) {
      locationText = 
        activation.shop_name ||
        activation.location?.town ||
        activation.location?.city ||
        'आपके शहर';
    }
    
    // Build redirect URL
    const redirectUrl = `${baseUrl}?qr=${code}&loc=${encodeURIComponent(locationText)}`;
    
    // Log scan (background)
    (async () => {
      try {
        const ua = request.headers.get('user-agent') || '';
        const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
        
        await db.collection('scan_events').insertOne({
          qr_id: qrCode._id,
          qr_code: code,
          activation_id: activation?._id || null,
          scanned_at: new Date(),
          device: {
            type: /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
            ua: ua.substring(0, 200)
          },
          ip: ip.substring(0, 20),
          shop_location: activation ? {
            shop_name: activation.shop_name,
            town: activation.location?.town,
            city: activation.location?.city,
            state: activation.location?.state,
          } : null,
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
    })();
    
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    });
    
  } catch (error) {
    console.error('QR redirect error:', error);
    return NextResponse.redirect(`${baseUrl}?qr=${code}&error=1`, { status: 302 });
  }
}
