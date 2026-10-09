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
    const { searchParams } = new URL(request.url);

    // Accept phone number from any parameter OmniDimension sends
    const rawPhone =
      searchParams.get('phone_number') ||
      searchParams.get('phone') ||
      searchParams.get('caller_number') ||
      searchParams.get('caller_id') ||
      searchParams.get('from') ||
      searchParams.get('customer_phone') ||
      '';

    const digits = rawPhone.replace(/\D/g, '').slice(-10);

    const usersCol = await getDirectCollection('users');
    const shopsCol = await getDirectCollection('shops');

    let foundName = null;
    let isRegistered = false;

    if (digits && digits.length === 10) {
      const numDigits = parseInt(digits, 10);
      const regexPattern = digits + '$';

      // 1. Search in users collection
      if (usersCol) {
        const user = await usersCol.findOne({
          $or: [
            { phone: { $regex: regexPattern } },
            { phoneNumber: { $regex: regexPattern } },
            { mobile: { $regex: regexPattern } },
            { phone: numDigits },
            { phoneNumber: numDigits },
            { mobile: numDigits }
          ]
        }).catch(() => null);

        if (user) {
          foundName = user.name || user.fullName || user.username || user.first_name || null;
          isRegistered = true;
        }
      }

      // 2. If not found in users, check if caller is a shop owner
      if (!foundName && shopsCol) {
        const shop = await shopsCol.findOne({
          $or: [
            { 'owner.phone': { $regex: regexPattern } },
            { 'owner.phone': numDigits },
            { phone: { $regex: regexPattern } }
          ]
        }).catch(() => null);

        if (shop) {
          foundName = shop.owner?.name || shop.name || null;
          isRegistered = true;
        }
      }
    }

    return NextResponse.json({
      name: foundName,
      customer_name: foundName,
      is_registered: isRegistered,
      user_type: isRegistered ? 'registered_user' : 'guest',
      message: foundName
        ? `Customer is registered. Name: ${foundName}`
        : 'Customer is a guest user.'
    }, { headers: corsHeaders });

  } catch (err) {
    return NextResponse.json({
      name: null,
      is_registered: false,
      user_type: 'guest',
      message: 'Guest user'
    }, { headers: corsHeaders });
  }
}
