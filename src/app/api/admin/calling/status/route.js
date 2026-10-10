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
    const sinceParam = searchParams.get('since'); // optional dispatch timestamp ms

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone parameter is required' }, { status: 400, headers: corsHeaders });
    }

    const digits = String(phone).replace(/\D/g, '').slice(-10);
    const formattedPhone = digits ? `+91${digits}` : '';
    const sinceMs = sinceParam ? Number(sinceParam) : Date.now() - 15 * 60 * 1000;

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = process.env.OMNI_AGENT_ID || '265888';

    // OmniDimension does not filter by to_number on the server; fetch last 30 logs and match client-side
    const url = `https://backend.omnidim.io/api/v1/calls/logs?agent_id=${targetAgentId}&page_size=30`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, isLive: true, hasEnded: false, status: 'unknown' }, { headers: corsHeaders });
    }

    const data = await res.json();
    const logs = data.call_log_data || [];

    // Find the latest call matching this specific phone number
    const matchingCall = logs.find((c) => {
      const cDigits = String(c.to_number || '').replace(/\D/g, '').slice(-10);
      if (cDigits !== digits) return false;

      // Verify call time is recent (within 10s of dispatch or after dispatch)
      if (c.time_of_call) {
        const parts = String(c.time_of_call).trim().split(' ');
        if (parts.length === 2) {
          const [dPart, tPart] = parts;
          const [m, d, y] = dPart.split('/').map(Number);
          const [hh, mm, ss] = tPart.split(':').map(Number);
          const callUtcMs = Date.UTC(y, m - 1, d, hh, mm, ss || 0);
          // If call happened before sinceMs - 30 seconds buffer, ignore older calls
          if (callUtcMs < sinceMs - 30000) return false;
        }
      }
      return true;
    });

    if (!matchingCall) {
      return NextResponse.json({
        success: true,
        found: false,
        isLive: true,
        hasEnded: false,
        status: 'in-progress',
      }, { headers: corsHeaders });
    }

    const statusStr = String(matchingCall.call_status || '').toLowerCase();
    const terminalStatuses = ['completed', 'no-answer', 'busy', 'failed', 'canceled', 'voicemail'];
    const hasEnded = terminalStatuses.includes(statusStr);

    const recordingUrl = matchingCall.internal_recording_url || (matchingCall.recording_url ? `https://omnidim.io${matchingCall.recording_url}` : '');

    return NextResponse.json({
      success: true,
      found: true,
      callId: matchingCall.id,
      phone: matchingCall.to_number,
      status: matchingCall.call_status,
      isLive: !hasEnded,
      hasEnded,
      durationSeconds: matchingCall.call_duration_in_seconds || 0,
      summary: matchingCall.sentiment_analysis_details || '',
      recordingUrl,
      timeOfCall: matchingCall.time_of_call,
    }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, isLive: true, hasEnded: false }, { status: 500, headers: corsHeaders });
  }
}
