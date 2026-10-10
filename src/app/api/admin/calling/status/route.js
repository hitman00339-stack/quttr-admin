import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone parameter is required' }, { status: 400, headers: corsHeaders });
    }

    const digits = String(phone).replace(/\D/g, '').slice(-10);
    const formattedPhone = digits ? `+91${digits}` : '';

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = process.env.OMNI_AGENT_ID || '265888';

    const url = `https://backend.omnidim.io/api/v1/calls/logs?agent_id=${targetAgentId}&to_number=${encodeURIComponent(formattedPhone)}&page_size=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, isLive: false, status: 'unknown' }, { headers: corsHeaders });
    }

    const data = await res.json();
    const latest = (data.call_log_data || [])[0];

    if (!latest) {
      return NextResponse.json({
        success: true,
        found: false,
        isLive: false,
        hasEnded: false,
        status: 'pending',
      }, { headers: corsHeaders });
    }

    const statusStr = String(latest.call_status || '').toLowerCase();
    const liveStatuses = ['in-progress', 'ringing', 'dialing', 'calling', 'initiated', 'live'];
    const terminalStatuses = ['completed', 'no-answer', 'busy', 'failed', 'canceled', 'voicemail'];

    const isLive = liveStatuses.includes(statusStr);
    const hasEnded = terminalStatuses.includes(statusStr);

    const recordingUrl = latest.internal_recording_url || (latest.recording_url ? `https://omnidim.io${latest.recording_url}` : '');

    return NextResponse.json({
      success: true,
      found: true,
      callId: latest.id,
      phone: latest.to_number,
      status: latest.call_status,
      isLive,
      hasEnded,
      durationSeconds: latest.call_duration_in_seconds || 0,
      summary: latest.sentiment_analysis_details || '',
      recordingUrl,
      timeOfCall: latest.time_of_call,
    }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, isLive: false }, { status: 500, headers: corsHeaders });
  }
}
