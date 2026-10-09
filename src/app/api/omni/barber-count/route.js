import { NextResponse } from 'next/server';
import { searchShopsByLocation, getLiveShops } from '@/lib/omni-data';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function handleBarberQuery(districtInput, townInput) {
  const district = (districtInput || '').trim();
  const town = (townInput || '').trim();

  const { matchedShops, totalCount, locationName, isExactMatch } = await searchShopsByLocation(
    district,
    town
  );

  const topShops = matchedShops.slice(0, 3);
  const shopSummaries = topShops.map((s) => ({
    id: s.id,
    name: s.name,
    barber_name: s.ownerName,
    area: s.area || s.city,
    city: s.city,
    phone: s.ownerPhone,
    starting_price: `₹${s.startingPrice}`,
    popular_services: s.services?.slice(0, 3)?.map((x) => `${x.name} (₹${x.price})`).join(', ') || 'हेयरकट, शेविंग',
  }));

  const barbersList = topShops.map((s) => `${s.name} (${s.ownerName})`).join(', ');

  let spokenMessage = '';
  if (isExactMatch && topShops.length > 0) {
    const primaryShop = topShops[0];
    const otherShopsText = topShops.length > 1 ? ` और '${topShops[1].name}'` : '';
    spokenMessage = `जी, ${locationName} में हमारे पास ${totalCount} बार्बर दुकानें लिस्टेड हैं। जैसे कि '${primaryShop.name}' जिसके बार्बर ${primaryShop.ownerName} हैं (हेयरकट ₹${primaryShop.startingPrice} से शुरू)${otherShopsText}। आप QUTTR ऐप खोलकर तुरंत अपॉइंटमेंट बुक कर सकते हैं।`;
  } else if (matchedShops.length > 0) {
    const all = await getLiveShops();
    const primaryShop = all[0];
    spokenMessage = `जी, ${locationName} में हम अभी नई दुकानें जोड़ रहे हैं, लेकिन हमारे पास आसपास के इलाकों जैसे लखनऊ और सीतापुर में ${all.length} दुकानें उपलब्ध हैं, जैसे '${primaryShop.name}'। आप Google Play Store से QUTTR ऐप डाउनलोड करके अपने पसंदीदा बार्बर की बुकिंग कर सकते हैं।`;
  } else {
    spokenMessage = `जी, ${locationName} में दुकानें जोड़ने का काम चल रहा है। आप अपने एरिया के नाई को QUTTR ऐप से जुड़ने के लिए कह सकते हैं।`;
  }

  return NextResponse.json(
    {
      success: true,
      total_shops: totalCount,
      location: locationName,
      is_exact_match: isExactMatch,
      shops: shopSummaries,
      barbers_list: barbersList,
      message: spokenMessage,
    },
    { headers: corsHeaders }
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const district =
      searchParams.get('district') ||
      searchParams.get('city') ||
      searchParams.get('state') ||
      '';

    const town =
      searchParams.get('town') ||
      searchParams.get('area') ||
      searchParams.get('location') ||
      searchParams.get('locality') ||
      searchParams.get('q') ||
      '';

    return await handleBarberQuery(district, town);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        total_shops: 0,
        location: 'आपके एरिया',
        message: 'आप Google Play Store पर QUTTR (कटर) सर्च करके अपने एरिया की बार्बर दुकानें देख सकते हैं।',
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

    const district =
      body.district ||
      body.city ||
      searchParams.get('district') ||
      searchParams.get('city') ||
      '';

    const town =
      body.town ||
      body.area ||
      body.location ||
      body.locality ||
      body.q ||
      searchParams.get('town') ||
      searchParams.get('area') ||
      searchParams.get('location') ||
      '';

    return await handleBarberQuery(district, town);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        total_shops: 0,
        location: 'आपके एरिया',
        message: 'आप Google Play Store पर QUTTR (कटर) सर्च करके अपने एरिया की बार्बर दुकानें देख सकते हैं।',
      },
      { headers: corsHeaders }
    );
  }
}
