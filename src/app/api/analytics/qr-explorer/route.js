import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get('search') || '').trim();
    const agentId = searchParams.get('agent') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const town = searchParams.get('town') || '';
    const locationType = searchParams.get('type') || '';
    const status = searchParams.get('status') || ''; // ACTIVE | INACTIVE | (empty)
    const sortBy = searchParams.get('sort') || 'newest'; // newest | oldest | most_scanned
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const db = await getDb();

    // Build QR activation query
    const query = {};
    if (state) query['location.state'] = new RegExp(`^${escapeRegex(state)}$`, 'i');
    if (city) query['location.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
    if (town) query['location.town'] = new RegExp(`^${escapeRegex(town)}$`, 'i');
    if (locationType) query.location_type = locationType;
    if (agentId && ObjectId.isValid(agentId)) query.activated_by_id = new ObjectId(agentId);

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { shop_name: re },
        { owner_name: re },
        { owner_phone: re },
        { qr_code: re },
        { 'location.town': re },
        { 'location.city': re },
        { 'location.landmark': re },
        { activated_by_name: re },
      ];
    }

    // If filtering by status, join with qr_codes
    let activationsCursor = db.collection('qr_activations').find(query);

    // Sort
    if (sortBy === 'oldest') {
      activationsCursor = activationsCursor.sort({ activated_at: 1 });
    } else if (sortBy === 'newest') {
      activationsCursor = activationsCursor.sort({ activated_at: -1 });
    }

    // Get total & page slice
    const total = await db.collection('qr_activations').countDocuments(query);
    const activations = await activationsCursor
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const qrIds = activations.map((a) => a.qr_id);

    // Fetch QR status
    const qrCodes = qrIds.length
      ? await db.collection('qr_codes').find({ _id: { $in: qrIds } }).toArray()
      : [];
    const qrMap = new Map(qrCodes.map((q) => [q._id.toString(), q]));

    // Fetch scan counts per QR
    const scanCounts = qrIds.length
      ? await db.collection('scan_events').aggregate([
          { $match: { qr_id: { $in: qrIds } } },
          { $group: { _id: '$qr_id', count: { $sum: 1 } } },
        ]).toArray()
      : [];
    const scanMap = new Map(scanCounts.map((s) => [s._id.toString(), s.count]));

    // Merge everything
    let rows = activations.map((a) => {
      const qr = qrMap.get(a.qr_id.toString());
      return {
        _id: a._id.toString(),
        qr_id: a.qr_id.toString(),
        qr_code: a.qr_code,
        shop_name: a.shop_name,
        location_type: a.location_type,
        owner_name: a.owner_name,
        owner_phone: a.owner_phone,
        town: a.location?.town || null,
        city: a.location?.city || null,
        state: a.location?.state || null,
        landmark: a.location?.landmark || null,
        pincode: a.location?.pincode || null,
        gps: a.gps_location || null,
        agent_id: a.activated_by_id?.toString() || null,
        agent_name: a.activated_by_name || 'admin',
        agent_type: a.activated_by_type || 'admin',
        activated_at: a.activated_at,
        status: qr?.status || 'UNKNOWN',
        total_scans: scanMap.get(a.qr_id.toString()) || 0,
        full_url: qr?.full_url || null,
      };
    });

    // Filter by status if requested
    if (status) rows = rows.filter((r) => r.status === status);

    // If sorting by most scanned, do it in-memory
    if (sortBy === 'most_scanned') {
      rows.sort((a, b) => b.total_scans - a.total_scans);
    }

    // Compute available filter values (for dropdowns) — from ALL activations, not just current page
    const [uniqueStates, uniqueCities, uniqueTowns, uniqueTypes, allAgents] = await Promise.all([
      db.collection('qr_activations').distinct('location.state', { 'location.state': { $ne: null, $ne: '' } }),
      db.collection('qr_activations').distinct('location.city', { 'location.city': { $ne: null, $ne: '' } }),
      db.collection('qr_activations').distinct('location.town', { 'location.town': { $ne: null, $ne: '' } }),
      db.collection('qr_activations').distinct('location_type'),
      db.collection('marketing_agents').find({}, { projection: { name: 1, phone: 1 } }).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      rows,
      filters: {
        states: uniqueStates.filter(Boolean).sort(),
        cities: uniqueCities.filter(Boolean).sort(),
        towns: uniqueTowns.filter(Boolean).sort(),
        types: uniqueTypes.filter(Boolean).sort(),
        agents: allAgents.map((a) => ({
          _id: a._id.toString(),
          name: a.name,
          phone: a.phone,
        })),
      },
    });
  } catch (error) {
    console.error('[api/analytics/qr-explorer] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
