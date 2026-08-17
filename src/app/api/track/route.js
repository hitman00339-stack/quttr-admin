import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event, qr_id, session_id, event_detail } = body;

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event type required' },
        { status: 400 }
      );
    }

    // Store event in database
    const pageEvents = await getCollection('page_events');
    
    await pageEvents.insertOne({
      event_type: event,
      qr_id: qr_id || null,
      session_id: session_id || null,
      event_detail: event_detail || null,
      occurred_at: new Date(),
      user_agent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    // Don't fail user experience, just log
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
