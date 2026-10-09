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

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.OMNI_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const reqCol = await getDirectCollection('missing_barber_requests');
    
    await reqCol.insertOne({
      customerPhone: body.customer_phone || 'N/A',
      barberName: body.barber_name || 'N/A',
      shopName: body.shop_name || 'N/A',
      area: body.area || 'N/A',
      district: body.district || 'N/A',
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ status: 'success', message: 'Recorded' }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
