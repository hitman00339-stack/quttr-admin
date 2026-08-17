import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory cache for performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
}

// Parse User Agent to get device info
function parseUserAgent(ua) {
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  let os = 'unknown';
  if (/android/i.test(ua)) os = 'android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
  else if (/windows/i.test(ua)) os = 'windows';
  else if (/mac/i.test(ua)) os = 'macos';
  else if (/linux/i.test(ua)) os = 'linux';
  
  let browser = 'unknown';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/edge/i.test(ua)) browser = 'edge';
  
  return {
    type: isDesktop ? 'desktop' : (isTablet ? 'tablet' : 'mobile'),
    os,
    browser,
    raw: ua.substring(0, 200) // Store first 200 chars
  };
}

// Generate session ID
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function GET(request, { params }) {
  const startTime = Date.now();
  const code = params.code;
  
  try {
    // Get request headers
    const ua = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0].trim() || 'unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'IN';
    const city = request.headers.get('x-vercel-ip-city') || 'unknown';
    const region = request.headers.get('x-vercel-ip-country-region') || 'unknown';
    
    // Parse device
    const device = parseUserAgent(ua);
    const sessionId = generateSessionId();
    
    // Base URL for landing page
    const baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://quttrr.com/get';
    
    // Check cache first
    let qrData = getCached(`qr_${code}`);
    
    if (!qrData) {
      // Not in cache, fetch from database
      const db = await getDb();
      const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
      
      if (!qrCode) {
        // QR code doesn't exist - redirect to default landing
        const redirectUrl = `${baseUrl}?qr=unknown&sid=${sessionId}`;
        
        // Log unknown QR scan
        db.collection('inactive_scans').insertOne({
          qr_code: code,
          scanned_at: new Date(),
          reason: 'qr_not_found',
          ip_country: country,
        }).catch(() => {});
        
        return NextResponse.redirect(redirectUrl, {
          status: 302,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
      }
      
      // Get activation details
      const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
      
      qrData = {
        qrCode,
        activation,
      };
      
      setCached(`qr_${code}`, qrData);
    }
    
    const { qrCode, activation } = qrData;
    
    // Check QR status
    if (qrCode.status === 'INACTIVE' || !activation) {
      // QR not yet activated - log to inactive_scans
      const db = await getDb();
      
      db.collection('inactive_scans').insertOne({
        qr_id: qrCode._id,
        qr_code: code,
        scanned_at: new Date(),
        device_type: device.type,
        ip_country: country,
      }).catch(() => {});
      
      // Redirect to generic landing page
      const redirectUrl = `${baseUrl}?qr=${code}&sid=${sessionId}&inactive=1`;
      
      return NextResponse.redirect(redirectUrl, {
        status: 302,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
    }
    
    if (qrCode.status === 'PAUSED' || qrCode.status === 'EXPIRED') {
      // Redirect to landing page with paused indicator
      const redirectUrl = `${baseUrl}?qr=${code}&sid=${sessionId}&paused=1`;
      
      return NextResponse.redirect(redirectUrl, {
        status: 302,
      });
    }
    
    // ACTIVE QR - Full tracking
    
    // Determine location text
    const locationText = 
      activation.shop_name ||
      activation.location?.area ||
      activation.location?.city ||
      'आपके शहर';
    
    // Build redirect URL with parameters
    const params_url = new URLSearchParams({
      qr: code,
      sid: sessionId,
      loc: locationText,
    });
    
    if (activation.location_type) {
      params_url.append('type', activation.location_type);
    }
    
    const redirectUrl = `${baseUrl}?${params_url.toString()}`;
    
    // Log scan event ASYNCHRONOUSLY (don't wait)
    (async () => {
      try {
        const db = await getDb();
        await db.collection('scan_events').insertOne({
          qr_id: qrCode._id,
          qr_code: code,
          activation_id: activation._id,
          
          scanned_at: new Date(),
          
          device: device,
          
          location: {
            country,
            region,
            city,
            ip: ip.substring(0, 20), // Truncate IP for privacy
          },
          
          shop_location: {
            city: activation.location?.city,
            state: activation.location?.state,
            area: activation.location?.area,
            shop_name: activation.shop_name,
            type: activation.location_type,
          },
          
          session_id: sessionId,
          referer: referer.substring(0, 200),
          response_time_ms: Date.now() - startTime,
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
        console.error('Scan logging error:', err);
      }
    })();
    
    // Return redirect immediately
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
    
  } catch (error) {
    console.error('QR redirect error:', error);
    
    // Fallback redirect
    const baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://quttrr.com/get';
    return NextResponse.redirect(`${baseUrl}?qr=${code}&error=1`, {
      status: 302,
    });
  }
}
