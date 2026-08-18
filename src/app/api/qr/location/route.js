import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get('qr');

    if (!qrId) {
      return NextResponse.json({ success: false, location: 'आपके शहर' });
    }

    const qrCodes = await getCollection('qr_codes');
    const qrCode = await qrCodes.findOne({ short_code: qrId });

    if (!qrCode) {
      return NextResponse.json({ success: true, location: 'आपके शहर' });
    }

    const activations = await getCollection('qr_activations');
    const activation = await activations.findOne({ qr_id: qrCode._id });

    if (!activation) {
      return NextResponse.json({ success: true, location: 'आपके शहर' });
    }

    // 🎯 STRICT PRIORITY: town > city > area > state
    // ⚠️ NEVER use shop_name — this is location text for the landing page.
    const loc = activation.location || {};
    const location =
      loc.town ||
      loc.city ||
      loc.area ||
      loc.district ||
      loc.state ||
      'आपके शहर';

    return NextResponse.json({
      success: true,
      location,
      // Extra fields the landing page can use if needed
      town: loc.town || null,
      city: loc.city || null,
      area: loc.area || null,
      state: loc.state || null,
      shop_name: activation.shop_name || null, // returned for reference, NOT used as location
    });
  } catch (error) {
    console.error('[api/qr/location] error:', error);
    return NextResponse.json(
      { success: false, location: 'आपके शहर', error: error.message },
      { status: 200 }
    );
  }
}
