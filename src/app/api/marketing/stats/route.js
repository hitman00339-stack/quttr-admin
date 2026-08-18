import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getCurrentAgent } from '@/lib/auth-agent';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const agent = await getCurrentAgent();
    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = await getDb();
    const agentOid = new ObjectId(agent._id);

    // 1. Get all activations by this agent
    const activations = await db
      .collection('qr_activations')
      .find({ activated_by_id: agentOid })
      .sort({ activated_at: -1 })
      .limit(limit)
      .toArray();

    const qrIds = activations.map((a) => a.qr_id);

    // 2. Total scans across ALL their QRs
    const scanAgg = qrIds.length
      ? await db.collection('scan_events').aggregate([
          { $match: { qr_id: { $in: qrIds } } },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]).toArray()
      : [];
    const totalScans = scanAgg[0]?.total || 0;

    // 3. Scans in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentScanAgg = qrIds.length
      ? await db.collection('scan_events').aggregate([
          { $match: { qr_id: { $in: qrIds }, scanned_at: { $gte: sevenDaysAgo } } },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]).toArray()
      : [];
    const last7DaysScans = recentScanAgg[0]?.total || 0;

    // 4. Unique towns covered
    const uniqueTowns = new Set(
      activations.map((a) => a.location?.town).filter(Boolean)
    );

    // 5. Get scan count per QR (for the table)
    const scanCountsByQr = qrIds.length
      ? await db.collection('scan_events').aggregate([
          { $match: { qr_id: { $in: qrIds } } },
          { $group: { _id: '$qr_id', count: { $sum: 1 } } },
        ]).toArray()
      : [];
    const scanCountMap = new Map(
      scanCountsByQr.map((s) => [s._id.toString(), s.count])
    );

    // 6. Daily scans (last 30 days) for chart
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyScans = qrIds.length
      ? await db.collection('scan_events').aggregate([
          { $match: { qr_id: { $in: qrIds }, scanned_at: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$scanned_at' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).toArray()
      : [];

    // 7. Top 5 towns by activation count
    const townCounts = {};
    activations.forEach((a) => {
      const t = a.location?.town;
      if (t) townCounts[t] = (townCounts[t] || 0) + 1;
    });
    const topTowns = Object.entries(townCounts)
      .map(([town, count]) => ({ town, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        total_activations: activations.length,
        total_scans: totalScans,
        last_7_days_scans: last7DaysScans,
        unique_towns: uniqueTowns.size,
      },
      top_towns: topTowns,
      daily_scans: dailyScans.map((d) => ({ date: d._id, count: d.count })),
      activations: activations.map((a) => ({
        _id: a._id.toString(),
        qr_id: a.qr_id.toString(),
        qr_code: a.qr_code,
        shop_name: a.shop_name,
        location_type: a.location_type,
        town: a.location?.town,
        city: a.location?.city,
        state: a.location?.state,
        activated_at: a.activated_at,
        scan_count: scanCountMap.get(a.qr_id.toString()) || 0,
      })),
    });
  } catch (error) {
    console.error('[api/marketing/stats] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
