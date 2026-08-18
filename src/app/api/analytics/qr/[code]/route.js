import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ success: false, message: 'Code required' }, { status: 400 });
    }

    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code: code });
    if (!qrCode) {
      return NextResponse.json({ success: false, message: 'QR not found' }, { status: 404 });
    }

    const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });

    // Total scans
    const totalScansAgg = await db
      .collection('scan_events')
      .aggregate([{ $match: { qr_id: qrCode._id } }, { $count: 'total' }])
      .toArray();
    const totalScans = totalScansAgg[0]?.total || 0;

    // Last 30 days daily breakdown
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyScans = await db
      .collection('scan_events')
      .aggregate([
        { $match: { qr_id: qrCode._id, scanned_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scanned_at' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Device breakdown
    const deviceBreakdown = await db
      .collection('scan_events')
      .aggregate([
        { $match: { qr_id: qrCode._id } },
        { $group: { _id: '$device.os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    // Recent scans (last 20)
    const recentScans = await db
      .collection('scan_events')
      .find({ qr_id: qrCode._id })
      .sort({ scanned_at: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      success: true,
      qr: {
        _id: qrCode._id.toString(),
        short_code: qrCode.short_code,
        full_url: qrCode.full_url,
        status: qrCode.status,
        total_scans: totalScans,
        created_at: qrCode.created_at,
        batch_id: qrCode.batch_id || null,
        batch_name: qrCode.batch_name || null,
        last_scanned_at: qrCode.last_scanned_at || null,
      },
      activation: activation
        ? {
            _id: activation._id.toString(),
            qr_id: activation.qr_id.toString(),
            location_type: activation.location_type,
            shop_name: activation.shop_name,
            owner_name: activation.owner_name,
            owner_phone: activation.owner_phone,
            owner_whatsapp: activation.owner_whatsapp,
            vehicle_number: activation.vehicle_number,
            location: activation.location || {},
            gps_location: activation.gps_location || null,
            placement_position: activation.placement_position,
            notes: activation.notes,
            activated_by_type: activation.activated_by_type || 'admin',
            activated_by_id: activation.activated_by_id?.toString() || null,
            activated_by_name: activation.activated_by_name || 'admin',
            activated_at: activation.activated_at,
            updated_at: activation.updated_at,
          }
        : null,
      daily_scans: dailyScans.map((d) => ({ date: d._id, count: d.count })),
      device_breakdown: deviceBreakdown.map((d) => ({
        name: d._id || 'unknown',
        count: d.count,
      })),
      recent_scans: recentScans.map((s) => ({
        _id: s._id.toString(),
        scanned_at: s.scanned_at,
        device: s.device || {},
        scanner_location: s.scanner_location || {},
      })),
    });
  } catch (error) {
    console.error('[api/analytics/qr/[code]] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
