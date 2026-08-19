import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/qr/batch-info/[batchId]
 * Returns list of QR codes + poster info for client-side processing
 * Query: ?status=INACTIVE&poster=xxx
 */
export async function GET(request, { params }) {
  try {
    const { batchId } = params;
    if (!batchId) {
      return NextResponse.json({ success: false, message: 'Batch ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const posterId = searchParams.get('poster') || null;

    const db = await getDb();
    const query = { batch_id: batchId };
    if (statusFilter === 'ACTIVE') query.status = 'ACTIVE';
    if (statusFilter === 'INACTIVE') query.status = 'INACTIVE';

    const qrCodes = await db
      .collection('qr_codes')
      .find(query)
      .sort({ created_at: 1 })
      .project({ short_code: 1, batch_name: 1 })
      .toArray();

    if (qrCodes.length === 0) {
      return NextResponse.json({ success: false, message: 'No QRs found' }, { status: 404 });
    }

    // Get poster info (metadata only, not image)
    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json({ success: false, message: 'No poster template available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      batch: {
        batch_id: batchId,
        batch_name: qrCodes[0]?.batch_name || batchId,
        total: qrCodes.length,
      },
      poster: {
        _id: poster._id.toString(),
        name: poster.name,
        image_url: `/api/posters/${poster._id.toString()}/image`,
        width: poster.width,
        height: poster.height,
        qr_config: poster.qr_config,
      },
      codes: qrCodes.map((qr) => qr.short_code),
    });
  } catch (error) {
    console.error('[batch-info] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
