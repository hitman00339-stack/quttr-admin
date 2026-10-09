import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// CORS Headers so OmniDimension dashboard can test directly from browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle Browser Preflight Check
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

const verifySecret = (req) => {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.OMNI_API_SECRET}`;
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

export async function GET(request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone_number') || searchParams.get('phone');
    const phone = normalizePhone(rawPhone);

    if (!phone) {
      return NextResponse.json(
        { name: null, is_registered: false, user_type: 'guest' },
        { headers: corsHeaders }
      );
    }

    const usersCol = await getDirectCollection('users');
    const user = await usersCol.findOne({ phone: { $regex: new RegExp(phone + '$') } });

    if (user) {
      return NextResponse.json(
        {
          name: user.name || user.fullName || null,
          is_registered: true,
          user_type: 'customer'
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { name: null, is_registered: false, user_type: 'guest' },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
