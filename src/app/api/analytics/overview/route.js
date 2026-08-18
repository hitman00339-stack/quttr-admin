import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // today | 7d | 30d | all

    const now = new Date();
    let fromDate = null;
    if (range === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7d') {
      fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const db = await getDb();
    const scanMatch = fromDate ? { scanned_at: { $gte: fromDate } } : {};

    // ---------- 1. TOP-LEVEL COUNTS ----------
    const [totalQRs, activatedQRs, totalAgents, activeAgents] = await Promise.all([
      db.collection('qr_codes').countDocuments({}),
      db.collection('qr_codes').countDocuments({ status: 'ACTIVE' }),
      db.collection('marketing_agents').countDocuments({}),
      db.collection('marketing_agents').countDocuments({ is_active: true }),
    ]);

    const scanCountAgg = await db
      .collection('scan_events')
      .aggregate([{ $match: scanMatch }, { $count: 'total' }])
      .toArray();
    const totalScans = scanCountAgg[0]?.total || 0;

    // ---------- 2. SCANS OVER TIME (daily) ----------
    const dailyScans = await db
      .collection('scan_events')
      .aggregate([
        { $match: scanMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scanned_at' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // ---------- 3. TOP CITIES ----------
    const topCities = await db
      .collection('scan_events')
      .aggregate([
        { $match: { ...scanMatch, 'shop_location.city': { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$shop_location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // ---------- 4. TOP TOWNS ----------
    const topTowns = await db
      .collection('scan_events')
      .aggregate([
        { $match: { ...scanMatch, 'shop_location.town': { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$shop_location.town', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // ---------- 5. TOP STATES ----------
    const topStates = await db
      .collection('scan_events')
      .aggregate([
        { $match: { ...scanMatch, 'shop_location.state': { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$shop_location.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // ---------- 6. TOP SHOPS ----------
    const topShops = await db
      .collection('scan_events')
      .aggregate([
        { $match: { ...scanMatch, 'shop_location.shop_name': { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$shop_location.shop_name',
            count: { $sum: 1 },
            city: { $first: '$shop_location.city' },
            town: { $first: '$shop_location.town' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // ---------- 7. TOP AGENTS (by activations & scans generated) ----------
    // Method: count activations per agent, then scans on those QRs
    const agentActivations = await db
      .collection('qr_activations')
      .aggregate([
        { $match: { activated_by_type: 'agent', activated_by_id: { $ne: null } } },
        {
          $group: {
            _id: '$activated_by_id',
            name: { $first: '$activated_by_name' },
            activations: { $sum: 1 },
            qr_ids: { $push: '$qr_id' },
          },
        },
        { $sort: { activations: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // For each top agent, calculate their scans in range
    const topAgents = await Promise.all(
      agentActivations.map(async (a) => {
        const scanAgg = await db
          .collection('scan_events')
          .aggregate([
            { $match: { qr_id: { $in: a.qr_ids }, ...(fromDate ? { scanned_at: { $gte: fromDate } } : {}) } },
            { $count: 'total' },
          ])
          .toArray();
        return {
          _id: a._id.toString(),
          name: a.name || 'Unknown',
          activations: a.activations,
          scans: scanAgg[0]?.total || 0,
        };
      })
    );
    topAgents.sort((x, y) => y.scans - x.scans);

    // ---------- 8. LOCATION TYPE BREAKDOWN ----------
    const typeBreakdown = await db
      .collection('qr_activations')
      .aggregate([
        { $group: { _id: '$location_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    // ---------- 9. RECENT ACTIVITY ----------
    const recentActivations = await db
      .collection('qr_activations')
      .find({})
      .sort({ activated_at: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      range,
      overview: {
        total_qrs: totalQRs,
        activated_qrs: activatedQRs,
        inactive_qrs: totalQRs - activatedQRs,
        total_scans: totalScans,
        total_agents: totalAgents,
        active_agents: activeAgents,
      },
      daily_scans: dailyScans.map((d) => ({ date: d._id, count: d.count })),
      top_cities: topCities.map((c) => ({ name: c._id, count: c.count })),
      top_towns: topTowns.map((t) => ({ name: t._id, count: t.count })),
      top_states: topStates.map((s) => ({ name: s._id, count: s.count })),
      top_shops: topShops.map((s) => ({
        name: s._id,
        count: s.count,
        city: s.city,
        town: s.town,
      })),
      top_agents: topAgents,
      type_breakdown: typeBreakdown.map((t) => ({ name: t._id || 'other', count: t.count })),
      recent_activations: recentActivations.map((a) => ({
        _id: a._id.toString(),
        qr_id: a.qr_id.toString(),
        qr_code: a.qr_code,
        shop_name: a.shop_name,
        town: a.location?.town,
        city: a.location?.city,
        state: a.location?.state,
        activated_at: a.activated_at,
        activated_by_name: a.activated_by_name,
        activated_by_type: a.activated_by_type,
      })),
    });
  } catch (error) {
    console.error('[api/analytics/overview] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
