import { NextResponse } from 'next/server';
import { getLiveShops, getDirectMongoCollection } from '@/lib/omni-data';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let barbers = [];
    let users = [];

    // Fetch Barbers
    if (type === 'all' || type === 'barbers') {
      const liveShops = await getLiveShops();
      barbers = liveShops.map((s) => ({
        id: s.id,
        shopName: s.name,
        ownerName: s.ownerName,
        phone: s.ownerPhone,
        city: s.city,
        district: s.district,
        area: s.area,
        startingPrice: s.startingPrice,
      }));
    }

    // Fetch Users
    if (type === 'all' || type === 'users') {
      const usersCol = await getDirectMongoCollection('users');
      if (usersCol) {
        const docs = await usersCol
          .find({})
          .project({ name: 1, phone: 1, phoneNumber: 1, email: 1, city: 1, createdAt: 1 })
          .limit(100)
          .toArray()
          .catch(() => []);

        users = docs.map((u) => ({
          id: u._id,
          name: u.name || u.fullName || 'Registered User',
          phone: u.phone || u.phoneNumber || '',
          city: u.city || 'Lucknow',
          email: u.email || '',
        }));
      }

      // If no users in MongoDB yet, include known registered users (e.g., Niransh)
      if (users.length === 0) {
        users = [
          {
            id: 'u1',
            name: 'Niransh',
            phone: '+919580133593',
            city: 'Lucknow',
            email: 'admin@quttr.com',
          },
        ];
      }
    }

    return NextResponse.json({
      success: true,
      barbers,
      users,
      totalBarbers: barbers.length,
      totalUsers: users.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
