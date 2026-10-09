import { NextResponse } from 'next/server';
import { lookupPersonalDetails } from '@/lib/omni-data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function handleCustomerInfo(phoneInput) {
  const result = await lookupPersonalDetails(phoneInput);

  return NextResponse.json(
    {
      success: true,
      name: result.name,
      customer_name: result.name,
      phone: result.phone,
      phone_number: result.phone,
      formatted_phone: result.formattedPhone,
      is_registered: result.isRegistered,
      user_type: result.userType,
      role: result.role,
      city: result.city || 'Uttar Pradesh',
      shop_name: result.shopName || null,
      personal_details: result.spokenDetails,
      message: result.spokenDetails,
      summary: result.spokenMessage,
    },
    { headers: corsHeaders }
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawPhone =
      searchParams.get('phone_number') ||
      searchParams.get('phone') ||
      searchParams.get('to_number') ||
      searchParams.get('to') ||
      searchParams.get('caller_number') ||
      searchParams.get('caller_id') ||
      searchParams.get('from') ||
      searchParams.get('customer_phone') ||
      searchParams.get('mobile') ||
      searchParams.get('number') ||
      request.headers.get('x-to-number') ||
      request.headers.get('x-call-to') ||
      '';

    return await handleCustomerInfo(rawPhone);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        name: 'Guest',
        customer_name: 'Guest',
        is_registered: false,
        user_type: 'guest',
        message: 'Guest customer',
      },
      { headers: corsHeaders }
    );
  }
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const { searchParams } = new URL(request.url);

    const rawPhone =
      body.to_number ||
      body.phone_number ||
      body.phone ||
      body.customer_phone ||
      body.caller_number ||
      body.caller_id ||
      body.from ||
      body.to ||
      body.mobile ||
      body.number ||
      searchParams.get('to_number') ||
      searchParams.get('phone_number') ||
      searchParams.get('phone') ||
      '';

    return await handleCustomerInfo(rawPhone);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        name: 'Guest',
        customer_name: 'Guest',
        is_registered: false,
        user_type: 'guest',
        message: 'Guest customer',
      },
      { headers: corsHeaders }
    );
  }
}
