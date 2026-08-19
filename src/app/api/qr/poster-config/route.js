import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG = {
  xPercent: 4.5,
  yPercent: 61.5,
  widthPercent: 34,
  heightPercent: 22.5,
};

/**
 * GET /api/qr/poster-config
 * Returns current QR position config
 */
export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('app_config').findOne({ key: 'poster_qr_position' });

    return NextResponse.json({
      success: true,
      config: doc?.value || DEFAULT_CONFIG,
    });
  } catch (error) {
    console.error('[GET /api/qr/poster-config] error:', error);
    // Return defaults even on error so calibration page still works
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
      warning: error.message,
    });
  }
}

/**
 * POST /api/qr/poster-config
 * Saves new QR position config
 * Body: { xPercent, yPercent, widthPercent, heightPercent }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { xPercent, yPercent, widthPercent, heightPercent } = body;

    // Validate all values are numbers
    if (
      typeof xPercent !== 'number' ||
      typeof yPercent !== 'number' ||
      typeof widthPercent !== 'number' ||
      typeof heightPercent !== 'number' ||
      isNaN(xPercent) ||
      isNaN(yPercent) ||
      isNaN(widthPercent) ||
      isNaN(heightPercent)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid values — must be numbers',
          received: body,
        },
        { status: 400 }
      );
    }

    // Sanity check ranges
    if (
      xPercent < 0 || xPercent > 100 ||
      yPercent < 0 || yPercent > 100 ||
      widthPercent < 1 || widthPercent > 100 ||
      heightPercent < 1 || heightPercent > 100
    ) {
      return NextResponse.json(
        { success: false, message: 'Values out of range (0-100)' },
        { status: 400 }
      );
    }

    const value = {
      xPercent: Number(xPercent.toFixed(3)),
      yPercent: Number(yPercent.toFixed(3)),
      widthPercent: Number(widthPercent.toFixed(3)),
      heightPercent: Number(heightPercent.toFixed(3)),
    };

    const db = await getDb();
    await db.collection('app_config').updateOne(
      { key: 'poster_qr_position' },
      {
        $set: {
          key: 'poster_qr_position',
          value,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'QR position saved successfully',
      config: value,
    });
  } catch (error) {
    console.error('[POST /api/qr/poster-config] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
