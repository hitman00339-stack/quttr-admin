import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    const [totalQR, activeQR, inactiveQR, totalScans, todayScans] = await Promise.all([
      db.collection('qr_codes').countDocuments(),
      db.collection('qr_codes').countDocuments({ status: 'ACTIVE' }),
      db.collection('qr_codes').countDocuments({ status: 'INACTIVE' }),
      db.collection('scan_events').countDocuments(),
      db.collection('scan_events').countDocuments({
        scanned_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      stats: {
        total_qr: totalQR,
        active_qr: activeQR,
        inactive_qr: inactiveQR,
        total_scans: totalScans,
        today_scans: todayScans,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
