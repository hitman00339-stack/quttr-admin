import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

const verifySecret = (req) => req.headers.get('authorization') === `Bearer ${process.env.OMNI_API_SECRET}`;

export async function GET(request) {
  if (!verifySecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || '';
    const town = searchParams.get('town') || '';

    const shopsCol = await getCollection('shops');
    const query = { approvalStatus: 'approved', isActive: true };

    if (district) query['address.district'] = { $regex: new RegExp(district, 'i') };
    if (town) query['$or'] = [
      { 'address.city': { $regex: new RegExp(town, 'i') } },
      { 'address.town': { $regex: new RegExp(town, 'i') } }
    ];

    const count = await shopsCol.countDocuments(query);
    const location = town || district || 'आपके एरिया';

    return NextResponse.json({
      total_shops: count,
      message: count > 0 
        ? `जी, ${location} में हमारे पास ${count} बार्बर शॉप्स हैं।` 
        : `अभी ${location} में हम दुकानें जोड़ रहे हैं। आप अपने बार्बर को कटर ऐप से जुड़ने के लिए कह सकते हैं।`
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
