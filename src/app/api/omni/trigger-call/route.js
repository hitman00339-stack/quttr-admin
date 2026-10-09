import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      client = new MongoClient(uri);
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
    const { phone, call_type = 'customer', name = 'Guest' } = body;

    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone || formattedPhone.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid 10-digit Indian phone number' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.OMNI_API_KEY;
    const agentId = process.env.OMNI_AGENT_ID;

    let apiSuccess = false;
    let callDispatchId = `call_${Date.now()}`;
    let apiErrorMessage = '';

    // If OmniDimension API credentials exist, trigger live dispatch
    if (apiKey && agentId) {
      try {
        const omniResponse = await fetch('https://api.omnidimension.com/v1/calls/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            agent_id: agentId,
            to_number: formattedPhone,
            metadata: {
              call_type,
              user_name: name,
            },
          }),
        });

        const omniData = await omniResponse.json();
        if (omniResponse.ok && omniData) {
          apiSuccess = true;
          callDispatchId = omniData.call_id || omniData.id || callDispatchId;
        } else {
          apiErrorMessage = omniData.message || omniData.error || 'OmniDimension rejected dispatch';
        }
      } catch (err) {
        apiErrorMessage = err.message;
      }
    } else {
      apiErrorMessage = 'OMNI_API_KEY or OMNI_AGENT_ID not set in .env.local';
    }

    // Log the call trigger event to MongoDB
    const callsCol = await getDirectCollection('call_summaries');
    if (callsCol) {
      await callsCol.insertOne({
        phone: formattedPhone,
        name,
        callType: call_type,
        category: 'triggered',
        summary: apiSuccess ? 'Outbound call dispatched live' : `Dispatch pending: ${apiErrorMessage}`,
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
          ? `Live call dispatched to ${formattedPhone}`
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
