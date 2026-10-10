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
    let { phone, call_type = 'customer', name = '', shop_name = '', owner_name = '', agent_id } = body;

    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone || formattedPhone.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Auto-resolve personal and shop details
    const details = await lookupPersonalDetails(formattedPhone);

    let greeting = '';
    const variationIdx = body.variation_index !== undefined ? Number(body.variation_index) : -1;

    if (call_type === 'barber') {
      if (!owner_name && details.found && details.userType === 'shop_owner') {
        owner_name = details.name;
        shop_name = shop_name || details.shopName;
      }
      name = owner_name || name || (details.found ? details.name : 'Barber');
      const cleanShop = shop_name || (details.found ? details.shopName : '');
      const titleName = (name && name !== 'Barber') ? `${name} जी` : 'जी';

      const barberVariations = [
        `हेलो? नमस्ते ${titleName}, क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो ${titleName}? हाँजी, क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        `हेलो? नमस्ते ${titleName}, सुन पा रहे हैं ना आप मुझे?`,
        `हेलो ${titleName}! रिया बात कर रही हूँ, क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो? हाँजी नमस्ते ${titleName}, आवाज़ आ रही है ना आपको?`
      ];

      const selectedIdx = variationIdx >= 0 ? (variationIdx % barberVariations.length) : Math.floor(Math.random() * barberVariations.length);
      greeting = barberVariations[selectedIdx];
    } else {
      // Customer mode
      if (!name || name === 'Guest' || name === 'Customer') {
        if (details.found && details.name) {
          name = details.name;
        } else {
          name = 'Customer';
        }
      }
      const titleName = (name && name !== 'Customer') ? `${name} जी` : 'जी';

      const customerVariations = [
        `हेलो? नमस्ते ${titleName}, क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो ${titleName}? हाँजी, क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        `हेलो? नमस्ते ${titleName}, सुन पा रहे हैं आप मुझे?`,
        `हेलो ${titleName}! मेरी आवाज़ आ रही है ना आपको?`,
        `हेलो? हाँजी नमस्ते ${titleName}, आवाज़ आ रही है आपको?`,
        `हेलो ${titleName}? रिया बात कर रही हूँ, क्या मेरी आवाज़ आ रही है आपको?`
      ];

      const selectedIdx = variationIdx >= 0 ? (variationIdx % customerVariations.length) : Math.floor(Math.random() * customerVariations.length);
      greeting = customerVariations[selectedIdx];
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
        greeting,
        customer_name: name,
        user_name: name,
        name: name,
        owner_name: owner_name || name,
        shop_name: shop_name || '',
        phone: formattedPhone,
        call_type,
      },
      dynamic_variables: {
        greeting,
        customer_name: name,
        user_name: name,
        name: name,
        owner_name: owner_name || name,
        shop_name: shop_name || '',
        call_type,
      },
      metadata: {
        call_type,
        user_name: name,
        customer_name: name,
        shop_name: shop_name || '',
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

    // Save outbound call summary to MongoDB
    const summaryText = call_type === 'barber'
      ? `Personalized barber feedback call dispatched to ${name} (${shop_name ? `Shop: ${shop_name}` : 'Registered Barber'}). Number: ${formattedPhone}. Status: ${apiSuccess ? 'Dispatched' : 'Queued'}.`
      : `Customer outreach call dispatched to ${name} (${formattedPhone}). Pitch: Nearby barber booking & app intro. Status: ${apiSuccess ? 'Dispatched' : 'Queued'}.`;

    const callsCol = await getDirectMongoCollection('call_summaries');
    if (callsCol) {
      await callsCol
        .insertOne({
          phone: formattedPhone,
          name,
          callType: call_type,
          shopName: shop_name || '',
          category: call_type === 'barber' ? 'barber_feedback' : 'customer_pitch',
          summary: summaryText,
          greetingUsed: greeting,
          dispatchId: callDispatchId,
          status: apiSuccess ? 'dispatched' : 'queued',
          createdAt: new Date(),
        })
        .catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        phone: formattedPhone,
        customer_name: name,
        shop_name: shop_name || '',
        call_type,
        greeting,
        summary: summaryText,
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
