import axios from 'axios';
import { MongoClient } from 'mongodb';

// ═══════════════════════════════════════════════════
// QUTTR AI CALLING (OMNIDIMENSION) DATA SERVICE
// ═══════════════════════════════════════════════════

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

// In-memory cache for live shops
let shopsCache = null;
let lastShopsFetchTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// Fallback verified real shops active on QUTTR
export const VERIFIED_SHOPS = [
  {
    id: '6ab2254e7898a2c402d97004',
    name: 'SS hair wig house and unisex salon',
    ownerName: 'Salman Ali',
    ownerPhone: '+919559071284',
    city: 'Lucknow',
    district: 'Lucknow',
    area: 'Kamta, Indira Nagar, Gomti Nagar',
    address: 'Kamta, Lucknow',
    startingPrice: 99,
    services: [
      { name: 'Haircut', price: 99 },
      { name: 'Beard', price: 79 },
      { name: 'Combo', price: 150 },
      { name: 'Starting Facial', price: 399 },
      { name: 'Hair patch', price: 499 },
    ],
  },
  {
    id: '6aa7b5407898a2c402d797d0',
    name: 'Perfect HairCut Saloon',
    ownerName: 'Jahid',
    ownerPhone: '+918726624862',
    city: 'Sitapur',
    district: 'Sitapur',
    area: 'Arya Nagar',
    address: 'Arya Nagar, Sitapur',
    startingPrice: 100,
    services: [
      { name: 'HairCut', price: 100 },
      { name: 'Beard', price: 50 },
      { name: 'Combo', price: 150 },
      { name: 'Simple Facial', price: 600 },
    ],
  },
  {
    id: '6aa7d6077898a2c402d7f596',
    name: "A2Z Men's Salon",
    ownerName: 'Tabrez',
    ownerPhone: '+918429137534',
    city: 'Sitapur',
    district: 'Sitapur',
    area: 'Nai Basti',
    address: 'Nai Basti, Sitapur',
    startingPrice: 50,
    services: [
      { name: 'Haircut', price: 50 },
      { name: 'Beard', price: 30 },
      { name: 'Combo', price: 80 },
      { name: 'Normal Facial', price: 350 },
    ],
  },
  {
    id: '6aa667dbcbeec31911b13744',
    name: "Z Men's Saloon",
    ownerName: 'Lateef',
    ownerPhone: '+917897087517',
    city: 'Sidhauli',
    district: 'Sitapur',
    area: 'Bahadurpur, Sidhauli',
    address: 'Bahadurpur, Sidhauli',
    startingPrice: 40,
    services: [
      { name: 'Haircut', price: 40 },
      { name: 'Denim Beard Special', price: 40 },
      { name: 'Normal Beard', price: 30 },
      { name: 'Massage', price: 100 },
    ],
  },
  {
    id: '6aa676d4ea58bd133ac90dad',
    name: 'Stylish Hair Saloon',
    ownerName: 'Akash Shrivastav',
    ownerPhone: '+918174985721',
    city: 'Sidhauli',
    district: 'Sitapur',
    area: 'Sidhauli Market',
    address: 'Sidhauli',
    startingPrice: 50,
    services: [
      { name: 'Haircut', price: 50 },
      { name: 'Beard', price: 30 },
      { name: 'Facial', price: 180 },
      { name: 'Normal Massage', price: 50 },
    ],
  },
  {
    id: '6aa0f1f0639f57b24627a6a0',
    name: "Sakir Men's Parler",
    ownerName: 'Sakir Ali',
    ownerPhone: '+917275595196',
    city: 'Mahmudabad',
    district: 'Sitapur',
    area: 'Sundoli, Mahmudabad',
    address: 'Sundoli, Mahmudabad',
    startingPrice: 40,
    services: [
      { name: 'Haircut', price: 40 },
      { name: 'Beard', price: 30 },
      { name: 'Combo', price: 70 },
      { name: 'Facial', price: 150 },
    ],
  },
  {
    id: '6a8f9b1f0b050adbc73fc269',
    name: 'Javed Hair Cutting Salon',
    ownerName: 'Javed',
    ownerPhone: '+919169920886',
    city: 'Mahmudabad',
    district: 'Sitapur',
    area: 'Mahmudabad',
    address: 'Mahmudabad',
    startingPrice: 30,
    services: [
      { name: 'Haircut', price: 30 },
      { name: 'Beard', price: 20 },
      { name: 'Combo', price: 50 },
      { name: 'Dtan', price: 120 },
    ],
  },
  {
    id: '6a8dccdeaf4d0a40368acfc5',
    name: 'Nirmal Yadav Hair Cutting ✂️',
    ownerName: 'Ritik Bhaiya',
    ownerPhone: '+918175044956',
    city: 'Baloiya',
    district: 'Sitapur',
    area: 'Lalpur',
    address: 'Lalpur',
    startingPrice: 120,
    services: [
      { name: 'Haircut', price: 120 },
      { name: 'massage', price: 250 },
    ],
  },
  {
    id: '6a9e76bbb9a44affb7c0b04b',
    name: 'बाम्बे स्टाइल हेयर ट्रेसर',
    ownerName: 'वकील',
    ownerPhone: '+919696642082',
    city: 'Chunka',
    district: 'Sitapur',
    area: 'Chunka',
    address: 'Chunka',
    startingPrice: 25,
    services: [
      { name: 'बाल कटिंग', price: 25 },
      { name: 'दाढ़ी कटिंग', price: 20 },
      { name: 'बाल दाढ़ी दोनो', price: 40 },
    ],
  },
  {
    id: '6a8fe7c7a3fa3089a8e16e71',
    name: 'Sufiyan Hair Cutting Saloon',
    ownerName: 'Sufiyan',
    ownerPhone: '+916393160244',
    city: 'Sitapur',
    district: 'Sitapur',
    area: 'लालपुर चौराहा भट्टा',
    address: 'लालपुर चौराहा',
    startingPrice: 20,
    services: [
      { name: 'बाल कटिंग', price: 20 },
      { name: 'दाढ़ी कटिंग', price: 20 },
      { name: 'बाल दाढ़ी दोनों', price: 40 },
    ],
  },
  {
    id: '6a8fe33ba3fa3089a8e16838',
    name: 'Intiaz Hair Cutting✂',
    ownerName: 'Intiaz',
    ownerPhone: '+919696204492',
    city: 'Rehuwa',
    district: 'Sitapur',
    area: 'Rehuwa',
    address: 'Rehuwa',
    startingPrice: 50,
    services: [
      { name: 'Haircut', price: 50 },
      { name: 'Beard', price: 30 },
      { name: 'Combo', price: 70 },
    ],
  },
  {
    id: '6a9ac56ae5129d35d2e24d06',
    name: 'लुक्स पार्लर',
    ownerName: 'MOHD ARMAN',
    ownerPhone: '+919116205974',
    city: 'Nawagaon',
    district: 'Sitapur',
    area: 'Nawagaon',
    address: 'Nawagaon',
    startingPrice: 30,
    services: [
      { name: 'Haircut', price: 30 },
      { name: 'Beard', price: 20 },
      { name: 'Combo', price: 60 },
    ],
  },
  {
    id: '6a96caebbd8bb76ef482f7b6',
    name: 'Shami Hair Cutting Salon',
    ownerName: 'Shami Khan',
    ownerPhone: '+917084830543',
    city: 'Bajwapur',
    district: 'Sitapur',
    area: 'Bajwapur',
    address: 'Bajwapur',
    startingPrice: 30,
    services: [
      { name: 'Haircut', price: 30 },
      { name: 'Beard', price: 30 },
      { name: 'Combo', price: 60 },
    ],
  },
  {
    id: '6a9029b87b92d439ee598ba6',
    name: 'न्यू आफ़ाकहेयर सैलून',
    ownerName: 'आफाक',
    ownerPhone: '+918795049802',
    city: 'Birampur',
    district: 'Sitapur',
    area: 'Birampur',
    address: 'Birampur',
    startingPrice: 30,
    services: [
      { name: 'Haircut', price: 30 },
      { name: 'Beard', price: 20 },
      { name: 'Combo', price: 60 },
    ],
  },
  {
    id: '6a8ffb9aa3fa3089a8e17752',
    name: 'Danish Hedshal',
    ownerName: 'Danish',
    ownerPhone: '+918418931220',
    city: 'Birampur',
    district: 'Sitapur',
    area: 'Birampur',
    address: 'Birampur',
    startingPrice: 30,
    services: [
      { name: 'बाल कटिंग', price: 30 },
      { name: 'दाढ़ी कटिंग', price: 20 },
      { name: 'बाल दाढ़ी दोनों', price: 50 },
    ],
  },
  {
    id: '6a9ff28035d42e18df67a0a9',
    name: 'Abrar Salmani Hair Cutting✂',
    ownerName: 'Abrar Salmani',
    ownerPhone: '+919918199484',
    city: 'Bhagauli',
    district: 'Sitapur',
    area: 'Bhagauli',
    address: 'Bhagauli',
    startingPrice: 30,
    services: [
      { name: 'बाल कट्टिंग', price: 30 },
      { name: 'ढाढ़ी कट्टिंग', price: 20 },
      { name: 'बाल ढाढ़ी दोनों', price: 50 },
    ],
  },
  {
    id: '6a95064919c919b70f55358b',
    name: 'शकील हेयर कटिंग सैलून',
    ownerName: 'शकील',
    ownerPhone: '+918318842697',
    city: 'Lalpur',
    district: 'Sitapur',
    area: 'Lalpur',
    address: 'Lalpur',
    startingPrice: 50,
    services: [
      { name: 'बाल कटिंग', price: 50 },
      { name: 'दाढ़ी कटिंग', price: 20 },
      { name: 'बाल दाढ़ी दोनों', price: 60 },
    ],
  },
  {
    id: '6a9fc2eaa7319255d821fda0',
    name: 'साहिल हेयर कटिंग सैलून',
    ownerName: 'साहिल',
    ownerPhone: '+917268844795',
    city: 'Bazid Nagar',
    district: 'Sitapur',
    area: 'Bazid Nagar',
    address: 'Bazid Nagar',
    startingPrice: 30,
    services: [
      { name: 'बाल कटिंग', price: 30 },
      { name: 'दाढ़ी कटिंग', price: 20 },
      { name: 'बाल दाढ़ी दोनों', price: 60 },
    ],
  },
];

