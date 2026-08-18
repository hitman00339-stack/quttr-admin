import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dedicated endpoint for bulk print page.
 * Returns all QRs with their activation status — no auth for now
 * (add admin check later if needed).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // ACTIVE | INACTIVE | (empty for all)
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000);

    const db = await getDb();
    const query = {};
    if (status === 'ACTIVE') query.status = 'ACTIVE';
    if (status === 'INACTIVE') query.status = 'INACTIVE';

    const total = await db.collection('qr_codes').countDocuments(query);

    const codes = await db
      .collection('qr_codes')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Get activations for these codes (to show shop name in grid)
    const activations = codes.length
      ? await db
          .collection('qr_activations')
          .find({ qr_id: { $in: codes.map((c) => c._id) } })
          .toArray()
      : [];
    const actMap = new Map(activations.map((a) => [a.qr_id.toString(), a]));

    return NextResponse.json({
      success: true,
      total,
      count: codes.length,
      codes: codes.map((c) => ({
        _id: c._id.toString(),
        short_code: c.short_code,
        full_url: c.full_url,
        status: c.status || 'INACTIVE',
        batch_id: c.batch_id || null,
        batch_name: c.batch_name || null,
        total_scans: c.total_scans || 0,
        created_at: c.created_at,
        activation: actMap.get(c._id.toString())
          ? {
              shop_name: actMap.get(c._id.toString()).shop_name,
              town: actMap.get(c._id.toString()).location?.town,
              city: actMap.get(c._id.toString()).location?.city,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[api/qr/list-for-print] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
