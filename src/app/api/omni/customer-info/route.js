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

const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.OMNI_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone_number') || searchParams.get('phone');
    const phone10 = normalizePhone(rawPhone);

    if (!phone10) {
      return NextResponse.json({ name: null, is_registered: false, user_type: 'guest' }, { headers: corsHeaders });
    }

    const usersCol = await getDirectCollection('users');
    let user = null;

    if (usersCol) {
      const phoneNum = parseInt(phone10, 10);
      
      // Search across phone, phoneNumber, mobile (String & Number formats)
      user = await usersCol.findOne({
        $or: [
          { phone: { $regex: phone10 + '$' } },
          { phoneNumber: { $regex: phone10 + '$' } },
          { mobile: { $regex: phone10 + '$' } },
          { phone: phoneNum },
          { phoneNumber: phoneNum },
          { mobile: phoneNum }
        ]
      }).catch(() => null);
    }

    if (user) {
      const foundName = user.name || user.fullName || user.username || user.ownerName || null;
      return NextResponse.json({
        name: foundName,
        is_registered: true,
        user_type: 'customer',
        message: foundName ? `User name is ${foundName}` : "Name not found"
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ name: null, is_registered: false, user_type: 'guest' }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ name: null, is_registered: false, user_type: 'guest' }, { headers: corsHeaders });
  }
}
