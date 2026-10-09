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
    const district = (searchParams.get('district') || searchParams.get('city') || '').trim();
    const town = (searchParams.get('town') || searchParams.get('area') || searchParams.get('location') || '').trim();

    const shopsCol = await getDirectCollection('shops');
    let totalShops = 0;
    let totalShopsInDB = 0;

    if (shopsCol) {
      totalShopsInDB = await shopsCol.countDocuments({}).catch(() => 0);

      const searchTerms = [district, town].filter(Boolean);

      if (searchTerms.length > 0) {
        const orConditions = searchTerms.flatMap(term => [
          { 'address.city': { $regex: term, $options: 'i' } },
          { 'address.district': { $regex: term, $options: 'i' } },
          { 'address.town': { $regex: term, $options: 'i' } },
          { 'address.area': { $regex: term, $options: 'i' } },
          { 'address.addressLine': { $regex: term, $options: 'i' } },
          { city: { $regex: term, $options: 'i' } },
          { district: { $regex: term, $options: 'i' } },
          { town: { $regex: term, $options: 'i' } },
          { area: { $regex: term, $options: 'i' } },
          { name: { $regex: term, $options: 'i' } }
        ]);

        totalShops = await shopsCol.countDocuments({ $or: orConditions }).catch(() => 0);
      } else {
        totalShops = totalShopsInDB;
      }
    }

    const locName = town || district || 'आपके एरिया';
    
    let responseMsg = '';
    if (totalShops > 0) {
      responseMsg = `जी, ${locName} में हमारे पास ${totalShops} बार्बर शॉप्स लिस्टेड हैं। आप QUTTR ऐप डाउनलोड करके उनकी लिस्ट देख सकते हैं।`;
    } else if (totalShopsInDB > 0) {
      responseMsg = `अभी ${locName} में हम नई दुकानें जोड़ रहे हैं, लेकिन हमारे ऐप पर ${totalShopsInDB} से ज्यादा बार्बर दुकानें उपलब्ध हैं। आप Play Store से QUTTR ऐप देखकर जुड़ सकते हैं।`;
    } else {
      responseMsg = `अभी ${locName} में दुकानें जोड़ने का काम चल रहा है। आप अपने एरिया के नाई को कटर ऐप से जुड़ने की सलाह दे सकते हैं।`;
    }

    return NextResponse.json({
      total_shops: totalShops,
      location: locName,
      message: responseMsg
    }, { headers: corsHeaders });

  } catch (err) {
    return NextResponse.json({
      total_shops: 0,
      location: 'आपके एरिया',
      message: "आप Google Play Store पर QUTTR (कटर) सर्च करके अपने एरिया की बार्बर दुकानें देख सकते हैं।"
    }, { headers: corsHeaders });
  }
}
