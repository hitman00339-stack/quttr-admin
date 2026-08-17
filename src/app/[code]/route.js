import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item || Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
}

function parseUA(ua) {
  const isMobile = /mobile|android|iphone/i.test(ua);
  let os = 'unknown';
  if (/android/i.test(ua)) os = 'android';
  else if (/iphone|ipad/i.test(ua)) os = 'ios';
  else if (/windows/i.test(ua)) os = 'windows';
  
  return {
    type: isMobile ? 'mobile' : 'desktop',
    os,
  };
}

export async function GET(request, { params }) {
  const startTime = Date.now();
  const code = params.code;
  const baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://quttrr.com/get';
  
  try {
    const ua = request.headers.get('user-agent') || '';
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const country = request.headers.get('x-vercel-ip-country') || 'IN';
    const city = request.headers.get('x-vercel-ip-city') || '';
    const device = parseUA(ua);
    const sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    
    let qrData = getCached(`qr_${code}`);
    
    if (!qrData) {
      const db = await getDb();
      const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
      
      if (!qrCode) {
        db.collection('inactive_scans').insertOne({
          qr_code: code,
          scanned_at: new Date(),
          reason: 'not_found',
        }).catch(() => {});
        
        return NextResponse.redirect(`${baseUrl}?qr=unknown&sid=${sessionId}`, {
          status: 302,
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      
      const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
      qrData = { qrCode, activation };
      setCached(`qr_${code}`, qrData);
    }
    
    const { qrCode, activation } = qrData;
    
    if (qrCode.status !== 'ACTIVE' || !activation) {
      const db = await getDb();
      db.collection('inactive_scans').insertOne({
        qr_id: qrCode._id,
        qr_code: code,
        scanned_at: new Date(),
        device_type: device.type,
      }).catch(() => {});
      
      return NextResponse.redirect(`${baseUrl}?qr=${code}&sid=${sessionId}&inactive=1`, {
        status: 302,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    
    const locationText = 
      activation.shop_name ||
      activation.location?.area ||
      activation.location?.city ||
      'आपके शहर';
    
    const params_url = new URLSearchParams({
      qr: code,
      sid: sessionId,
      loc: locationText,
    });
    
    const redirectUrl = `${baseUrl}?${params_url.toString()}`;
    
    // Log scan asynchronously
    (async () => {
      try {
        const db = await getDb();
        await db.collection('scan_events').insertOne({
          qr_id: qrCode._id,
          qr_code: code,
          activation_id: activation._id,
          scanned_at: new Date(),
          device,
          location: { country, city, ip: ip.substring(0, 20) },
          shop_location: {
            city: activation.location?.city,
            state: activation.location?.state,
            area: activation.location?.area,
            shop_name: activation.shop_name,
            type: activation.location_type,
          },
          session_id: sessionId,
          response_time_ms: Date.now() - startTime,
        });
        
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
