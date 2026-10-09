import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb'; // Adjust path if needed

const verifySecret = (req) => req.headers.get('authorization') === `Bearer ${process.env.OMNI_API_SECRET}`;
const normalizePhone = (phone) => phone ? phone.replace(/\D/g, '').slice(-10) : '';

export async function GET(request) {
  if (!verifySecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone_number') || searchParams.get('phone'));
    if (!phone) return NextResponse.json({ name: null, is_registered: false });

    const usersCol = await getCollection('users');
    const user = await usersCol.findOne({ phone: { $regex: new RegExp(phone + '$') } });

    return NextResponse.json({
      name: user?.name || user?.fullName || null,
      is_registered: !!user,
      user_type: 'customer'
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
