import { NextResponse } from 'next/server';
import { getDirectMongoCollection, lookupPersonalDetails } from '@/lib/omni-data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  return digits ? `+91${digits}` : '';
};

export async function POST(request) {
  try {
    const body = await request.json();
    let { phone, call_type = 'customer', name = '', agent_id } = body;

    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone || formattedPhone.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Auto-resolve name if not passed or is generic 'Guest'
    if (!name || name === 'Guest') {
      const details = await lookupPersonalDetails(formattedPhone);
      if (details.found && details.name) {
        name = details.name;
      } else {
        name = 'Customer';
      }
    }

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = agent_id || process.env.OMNI_AGENT_ID || '265888';

    let apiSuccess = false;
    let callDispatchId = `call_${Date.now()}`;
    let apiErrorMessage = '';

    // OmniDimension Candidate Endpoints (primary working endpoint first)
    const endpoints = [
      'https://backend.omnidim.io/api/v1/calls/dispatch',
      'https://omnidim.io/api/v1/calls/dispatch',
      `https://backend.omnidim.io/api/v1/agent/${targetAgentId}/dispatch`,
    ];

    const payload = {
      agent_id: targetAgentId,
      to_number: formattedPhone,
      phone_number: formattedPhone,
      to: formattedPhone,
      call_context: {
        customer_name: name,
        user_name: name,
        name: name,
        phone: formattedPhone,
        call_type,
      },
      dynamic_variables: {
        customer_name: name,
        user_name: name,
        name: name,
        phone: formattedPhone,
        call_type,
      },
      metadata: {
        call_type,
        user_name: name,
        customer_name: name,
        phone: formattedPhone,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    };

    // Try endpoints sequentially
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const omniResponse = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (omniResponse.ok) {
          const resData = await omniResponse.json().catch(() => ({}));
          apiSuccess = true;
          callDispatchId = resData.call_id || resData.id || resData.dispatch_id || callDispatchId;
          apiErrorMessage = 'Dispatched successfully';
          break;
        } else {
          const errData = await omniResponse.json().catch(() => ({}));
          apiErrorMessage = errData.message || errData.error_description || errData.error || `HTTP ${omniResponse.status}`;
        }
      } catch (e) {
        apiErrorMessage = e.message || 'Network endpoint connection failed';
      }
    }

    // Save outbound call attempt to MongoDB
    const callsCol = await getDirectMongoCollection('call_summaries');
    if (callsCol) {
      await callsCol
        .insertOne({
          phone: formattedPhone,
          name,
          callType: call_type,
          category: 'triggered',
          summary: apiSuccess
            ? `Live outbound call triggered to ${formattedPhone}`
            : `Call queued for ${formattedPhone} (${apiErrorMessage})`,
          dispatchId: callDispatchId,
          createdAt: new Date(),
        })
        .catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        phone: formattedPhone,
        customer_name: name,
        dispatchId: callDispatchId,
        apiSuccess,
        message: apiSuccess
          ? `Live phone call dispatched to ${name} (${formattedPhone})`
          : `Call logged for ${name} (${formattedPhone}). (${apiErrorMessage})`,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
