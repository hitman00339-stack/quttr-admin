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
    const authHeader = request.headers.get('authorization') || '';
    const { searchParams } = new URL(request.url);

    // 1. Forward directly to Express Backend with Bearer token if available
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';
    try {
      const backendRes = await fetch(`${backendUrl}/admin/omni/booking/sessions?${searchParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json(backendData, { headers: corsHeaders });
      }
    } catch (netErr) {
      console.warn('⚠️ [Admin API proxy notice]:', netErr.message);
    }

    // 2. Fallback to direct MongoDB query with multi-secret server auth check
    const authCheck = verifyServerAuth(request, { requireAdmin: true });
    if (!authCheck.success) {
      return authCheck.response;
    }

    const filterDecision = searchParams.get('decision');
    const filterStatus = searchParams.get('status');
    const filterShopId = searchParams.get('shopId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));

    let sessionsCol = await getDirectMongoCollection('bookingcallsessions');
    if (!sessionsCol) {
      sessionsCol = await getDirectMongoCollection('booking_call_sessions');
    }

    if (!sessionsCol) {
      return NextResponse.json(
        {
          success: true,
          sessions: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
          kpis: { totalDispatched: 0, acceptedCount: 0, declinedCount: 0, acceptanceRate: 0 },
        },
        { headers: corsHeaders }
      );
    }

    const query = {};
    if (filterDecision && filterDecision !== 'all') {
      query.decision = filterDecision;
    }
    if (filterStatus && filterStatus !== 'all') {
      query.sessionStatus = filterStatus;
    }
    if (filterShopId) {
      query.shop = filterShopId;
    }

    const totalCount = await sessionsCol.countDocuments(query);
    const rawSessions = await sessionsCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const sessions = rawSessions.map((s) => {
      const bookingId =
        s.bookingId ||
        (s.queue ? `Q-${s.queue.toString().slice(-4).toUpperCase()}` : null) ||
        (s._id ? s._id.toString().slice(-6).toUpperCase() : 'N/A');

      const customerName =
        s.customerName ||
        (typeof s.customer === 'object' ? s.customer?.name : null) ||
        'Customer';

      const barberName =
        s.barberName ||
        (typeof s.assignedUser === 'object' ? s.assignedUser?.name : null) ||
        'Barber';

      const shopName =
        s.shopName ||
        (typeof s.shop === 'object' ? s.shop?.name : null) ||
        'Shop';

      const shopId = (typeof s.shop === 'object' ? s.shop?._id?.toString() : s.shop?.toString()) || s.shopId;
      const durationSeconds = s.callDurationSeconds || s.durationSeconds || 0;

      return {
        ...s,
        bookingId,
        customerName,
        barberName,
        shopName,
        shopId,
        durationSeconds,
      };
    });

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