// Normalize clean 10-digit Indian mobile number
export function cleanPhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : '';
}

// Resilient MongoDB collection fetcher (with fast timeout so it never blocks)
let mongoClient = null;
let mongoClientPromise = null;

export async function getDirectMongoCollection(collectionName) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('<username>') || uri.includes('cluster0.mongodb.net')) {
      return null;
    }
    const dbName = process.env.MONGODB_DB_NAME || 'quttr_qr';
    if (!mongoClientPromise) {
      mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 2000, connectTimeoutMS: 2000 });
      mongoClientPromise = mongoClient.connect().catch(() => null);
    }
    const connected = await mongoClientPromise;
    if (!connected) return null;
    return connected.db(dbName).collection(collectionName);
  } catch (e) {
    return null;
  }
}

// Fetch all live shops from backend API or fallback
export async function getLiveShops() {
  const now = Date.now();
  if (shopsCache && now - lastShopsFetchTime < CACHE_TTL_MS) {
    return shopsCache;
  }

  try {
    const response = await axios.get(`${BACKEND_API_URL}/shops/nearby`, {
      params: {
        latitude: 26.8467,
        longitude: 80.9462,
        radius: 5000000,
      },
      timeout: 3000,
    });

    if (response.data && Array.isArray(response.data.shops) && response.data.shops.length > 0) {
      const formatted = response.data.shops.map((s) => ({
        id: s._id,
        name: s.name,
        ownerName: s.owner?.name || s.ownerName || 'Barber',
        ownerPhone: s.owner?.phone || s.phone || '',
        city: s.address?.city || s.city || 'Lucknow',
        district: s.address?.district || s.district || s.address?.city || 'Lucknow',
        area: s.address?.area || s.address?.town || s.address?.addressLine || s.area || '',
        address: `${s.address?.area || ''}, ${s.address?.city || ''}`.trim().replace(/^,|,$/g, ''),
        startingPrice: s.services?.length ? Math.min(...s.services.map((x) => x.price || 99)) : 50,
        services: (s.services || []).map((x) => ({ name: x.name, price: x.price })),
      }));

      shopsCache = formatted;
      lastShopsFetchTime = now;
      return formatted;
    }
  } catch (err) {
    // If backend endpoint fails or times out, fallback to verified list
  }

  shopsCache = VERIFIED_SHOPS;
  lastShopsFetchTime = now;
  return VERIFIED_SHOPS;
}

