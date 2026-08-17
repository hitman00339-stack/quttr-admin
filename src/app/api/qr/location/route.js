import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get('qr');

    if (!qrId) {
      return NextResponse.json({
        success: false,
        location: 'आपके शहर'
      });
    }

    const qrCodes = await getCollection('qr_codes');
    const qrCode = await qrCodes.findOne({ short_code: qrId });

    if (!qrCode) {
      return NextResponse.json({
        success: true,
        location: 'आपके शहर'
      });
    }

    const activations = await getCollection('qr_activations');
    const activation = await activations.findOne({ qr_id: qrCode._id });

    if (!activation) {
      return NextResponse.json({
        success: true,
        location: 'आपके शहर'
      });
    }

    // Priority: shop_name > town > area > city > state
    const location = 
      activation.shop_name ||
      activation.location?.town ||
      activation.location?.area ||
      activation.location?.city ||
      activation.location?.state ||
      'आपके शहर';

    return NextResponse.json({
      success: true,
      location: location,
      details: {
        shop: activation.shop_name,
        town: activation.location?.town,
        area: activation.location?.area,
        city: activation.location?.city,
        state: activation.location?.state,
        type: activation.location_type
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      location: 'आपके शहर',
      error: error.message
    }, { status: 200 });
  }
}
