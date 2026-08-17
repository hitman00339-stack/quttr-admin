import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const code = context.params.code;
  const baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://quttrr.com/get';
  
  try {
    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
    
    if (!qrCode) {
      return NextResponse.redirect(`${baseUrl}?qr=unknown`, {
        status: 302,
      });
    }
    
    const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
    
    let locationText = 'आपके शहर';
    if (activation) {
      locationText = 
        activation.shop_name ||
        activation.location?.town ||
        activation.location?.city ||
        'आपके शहर';
    }
    
    const redirectUrl = `${baseUrl}?qr=${code}&loc=${encodeURIComponent(locationText)}`;
    
    // Log scan in background
    setTimeout(async () => {
      try {
        await db.collection('scan_events').insertOne({
          qr_id: qrCode._id,
          qr_code: code,
          scanned_at: new Date(),
          location_text: locationText,
        });
        
        await db.collection('qr_codes').updateOne(
          { _id: qrCode._id },
          { 
            $inc: { total_scans: 1 },
            $set: { last_scanned_at: new Date() }
          }
        );
      } catch (err) {
        console.error('Log error:', err);
      }
    }, 0);
    
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('QR redirect error:', error);
    return NextResponse.redirect(`${baseUrl}?qr=${code}&error=1`, { status: 302 });
  }
}
