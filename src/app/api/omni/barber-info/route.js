import { NextResponse } from 'next/server';
import { cleanPhone, getLiveShops, searchShopsByLocation } from '@/lib/omni-data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function handleBarberInfo(phoneInput, shopQueryInput, locationInput) {
  const phone = cleanPhone(phoneInput);
  const allShops = await getLiveShops();

  // 1. Search by phone number
  if (phone) {
    const matchedShop = allShops.find((s) => cleanPhone(s.ownerPhone) === phone);
    if (matchedShop) {
      return NextResponse.json(
        {
          success: true,
          is_registered: true,
          shop_name: matchedShop.name,
          owner_name: matchedShop.ownerName,
          phone: matchedShop.ownerPhone,
          city: matchedShop.city,
          area: matchedShop.area,
          starting_price: `₹${matchedShop.startingPrice}`,
          is_active: true,
          services: matchedShop.services,
          message: `जी, आप '${matchedShop.name}' (${matchedShop.city}) के ओनर ${matchedShop.ownerName} के रूप में QUTTR ऐप पर एक्टिव हैं।`,
        },
        { headers: corsHeaders }
      );
    }
  }

  // 2. Search by shop name or location if provided
  if (shopQueryInput || locationInput) {
    const { matchedShops } = await searchShopsByLocation(locationInput, shopQueryInput);
    if (matchedShops.length > 0) {
      const shop = matchedShops[0];
      return NextResponse.json(
        {
          success: true,
          is_registered: true,
          shop_name: shop.name,
          owner_name: shop.ownerName,
          phone: shop.ownerPhone,
          city: shop.city,
          area: shop.area,
          starting_price: `₹${shop.startingPrice}`,
          is_active: true,
          services: shop.services,
          message: `'${shop.name}' (${shop.ownerName}) QUTTR ऐप पर एक्टिव बार्बर शॉप है।`,
        },
        { headers: corsHeaders }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      is_registered: false,
      message: 'बार्बर शॉप QUTTR सिस्टम में अभी रजिस्टर नहीं है।',
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
      searchParams.get('caller_number') ||
      searchParams.get('caller_id') ||
      '';

    const shopQuery = searchParams.get('shop_name') || searchParams.get('shop') || '';
    const location = searchParams.get('location') || searchParams.get('city') || '';

    return await handleBarberInfo(rawPhone, shopQuery, location);
  } catch (err) {
    return NextResponse.json({ is_registered: false, error: err.message }, { headers: corsHeaders });
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
      body.phone_number ||
      body.phone ||
      body.caller_number ||
      body.caller_id ||
      searchParams.get('phone_number') ||
      searchParams.get('phone') ||
      '';

    const shopQuery = body.shop_name || body.shop || searchParams.get('shop_name') || '';
    const location = body.location || body.city || searchParams.get('location') || '';

    return await handleBarberInfo(rawPhone, shopQuery, location);
  } catch (err) {
    return NextResponse.json({ is_registered: false, error: err.message }, { headers: corsHeaders });
  }
}
