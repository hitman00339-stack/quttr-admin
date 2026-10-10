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
      const titleName = (name && name !== 'Barber') ? `${name} जी` : '';

      const barberVariations = [
        titleName ? `हेलो ${titleName}? क्या मेरी आवाज़ आ रही है आपको?` : `हेलो? क्या मेरी आवाज़ आ रही है आपको?`,
        titleName ? `हेलो? हाँजी ${titleName}, क्या मेरी आवाज़ साफ़ आ रही है आपको?` : `हेलो? क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        titleName ? `हेलो ${titleName}? सुन पा रहे हैं ना आप मुझे?` : `हेलो? सुन पा रहे हैं ना आप मुझे?`,
        titleName ? `हेलो ${titleName}! क्या मेरी आवाज़ आ रही है आपको?` : `हेलो? आवाज़ आ रही है ना आपको?`,
        `हेलो? हाँजी, आवाज़ आ रही है ना आपको?`
      ];

      const selectedIdx = variationIdx >= 0 ? (variationIdx % barberVariations.length) : Math.floor(Math.random() * barberVariations.length);
      greeting = barberVariations[selectedIdx];
    } else {
      // Customer mode
      if (!name || name === 'Guest' || name === 'Customer' || name === 'User') {
        if (details.found && details.name && details.name !== 'Customer' && details.name !== 'Guest') {
          name = details.name;
        } else {
          name = '';
        }
      }
      const titleName = name ? `${name} जी` : '';

      const customerVariations = [
        titleName ? `हेलो ${titleName}? क्या मेरी आवाज़ आ रही है आपको?` : `हेलो? क्या मेरी आवाज़ आ रही है आपको?`,
        titleName ? `हेलो? हाँजी ${titleName}, क्या मेरी आवाज़ साफ़ आ रही है आपको?` : `हेलो? क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        titleName ? `हेलो ${titleName}? सुन पा रहे हैं आप मुझे?` : `हेलो? सुन पा रहे हैं आप मुझे?`,
        titleName ? `हेलो ${titleName}! मेरी आवाज़ आ रही है ना आपको?` : `हेलो? मेरी आवाज़ आ रही है ना आपको?`,
        `हेलो? हाँजी, आवाज़ आ रही है आपको?`,
        `हेलो? क्या मेरी आवाज़ साफ़ आ रही है आपको?`
      ];

      const selectedIdx = variationIdx >= 0 ? (variationIdx % customerVariations.length) : Math.floor(Math.random() * customerVariations.length);
      greeting = customerVariations[selectedIdx];
    }

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = agent_id || process.env.OMNI_AGENT_ID || '265888';

    let apiSuccess = false;
    let callDispatchId = `call_${Date.now()}`;
    let apiErrorMessage = '';

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

    const dispatchUrl = 'https://backend.omnidim.io/api/v1/calls/dispatch';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for SIP trunk allocation

      const omniResponse = await fetch(dispatchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (omniResponse.ok) {
        const resData = await omniResponse.json().catch(() => ({}));
        apiSuccess = true;
        callDispatchId = resData.requestId || resData.call_id || resData.id || resData.dispatch_id || callDispatchId;
        apiErrorMessage = 'Dispatched successfully';
      } else {
        const errData = await omniResponse.json().catch(() => ({}));
        apiErrorMessage = errData.message || errData.error_description || errData.error || `HTTP ${omniResponse.status}`;
      }
    } catch (e) {
      apiErrorMessage = e.name === 'AbortError' ? 'Telephony carrier timeout (trunk busy)' : (e.message || 'Carrier network error');
    }

    // Save outbound call summary to MongoDB
    const displayName = name || (call_type === 'barber' ? 'Barber' : 'User');
    const summaryText = call_type === 'barber'
      ? `Personalized barber feedback call dispatched to ${displayName} (${shop_name ? `Shop: ${shop_name}` : 'Registered Barber'}). Number: ${formattedPhone}. Status: ${apiSuccess ? 'Dispatched' : 'Queued'}.`
      : `Customer call dispatched to ${displayName} (${formattedPhone}). Pitch: QUTTR app intro, zero-waiting salon booking & rate check. Status: ${apiSuccess ? 'Dispatched' : 'Queued'}.`;

    const callsCol = await getDirectMongoCollection('call_summaries');
    if (callsCol) {
      await callsCol
        .insertOne({
          phone: formattedPhone,
          name: name || '',
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
        success: apiSuccess,
        phone: formattedPhone,
        customer_name: name || '',
        shop_name: shop_name || '',
        call_type,
        greeting,
        summary: summaryText,
        dispatchId: callDispatchId,
        apiSuccess,
        message: apiSuccess
          ? `Live phone call dispatched to ${displayName} (${formattedPhone})`
          : `Call dispatch failed: ${apiErrorMessage}`,
        error: apiSuccess ? undefined : apiErrorMessage,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
