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
        location: 'आपके शहर',
      });
    }

    const qrCodes = await getCollection('qr_codes');
    const qrCode = await qrCodes.findOne({ short_code: qrId });

    if (!qrCode) {
      return NextResponse.json({
        success: true,
        location: 'आपके शहर',
      });
    }

    const activations = await getCollection('qr_activations');
    const activation = await activations.findOne({ qr_id: qrCode._id });

    if (!activation) {
      return NextResponse.json({
        success: true,
        location: 'आपके शहर',
      });
    }

    // ============================================================
    // 🎯 LOCATION PRIORITY (TOWN/CITY ONLY — NEVER shop name)
    // ============================================================
    // Try every possible field where the town/city could be stored:
    //   1. activation.location.town         (new preferred field)
    //   2. activation.location.city         (common backup)
    //   3. activation.location.area         (fallback)
    //   4. activation.town / activation.city (flat fields)
    //   5. shop's address.city              (from linked shop)
    // ⚠️ shop_name is NEVER used as a fallback — we don't want to
    //    show "Sharma Shop" when the user wants to see "Sidhauli".
    // ============================================================

    let location = null;

    // Try activation.location.* nested fields
    if (activation.location) {
      location =
        activation.location.town ||
        activation.location.city ||
        activation.location.area ||
        activation.location.district ||
        activation.location.state ||
        null;
    }

    // Try flat fields on activation
    if (!location) {
      location =
        activation.town ||
        activation.city ||
        activation.area ||
        null;
    }

    // Last resort: look up the linked shop and grab its address.city
    if (!location && activation.shop_id) {
      try {
        const shops = await getCollection('shops');
        const shop = await shops.findOne({ _id: activation.shop_id });
        if (shop?.address) {
          location =
            shop.address.city ||
            shop.address.town ||
            shop.address.area ||
            null;
        }
      } catch (e) {
        // ignore, fall through to default
      }
    }

    // Absolute final fallback (still NOT shop name)
    if (!location) location = 'आपके शहर';

    return NextResponse.json({
      success: true,
      location: location,
      // useful debug info (safe to expose to landing page)
      details: {
        town: activation.location?.town || null,
        city: activation.location?.city || null,
        area: activation.location?.area || null,
        state: activation.location?.state || null,
        shop_name: activation.shop_name || null, // returned but NOT used as location
        type: activation.location_type || null,
      },
    });
  } catch (error) {
    console.error('[api/qr/location] error:', error);
    return NextResponse.json(
      {
        success: false,
        location: 'आपके शहर',
        error: error.message,
      },
      { status: 200 }
    );
  }
}
