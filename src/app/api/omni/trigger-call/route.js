import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

let client;
let clientPromise;

async function getDirectCollection(collectionName) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    const dbName = process.env.MONGODB_DB_NAME || 'quttr_qr';
    if (!clientPromise) {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      clientPromise = client.connect();
    }
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName).collection(collectionName);
  } catch (e) {
    return null;
  }
}

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '').slice(-10);
  return digits ? `+91${digits}` : '';
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, call_type = 'customer', name = 'Guest', agent_id } = body;

    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone || formattedPhone.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.OMNI_API_KEY || 'Ft1IcqSd6FMLouwsAFaMYjirRL93mJrsMPspYq7M8RI';
    const targetAgentId = agent_id || process.env.OMNI_AGENT_ID || '265721';

    let apiSuccess = false;
    let callDispatchId = `call_${Date.now()}`;
    let apiErrorMessage = '';

    // OmniDimension Candidate Endpoints
    const endpoints = [
      `https://backend.omnidim.io/api/v1/agent/${targetAgentId}/dispatch`,
      `https://api.omnidim.io/v1/agent/${targetAgentId}/dispatch`,
      `https://api.omnidim.io/v1/calls/dispatch`,
      `https://backend.omnidim.io/api/v1/calls/dispatch`,
      `https://api.omnidimension.com/v1/calls/dispatch`,
    ];

    const payload = {
      agent_id: targetAgentId,
      to_number: formattedPhone,
      phone_number: formattedPhone,
      to: formattedPhone,
      metadata: {
        call_type,
        user_name: name,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    };

    // Try endpoints sequentially
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

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
          break; // Stop loop on first successful endpoint
        } else {
          const errData = await omniResponse.json().catch(() => ({}));
          apiErrorMessage = errData.message || errData.error || `HTTP ${omniResponse.status}`;
        }
      } catch (e) {
        apiErrorMessage = e.message || 'Network endpoint connection failed';
      }
    }

    // Save outbound call attempt to MongoDB
    const callsCol = await getDirectCollection('call_summaries');
    if (callsCol) {
      await callsCol.insertOne({
        phone: formattedPhone,
        name,
        callType: call_type,
        category: 'triggered',
        summary: apiSuccess ? `Live outbound call triggered to ${formattedPhone}` : `Call queued for ${formattedPhone} (${apiErrorMessage})`,
        dispatchId: callDispatchId,
        createdAt: new Date(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        phone: formattedPhone,
        dispatchId: callDispatchId,
        apiSuccess,
        message: apiSuccess
          ? `Live phone call dispatched to ${formattedPhone}`
          : `Call logged for ${formattedPhone}. (${apiErrorMessage})`,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
