import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get stats
    const totalQR = await db.collection('qr_codes').countDocuments();
    const activeQR = await db.collection('qr_codes').countDocuments({ status: 'ACTIVE' });
    const inactiveQR = await db.collection('qr_codes').countDocuments({ status: 'INACTIVE' });
    const totalScans = await db.collection('scan_events').countDocuments();
    const totalActivations = await db.collection('qr_activations').countDocuments();
    
    // Get recent QR codes
    const recentQRs = await db.collection('qr_codes')
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    // Get recent scans
    const recentScans = await db.collection('scan_events')
      .find({})
      .sort({ scanned_at: -1 })
      .limit(5)
      .toArray();
    
    return NextResponse.json({
      success: true,
      stats: {
        total_qr_codes: totalQR,
        active_qr_codes: activeQR,
        inactive_qr_codes: inactiveQR,
        total_scans: totalScans,
        total_activations: totalActivations,
      },
      recent_qr_codes: recentQRs.map(qr => ({
        short_code: qr.short_code,
        status: qr.status,
        total_scans: qr.total_scans || 0,
        created_at: qr.created_at,
      })),
      recent_scans: recentScans.map(scan => ({
        qr_code: scan.qr_code,
        scanned_at: scan.scanned_at,
        device: scan.device?.type,
        city: scan.location?.city,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
