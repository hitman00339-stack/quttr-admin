import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      short_code,
      location_type,
      shop_name,
      owner_name,
      owner_phone,
      state,
      city,
      area,
      address,
      landmark,
      notes,
      activated_by,
    } = body;

    if (!short_code || !location_type) {
      return NextResponse.json({
        success: false,
        message: 'QR code and location type required'
      }, { status: 400 });
    }

    const db = await getDb();
    
    // Find QR code
    const qrCode = await db.collection('qr_codes').findOne({ short_code });
    
    if (!qrCode) {
      return NextResponse.json({
        success: false,
        message: 'QR code not found'
      }, { status: 404 });
    }

    // Check if already activated
    const existing = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });
    
    const activationData = {
      qr_id: qrCode._id,
      qr_code: short_code,
      location_type,
      shop_name: shop_name || null,
      owner_name: owner_name || null,
      owner_phone: owner_phone || null,
      location: {
        state: state || null,
        city: city || null,
        area: area || null,
        address: address || null,
        landmark: landmark || null,
      },
      notes: notes || null,
      activated_by: activated_by || 'admin',
      activated_at: new Date(),
      updated_at: new Date(),
    };

    if (existing) {
      // Update existing activation
      await db.collection('qr_activations').updateOne(
        { qr_id: qrCode._id },
        { $set: activationData }
      );
    } else {
      // Create new activation
      await db.collection('qr_activations').insertOne(activationData);
    }

    // Update QR status to ACTIVE
    await db.collection('qr_codes').updateOne(
      { _id: qrCode._id },
      { 
        $set: { 
          status: 'ACTIVE',
          updated_at: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: existing ? 'Activation updated!' : 'QR activated successfully!',
      activation: activationData,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Get activation by QR code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const short_code = searchParams.get('code');

    if (!short_code) {
      return NextResponse.json({
        success: false,
        message: 'Code required'
      }, { status: 400 });
    }

    const db = await getDb();
    
    const qrCode = await db.collection('qr_codes').findOne({ short_code });
    
    if (!qrCode) {
      return NextResponse.json({
        success: false,
        message: 'QR not found'
      }, { status: 404 });
    }

    const activation = await db.collection('qr_activations').findOne({ qr_id: qrCode._id });

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
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Deactivate QR
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const short_code = searchParams.get('code');

    const db = await getDb();
    const qrCode = await db.collection('qr_codes').findOne({ short_code });
    
    if (!qrCode) {
      return NextResponse.json({ success: false, message: 'QR not found' }, { status: 404 });
    }

    await db.collection('qr_activations').deleteOne({ qr_id: qrCode._id });
    await db.collection('qr_codes').updateOne(
      { _id: qrCode._id },
      { $set: { status: 'INACTIVE', updated_at: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'QR deactivated' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
