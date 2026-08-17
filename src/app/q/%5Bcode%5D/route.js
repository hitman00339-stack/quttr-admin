import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const code = params.code;
  
  // HARDCODED URL - NO ENV VARIABLE
  const LANDING_URL = 'https://quttrr.com/get';
  
  try {
    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
    
    // Default location text
    let locationText = 'आपके शहर';
    
    if (qrCode) {
      const activation = await db.collection('qr_activations').findOne({ 
        qr_id: qrCode._id 
      });
      
      if (activation) {
        locationText = 
          activation.shop_name ||
          activation.location?.town ||
          activation.location?.city ||
          'आपके शहर';
      }
      
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
    }
    
    // Build final URL - HARDCODED /get path
    const finalUrl = `${LANDING_URL}?qr=${encodeURIComponent(code)}&loc=${encodeURIComponent(locationText)}`;
    
    return NextResponse.redirect(finalUrl, {
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
