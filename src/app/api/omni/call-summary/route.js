import { NextResponse } from 'next/server';
import { getDirectMongoCollection } from '@/lib/omni-data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const callsCol = await getDirectMongoCollection('call_summaries');
    if (callsCol) {
      await callsCol
        .insertOne({
          phone: body.phone || 'N/A',
          name: body.name || 'Guest',
          callType: body.call_type || 'customer',
          category: body.category || 'general',
          summary: body.summary || '',
          transcript: body.transcript || '',
          createdAt: new Date(),
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, status: 'success' }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: true, status: 'success' }, { headers: corsHeaders });
  }
}