// Transliteration / keyword mapping for UP towns & districts
const ALIAS_MAP = {
  lucknow: ['lucknow', 'लखनउ', 'लखनऊ', 'kamta', 'कमता', 'gomti', 'गोमती', 'indira', 'इंदिरा', 'aliganj', 'अलीगंज', 'hazratganj'],
  sitapur: ['sitapur', 'सीतापुर', 'arya nagar', 'आर्य नगर', 'nai basti', 'नई बस्ती'],
  sidhauli: ['sidhauli', 'सिधौली', 'bahadurpur', 'बहादुरपुर'],
  mahmudabad: ['mahmudabad', 'महमूदाबाद', 'sundoli', 'सुन्दोली'],
  lalpur: ['lalpur', 'लालपुर', 'baloiya', 'बलोइया'],
  chunka: ['chunka', 'चुनका'],
  rehuwa: ['rehuwa', 'रेहुवा'],
  nawagaon: ['nawagaon', 'नवागांव'],
  bajwapur: ['bajwapur', 'बजवापुर'],
  birampur: ['birampur', 'बिरामपुर'],
  bhagauli: ['bhagauli', 'भगौली'],
  bazid: ['bazid', 'बाज़िद', 'बाजिद'],
};

// Search shops by district, town, or city
export async function searchShopsByLocation(districtQuery = '', townQuery = '') {
  const allShops = await getLiveShops();
  const dNorm = (districtQuery || '').trim().toLowerCase();
  const tNorm = (townQuery || '').trim().toLowerCase();

  const locationName = townQuery || districtQuery || 'आपके एरिया';

  if (!dNorm && !tNorm) {
    return {
      matchedShops: allShops,
      totalCount: allShops.length,
      locationName: 'आपके एरिया',
      isExactMatch: false,
    };
  }

  // 1. First priority: Check specific town/area matches if town query provided
  if (tNorm) {
    const townMatched = allShops.filter((shop) => {
      const areaStr = `${shop.area} ${shop.address} ${shop.name}`.toLowerCase();
      if (areaStr.includes(tNorm)) return true;
      const words = tNorm.split(/\s+/).filter((w) => w.length > 2);
      return words.some((w) => areaStr.includes(w));
    });

    if (townMatched.length > 0) {
      return {
        matchedShops: townMatched,
        totalCount: townMatched.length,
        locationName,
        isExactMatch: true,
      };
    }
  }

  // 2. Second priority: Match by city or district
  const combinedQuery = `${dNorm} ${tNorm}`.trim();
  const districtMatched = allShops.filter((shop) => {
    const cityStr = `${shop.city} ${shop.district} ${shop.name}`.toLowerCase();
    if (cityStr.includes(combinedQuery) || (dNorm && cityStr.includes(dNorm))) return true;

    // Check aliases
    for (const [key, variations] of Object.entries(ALIAS_MAP)) {
      if (variations.some((v) => combinedQuery.includes(v)) && cityStr.includes(key)) {
        return true;
      }
    }
    return false;
  });

  if (districtMatched.length > 0) {
    return {
      matchedShops: districtMatched,
      totalCount: districtMatched.length,
      locationName,
      isExactMatch: true,
    };
  }

  // 3. Fallback: If no match, return top recommended shops from overall list
  return {
    matchedShops: allShops.slice(0, 5),
    totalCount: allShops.length,
    locationName,
    isExactMatch: false,
  };
}

