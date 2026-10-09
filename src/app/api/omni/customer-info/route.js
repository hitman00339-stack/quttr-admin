import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb'; 

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone_number') || searchParams.get('phone');
    const phone = normalizePhone(rawPhone);
    
    if (!phone) {
      return NextResponse.json({ name: null, is_registered: false, user_type: 'guest' });
    }

    const usersCol = await getCollection('users');
    const user = await usersCol.findOne({ phone: { $regex: new RegExp(phone + '$') } });

    if (user) {
      return NextResponse.json({
        name: user.name || user.fullName || null,
        is_registered: true,
        user_type: 'customer'
      });
    }

    return NextResponse.json({ name: null, is_registered: false, user_type: 'guest' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
