import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/posters/[id]/image
 * Serves the poster image binary
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const db = await getDb();
    const poster = await db.collection('posters').findOne({ _id: new ObjectId(id) });

    if (!poster || !poster.image_data) {
      return NextResponse.json({ error: 'Poster not found' }, { status: 404 });
    }

    // MongoDB stores Buffer as Binary — extract properly
    let imageBuffer;
    if (poster.image_data.buffer) {
      // BSON Binary type
      imageBuffer = Buffer.from(poster.image_data.buffer);
    } else if (Buffer.isBuffer(poster.image_data)) {
      imageBuffer = poster.image_data;
    } else {
      imageBuffer = Buffer.from(poster.image_data);
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': poster.image_type || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[GET /api/posters/[id]/image] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