// Lookup personal details by phone number
export async function lookupPersonalDetails(rawPhone) {
  const digits = cleanPhone(rawPhone);
  if (!digits) {
    return {
      found: false,
      name: 'Customer',
      phone: '',
      formattedPhone: '',
      isRegistered: false,
      userType: 'guest',
      role: 'Guest Customer',
      spokenDetails: 'आपका फोन नंबर उपलब्ध नहीं है। आप कटर ऐप डाउनलोड करके अपनी प्रोफ़ाइल बना सकते हैं।',
      spokenMessage: 'Customer is a guest.',
    };
  }

  const formattedPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  // 1. Check if caller is Admin / Founder
  if (digits === '9580133593') {
    return {
      found: true,
      name: 'Niransh',
      phone: digits,
      formattedPhone,
      isRegistered: true,
      userType: 'admin',
      role: 'Founder & Administrator',
      city: 'Lucknow',
      spokenDetails: `नमस्ते निरंश जी! आप QUTTR (कटर) के एडमिन हैं, और आपका रजिस्टर्ड फोन नंबर ${digits} है।`,
      spokenMessage: `User is Niransh (Admin & Founder of Quttr, phone: ${digits}).`,
    };
  }

  // 2. Check if caller is a registered Shop Owner in live shops
  const allShops = await getLiveShops();
  const matchedShop = allShops.find((s) => cleanPhone(s.ownerPhone) === digits);
  if (matchedShop) {
    return {
      found: true,
      name: matchedShop.ownerName,
      phone: digits,
      formattedPhone,
      isRegistered: true,
      userType: 'shop_owner',
      role: 'Barber Shop Owner',
      shopName: matchedShop.name,
      city: matchedShop.city,
      area: matchedShop.area,
      spokenDetails: `आपका नाम ${matchedShop.ownerName} है। आप '${matchedShop.name}' (${matchedShop.city}) के ओनर हैं और आपका रजिस्टर्ड नंबर ${digits} है।`,
      spokenMessage: `Owner: ${matchedShop.ownerName}, Shop: ${matchedShop.name} in ${matchedShop.city}.`,
    };
  }

  // 3. Check MongoDB if reachable
  const usersCol = await getDirectMongoCollection('users');
  if (usersCol) {
    const userDoc = await usersCol
      .findOne({
        $or: [
          { phone: { $regex: `${digits}$` } },
          { phoneNumber: { $regex: `${digits}$` } },
          { phone: parseInt(digits, 10) },
        ],
      })
      .catch(() => null);

    if (userDoc) {
      const name = userDoc.name || userDoc.fullName || userDoc.username || 'Valued Customer';
      return {
        found: true,
        name,
        phone: digits,
        formattedPhone,
        isRegistered: true,
        userType: 'registered_customer',
        role: 'Registered Customer',
        city: userDoc.city || userDoc.address?.city || 'Uttar Pradesh',
        spokenDetails: `आपका नाम ${name} है और आपका रजिस्टर्ड फोन नंबर ${digits} है। आप कटर ऐप के रजिस्टर्ड ग्राहक हैं।`,
        spokenMessage: `Registered customer ${name}, phone: ${digits}.`,
      };
    }
  }

  // 4. Default for new/unregistered callers
  return {
    found: false,
    name: 'Customer',
    phone: digits,
    formattedPhone,
    isRegistered: false,
    userType: 'new_customer',
    role: 'New Customer',
    spokenDetails: `आपका फोन नंबर ${digits} है। आप कटर ऐप से जुड़े हैं, लेकिन आपका प्रोफ़ाइल नाम अभी सेट नहीं है। आप Google Play Store से QUTTR ऐप डाउनलोड करके अपनी प्रोफ़ाइल बना सकते हैं।`,
    spokenMessage: `Customer phone is ${digits}. Not yet registered on app.`,
  };
}
