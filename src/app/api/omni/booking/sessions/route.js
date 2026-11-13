import { NextResponse } from 'next/server';
import { getDirectMongoCollection } from '@/lib/omni-data';
import { verifyServerAuth } from '@/lib/admin-auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    // Server-side Authentication & Admin Role Enforcement
    const authCheck = verifyServerAuth(request, { requireAdmin: true });
    if (!authCheck.success) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const filterDecision = searchParams.get('decision'); // 'all' | 'accepted' | 'declined' | 'pending' | 'unclear'
    const filterStatus = searchParams.get('status');
    const filterShopId = searchParams.get('shopId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));

    const sessionsCol = await getDirectMongoCollection('booking_call_sessions');
    if (!sessionsCol) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503, headers: corsHeaders });
    }

    const query = {};
    if (filterDecision && filterDecision !== 'all') {
      query.decision = filterDecision;
    }
    if (filterStatus && filterStatus !== 'all') {
      query.sessionStatus = filterStatus;
    }
    if (filterShopId) {
      query.shopId = filterShopId;
    }

    const totalCount = await sessionsCol.countDocuments(query);
    const sessions = await sessionsCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Calculate quick KPI aggregates
    const acceptedCount = await sessionsCol.countDocuments({ decision: 'accepted' });
    const declinedCount = await sessionsCol.countDocuments({ decision: 'declined' });
    const totalDispatched = await sessionsCol.countDocuments({});

    return NextResponse.json(
      {
        success: true,
        sessions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        kpis: {
          totalDispatched,
          acceptedCount,
          declinedCount,
          acceptanceRate: totalDispatched > 0 ? Math.round((acceptedCount / totalDispatched) * 100) : 0,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

