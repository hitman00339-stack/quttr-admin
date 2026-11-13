import { NextResponse } from 'next/server';
import { getDirectMongoCollection } from '@/lib/omni-data';
import { verifyServerAuth } from '@/lib/admin-auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const authCheck = verifyServerAuth(request, { requireAdmin: true });
    if (!authCheck.success) {
      return authCheck.response;
    }

    const configCol = await getDirectMongoCollection('booking_call_config');
    let config = null;
    if (configCol) {
      config = await configCol.findOne({ key: 'booking_acceptance_config' });
    }

    const defaultConfig = {
      globalCallingEnabled: true,
      shopCallingOverrides: {},
      updatedAt: new Date(),
    };

    return NextResponse.json(
      {
        success: true,
        config: config?.value || defaultConfig,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const authCheck = verifyServerAuth(request, { requireAdmin: true });
    if (!authCheck.success) {
      return authCheck.response;
    }

    const body = await request.json();
    const { globalCallingEnabled, shopCallingOverrides, shopId, enabled } = body;

    const configCol = await getDirectMongoCollection('booking_call_config');
    if (!configCol) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503, headers: corsHeaders });
    }

    let existing = await configCol.findOne({ key: 'booking_acceptance_config' });
    const currentVal = existing?.value || { globalCallingEnabled: true, shopCallingOverrides: {} };

    if (typeof globalCallingEnabled === 'boolean') {
      currentVal.globalCallingEnabled = globalCallingEnabled;
    }

    if (shopCallingOverrides && typeof shopCallingOverrides === 'object') {
      currentVal.shopCallingOverrides = { ...currentVal.shopCallingOverrides, ...shopCallingOverrides };
    }

    if (shopId && typeof enabled === 'boolean') {
      currentVal.shopCallingOverrides = currentVal.shopCallingOverrides || {};
      currentVal.shopCallingOverrides[shopId] = enabled;
    }

    currentVal.updatedAt = new Date();

    if (existing) {
      await configCol.updateOne({ key: 'booking_acceptance_config' }, { $set: { value: currentVal } });
    } else {
      await configCol.insertOne({ key: 'booking_acceptance_config', value: currentVal, createdAt: new Date() });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Calling configuration updated successfully',
        config: currentVal,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

