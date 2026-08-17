import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    const [totalQR, activeQR, inactiveQR, totalScans, todayScans, totalActivations] = await Promise.all([
      db.collection('qr_codes').countDocuments(),
      db.collection('qr_codes').countDocuments({ status: 'ACTIVE' }),
      db.collection('qr_codes').countDocuments({ status: 'INACTIVE' }),
      db.collection('scan_events').countDocuments(),
      db.collection('scan_events').countDocuments({
        scanned_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      db.collection('qr_activations').countDocuments(),
    ]);
    
    const recentScans = await db.collection('scan_events')
      .find({})
      .sort({ scanned_at: -1 })
      .limit(10)
      .toArray();
    
    const topQRs = await db.collection('qr_codes')
      .find({ total_scans: { $gt: 0 } })
      .sort({ total_scans: -1 })
      .limit(5)
      .toArray();
    
    return NextResponse.json({
      success: true,
      stats: {
        total_qr: totalQR,
        active_qr: activeQR,
        inactive_qr: inactiveQR,
        total_scans: totalScans,
        today_scans: todayScans,
        total_activations: totalActivations,
      },
      recent_scans: recentScans.map(s => ({
        qr_code: s.qr_code,
        scanned_at: s.scanned_at,
        device: s.device?.type,
        city: s.location?.city,
        shop: s.shop_location?.shop_name,
      })),
      top_qrs: topQRs.map(q => ({
        short_code: q.short_code,
        total_scans: q.total_scans,
        status: q.status,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
