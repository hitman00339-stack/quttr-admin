import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

const verifySecret = (req) => req.headers.get('authorization') === `Bearer ${process.env.OMNI_API_SECRET}`;
const normalizePhone = (phone) => phone ? phone.replace(/\D/g, '').slice(-10) : '';

export async function GET(request) {
  if (!verifySecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone_number') || searchParams.get('phone'));
    if (!phone) return NextResponse.json({ is_registered: false });

    const shopsCol = await getCollection('shops');
    const shop = await shopsCol.findOne({ 'owner.phone': { $regex: new RegExp(phone + '$') } });

    if (shop) {
      return NextResponse.json({
        is_registered: true,
        shop_name: shop.name || 'Your Shop',
        owner_name: shop.owner?.name || 'Owner',
        is_active: shop.isActive
      });
    }
    return NextResponse.json({ is_registered: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
