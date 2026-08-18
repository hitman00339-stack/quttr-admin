import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Utility: trim strings + convert empty → null
const clean = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      short_code,
      location_type,
      shop_name,
      owner_name,
      owner_phone,
      owner_whatsapp,
      vehicle_number,
      vehicle_type,
      state,
      city,
      town,
      area,
      address,
      landmark,
      pincode,
      placement_position,
      notes,
      activated_by,
      gps_location,
    } = body;

    if (!short_code || !location_type) {
      return NextResponse.json(
        { success: false, message: 'QR code and location type required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR code not found' },
        { status: 404 }
      );
    }

    const existing = await db
      .collection('qr_activations')
      .findOne({ qr_id: qrCode._id });

    // Normalize location fields
    const cleanTown = clean(town);
    const cleanCity = clean(city);
    const cleanArea = clean(area);
    const cleanState = clean(state);

    // 🎯 Smart fallback: guarantee `town` is never null if city/area exists.
    // This prevents "आपके शहर" from showing on landing page when admin
    // forgets to fill Town but did fill City.
    const resolvedTown = cleanTown || cleanCity || cleanArea || null;

    const activationData = {
      qr_id: qrCode._id,
      qr_code: short_code,
      location_type,
      shop_name: clean(shop_name),
      owner_name: clean(owner_name),
      owner_phone: clean(owner_phone),
      owner_whatsapp: clean(owner_whatsapp),
      vehicle_number: clean(vehicle_number),
      vehicle_type: clean(vehicle_type),
      location: {
        state: cleanState,
        city: cleanCity,
        town: resolvedTown,
        area: cleanArea,
        address: clean(address),
        landmark: clean(landmark),
        pincode: clean(pincode),
      },
      placement_position: clean(placement_position),
      gps_location: gps_location || null,
      notes: clean(notes),
      activated_by: activated_by || 'admin',
      activated_at: existing ? existing.activated_at : new Date(),
      updated_at: new Date(),
    };

    if (existing) {
      await db
        .collection('qr_activations')
        .updateOne({ qr_id: qrCode._id }, { $set: activationData });
    } else {
      await db.collection('qr_activations').insertOne(activationData);
    }

    await db.collection('qr_codes').updateOne(
      { _id: qrCode._id },
      { $set: { status: 'ACTIVE', updated_at: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: existing ? 'Activation updated!' : 'QR activated successfully!',
      activation: activationData,
    });
  } catch (error) {
    console.error('[api/qr/activate POST] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const short_code = searchParams.get('code');

    if (!short_code) {
      return NextResponse.json(
        { success: false, message: 'Code required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR not found' },
        { status: 404 }
      );
    }

    const activation = await db
      .collection('qr_activations')
      .findOne({ qr_id: qrCode._id });

    return NextResponse.json({
      success: true,
      qr_code: {
        _id: qrCode._id.toString(),
        short_code: qrCode.short_code,
        full_url: qrCode.full_url,
        status: qrCode.status,
        total_scans: qrCode.total_scans || 0,
      },
      activation: activation || null,
    });
  } catch (error) {
    console.error('[api/qr/activate GET] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const short_code = searchParams.get('code');

    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code });

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'QR not found' },
        { status: 404 }
      );
    }

    await db.collection('qr_activations').deleteOne({ qr_id: qrCode._id });
    await db.collection('qr_codes').updateOne(
      { _id: qrCode._id },
      { $set: { status: 'INACTIVE', updated_at: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'QR deactivated' });
  } catch (error) {
    console.error('[api/qr/activate DELETE] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
