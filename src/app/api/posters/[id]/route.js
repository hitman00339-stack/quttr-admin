import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/posters/[id]
 * Returns single poster metadata (no image data)
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const poster = await db.collection('posters').findOne(
      { _id: new ObjectId(id) },
      { projection: { image_data: 0 } }
    );

    if (!poster) {
      return NextResponse.json(
        { success: false, message: 'Poster not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      poster: {
        ...poster,
        _id: poster._id.toString(),
      },
    });
  } catch (error) {
    console.error('[GET /api/posters/[id]] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posters/[id]
 * Update poster metadata (name, description, is_default, qr_config)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = { updated_at: new Date() };

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.description === 'string') {
      updates.description = body.description.trim() || null;
    }

    // QR position update
    if (body.qr_config) {
      const { xPercent, yPercent, widthPercent, heightPercent } = body.qr_config;
      if (
        typeof xPercent === 'number' &&
        typeof yPercent === 'number' &&
        typeof widthPercent === 'number' &&
        typeof heightPercent === 'number'
      ) {
        updates.qr_config = {
          xPercent: Number(xPercent.toFixed(3)),
          yPercent: Number(yPercent.toFixed(3)),
          widthPercent: Number(widthPercent.toFixed(3)),
          heightPercent: Number(heightPercent.toFixed(3)),
        };
      }
    }

    const db = await getDb();

    // Handle setting as default (must unset others)
    if (body.is_default === true) {
      await db.collection('posters').updateMany(
        { _id: { $ne: new ObjectId(id) }, is_default: true },
        { $set: { is_default: false } }
      );
      updates.is_default = true;
    } else if (body.is_default === false) {
      updates.is_default = false;
    }

    const result = await db.collection('posters').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      {
        returnDocument: 'after',
        projection: { image_data: 0 },
      }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Poster not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Poster updated',
      poster: {
        ...result,
        _id: result._id.toString(),
      },
    });
  } catch (error) {
    console.error('[PATCH /api/posters/[id]] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posters/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const poster = await db.collection('posters').findOne({ _id: new ObjectId(id) });

    if (!poster) {
      return NextResponse.json(
        { success: false, message: 'Poster not found' },
        { status: 404 }
      );
    }

    await db.collection('posters').deleteOne({ _id: new ObjectId(id) });

    // If deleted was default, set another as default
    if (poster.is_default) {
      const next = await db.collection('posters').findOne({}, { sort: { created_at: -1 } });
      if (next) {
        await db.collection('posters').updateOne(
          { _id: next._id },
          { $set: { is_default: true } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Poster deleted',
    });
  } catch (error) {
    console.error('[DELETE /api/posters/[id]] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
