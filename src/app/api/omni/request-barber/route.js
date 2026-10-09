import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

const verifySecret = (req) => req.headers.get('authorization') === `Bearer ${process.env.OMNI_API_SECRET}`;

export async function POST(request) {
  if (!verifySecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const reqCol = await getCollection('missing_barber_requests');
    
    await reqCol.insertOne({
      ...body,
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
