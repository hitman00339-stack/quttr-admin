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
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");
  const dbName = process.env.MONGODB_DB_NAME || 'quttr_qr';
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName).collection(collectionName);
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.OMNI_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || '';
    const town = searchParams.get('town') || '';

    const shopsCol = await getDirectCollection('shops');
    const query = { approvalStatus: 'approved', isActive: true };

    if (district) query['address.district'] = { $regex: new RegExp(district, 'i') };
    if (town) {
      query['$or'] = [
        { 'address.city': { $regex: new RegExp(town, 'i') } },
        { 'address.town': { $regex: new RegExp(town, 'i') } }
      ];
    }

    const count = await shopsCol.countDocuments(query);
    const location = town || district || 'आपके एरिया';

    const msg = count > 0 
      ? `जी, ${location} में हमारे पास ${count} बार्बर शॉप्स लिस्टेड हैं।` 
      : `अभी ${location} में हम दुकानें जोड़ रहे हैं। आप अपने बार्बर को कटर ऐप से जुड़ने के लिए कह सकते हैं।`;

    return NextResponse.json({ total_shops: count, message: msg }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
