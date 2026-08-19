import { NextResponse } from 'next/server';
import sharp from 'sharp';
import {
  getPoster,
  getImageBuffer,
  getQRPixelCoords,
} from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === '1';
    const posterId = searchParams.get('poster') || null; // Optional: specific poster

    // 1. Load poster (specific or default)
    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        {
          error: 'No poster template available. Upload one at /dashboard/posters',
        },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json(
        { error: 'Poster image data invalid' },
        { status: 500 }
      );
    }

    // 2. Get poster dimensions
    let posterWidth = poster.width;
    let posterHeight = poster.height;
    if (!posterWidth || !posterHeight) {
      const meta = await sharp(templateBuffer).metadata();
      posterWidth = meta.width;
      posterHeight = meta.height;
    }

    // 3. Calculate QR pixel coordinates using this poster's calibration
    const qrCoords = getQRPixelCoords(
      posterWidth,
      posterHeight,
      poster.qr_config
    );

    // 4. Generate styled QR (with logo)
    const styledQRBuffer = await generateQuttrQR(code, qrCoords.width);

    // 5. Ensure exact dimensions
    const qrResized = await sharp(styledQRBuffer)
      .resize(qrCoords.width, qrCoords.height, {
        fit: 'contain',
        background: '#ffffff',
      })
      .toBuffer();

    // 6. Composite QR onto poster
    const finalBuffer = await sharp(templateBuffer)
      .composite([
        { input: qrResized, left: qrCoords.x, top: qrCoords.y },
      ])
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        ...(download && {
          'Content-Disposition': `attachment; filename="quttr-poster-${code}.png"`,
        }),
      },
    });
  } catch (error) {
    console.error('[api/qr/poster] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
