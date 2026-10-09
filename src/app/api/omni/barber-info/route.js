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

const normalizePhone = (phone) => phone ? phone.replace(/\D/g, '').slice(-10) : '';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.OMNI_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone_number') || searchParams.get('phone');
    const phone = normalizePhone(rawPhone);

    if (!phone) return NextResponse.json({ is_registered: false }, { headers: corsHeaders });

    const shopsCol = await getDirectCollection('shops');
    const shop = await shopsCol.findOne({ 'owner.phone': { $regex: new RegExp(phone + '$') } });

    if (shop) {
      return NextResponse.json({
        is_registered: true,
        shop_name: shop.name || 'Your Shop',
        owner_name: shop.owner?.name || 'Owner',
        is_active: shop.isActive && shop.approvalStatus === 'approved'
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ is_registered: false }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
