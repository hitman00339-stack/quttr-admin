import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';
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
    const posterId = searchParams.get('poster') || null;

    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        { error: 'No poster template available. Upload one at /dashboard/posters' },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json({ error: 'Poster image data invalid' }, { status: 500 });
    }

    const meta = await sharp(templateBuffer).metadata();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, poster.qr_config);

    // Generate QR at 2x resolution for sharper edges when scaled
    const qrRenderSize = qrCoords.width * 2;
    const styledQRBuffer = await generateQuttrQR(code, qrRenderSize);

    // Downscale QR to exact size with highest-quality resampling
    const qrResized = await sharp(styledQRBuffer)
      .resize(qrCoords.width, qrCoords.height, {
        fit: 'contain',
        background: '#ffffff',
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 0 })
      .toBuffer();

    // Composite QR onto poster and output as JPEG (95% quality = print-ready)
    const finalBuffer = await sharp(templateBuffer)
      .composite([
        { input: qrResized, left: qrCoords.x, top: qrCoords.y },
      ])
      .jpeg({
        quality: 95,          // High quality (95 = visually lossless)
        chromaSubsampling: '4:4:4', // Best color reproduction
        mozjpeg: true,        // Better compression algorithm
        force: true,
      })
      .toBuffer();

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        ...(download && {
          'Content-Disposition': `attachment; filename="quttr-poster-${code}.jpg"`,
        }),
      },
    });
  } catch (error) {
    console.error('[api/qr/poster] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
