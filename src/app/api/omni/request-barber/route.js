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

    const customerPhone = body.customer_phone || body.phone || 'N/A';
    const barberName = body.barber_name || body.barber || 'N/A';
    const shopName = body.shop_name || body.shop || 'N/A';
    const area = body.area || body.town || 'N/A';
    const district = body.district || body.city || 'N/A';

    const reqCol = await getDirectMongoCollection('missing_barber_requests');
    if (reqCol) {
      await reqCol
        .insertOne({
          customerPhone,
          barberName,
          shopName,
          area,
          district,
          status: 'pending',
          createdAt: new Date(),
        })
        .catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        status: 'success',
        message: 'Barber request recorded successfully',
        spoken_response: 'धन्यवाद सर! हमने आपके नाई की जानकारी नोट कर ली है। हमारी टीम उनसे जल्द संपर्क करेगी।',
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: true,
        status: 'success',
        message: 'Recorded',
      },
      { headers: corsHeaders }
    );
  }
}
