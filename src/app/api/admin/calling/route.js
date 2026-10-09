import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET() {
  try {
    const callsCol = await getCollection('call_summaries');
    const reqCol = await getCollection('missing_barber_requests');
    const shopsCol = await getCollection('shops');

    const logs = await callsCol.find({}).sort({ createdAt: -1 }).limit(100).toArray();
    const missingRequests = await reqCol.find({}).sort({ createdAt: -1 }).toArray();
    
    const inactiveBarbers = await shopsCol
      .find({ $or: [{ isActive: false }, { approvalStatus: { $ne: 'approved' } }] })
      .project({ name: 1, 'owner.name': 1, 'owner.phone': 1 })
      .toArray();

    const categoriesCount = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ success: true, logs, missingRequests, inactiveBarbers, categoriesCount, totalCalls: logs.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
