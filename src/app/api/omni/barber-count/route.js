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
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      clientPromise = client.connect();
    }
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName).collection(collectionName);
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.OMNI_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const district = (searchParams.get('district') || '').trim();
    const town = (searchParams.get('town') || '').trim();

    const shopsCol = await getDirectCollection('shops');
    let count = 0;

    if (shopsCol) {
      const locationFilters = [];
      if (district) {
        locationFilters.push({ 'address.district': { $regex: district, $options: 'i' } });
        locationFilters.push({ 'address.city': { $regex: district, $options: 'i' } });
      }
      if (town) {
        locationFilters.push({ 'address.town': { $regex: town, $options: 'i' } });
        locationFilters.push({ 'address.city': { $regex: town, $options: 'i' } });
        locationFilters.push({ 'address.area': { $regex: town, $options: 'i' } });
      }

      const query = locationFilters.length > 0 ? { $or: locationFilters } : {};
      count = await shopsCol.countDocuments(query).catch(() => 0);
    }

    const location = town || district || 'आपके एरिया';
    const msg = count > 0 
      ? `जी, ${location} में हमारे पास ${count} बार्बर शॉप्स लिस्टेड हैं। क्या आप ऐप डाउनलोड करने की जानकारी चाहते हैं?` 
      : `अभी ${location} में हम दुकानें जोड़ रहे हैं। आप अपने बार्बर को कटर ऐप से जुड़ने के लिए कह सकते हैं।`;

    return NextResponse.json({ total_shops: count, message: msg }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({
      total_shops: 0,
      message: "जी, आप Google Play Store पर 'QUTTR' सर्च करके अपने एरिया की बार्बर दुकानें देख सकते हैं।"
    }, { headers: corsHeaders });
  }
}
