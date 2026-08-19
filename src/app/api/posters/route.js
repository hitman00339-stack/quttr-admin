import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { DEFAULT_QR_POSITION } from '@/lib/poster-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Max 8MB uploads
const MAX_SIZE = 8 * 1024 * 1024;

/**
 * GET /api/posters
 * Returns list of all poster templates (metadata only, no image data)
 */
export async function GET() {
  try {
    const db = await getDb();
    const posters = await db
      .collection('posters')
      .find({}, { projection: { image_data: 0 } }) // exclude image data
      .sort({ is_default: -1, created_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      total: posters.length,
      posters: posters.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description || null,
        is_default: p.is_default || false,
        image_type: p.image_type,
        image_size: p.image_size,
        width: p.width,
        height: p.height,
        qr_config: p.qr_config || DEFAULT_QR_POSITION,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
    });
  } catch (error) {
    console.error('[GET /api/posters] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posters
 * Upload a new poster
 * FormData: { name, description?, image (File), is_default? }
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description') || null;
    const isDefault = formData.get('is_default') === 'true';
    const file = formData.get('image');

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Only image files allowed' },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large. Max ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions using sharp
    let width, height;
    try {
      const sharp = (await import('sharp')).default;
      const meta = await sharp(buffer).metadata();
      width = meta.width;
      height = meta.height;
    } catch (e) {
      console.error('sharp dimension detect failed:', e);
      width = null;
      height = null;
    }

    const db = await getDb();

    // If setting as default, unset current default
    if (isDefault) {
      await db.collection('posters').updateMany(
        { is_default: true },
        { $set: { is_default: false } }
      );
    }

    // Check if this is first poster (auto-set as default)
    const existingCount = await db.collection('posters').countDocuments({});
    const shouldBeDefault = isDefault || existingCount === 0;

    const doc = {
      name: name.trim(),
      description: description ? description.trim() : null,
      is_default: shouldBeDefault,
      image_data: buffer,
      image_type: file.type,
      image_size: file.size,
      width,
      height,
      qr_config: { ...DEFAULT_QR_POSITION },
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('posters').insertOne(doc);

    return NextResponse.json({
      success: true,
      message: 'Poster uploaded successfully',
      poster: {
        _id: result.insertedId.toString(),
        name: doc.name,
        is_default: doc.is_default,
        image_type: doc.image_type,
        image_size: doc.image_size,
        width: doc.width,
        height: doc.height,
      },
    });
  } catch (error) {
    console.error('[POST /api/posters] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
