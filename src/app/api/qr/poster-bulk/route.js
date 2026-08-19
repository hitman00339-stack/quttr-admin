import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function makePoster(code, templateBuffer, qrCoords) {
  const qrRenderSize = qrCoords.width * 2;
  const styledQRBuffer = await generateQuttrQR(code, qrRenderSize);
  const qrResized = await sharp(styledQRBuffer)
    .resize(qrCoords.width, qrCoords.height, {
      fit: 'contain',
      background: '#ffffff',
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 0 })
    .toBuffer();
  return await sharp(templateBuffer)
    .composite([{ input: qrResized, left: qrCoords.x, top: qrCoords.y }])
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4',
      mozjpeg: true,
      force: true,
    })
    .toBuffer();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { codes, posterId = null } = body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Provide array of codes' },
        { status: 400 }
      );
    }
    if (codes.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Max 100 posters per batch' },
        { status: 400 }
      );
    }

    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        { success: false, message: 'No poster template available' },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json({ success: false, message: 'Poster image data invalid' }, { status: 500 });
    }

    const meta = await sharp(templateBuffer).metadata();
    const qrCoords = getQRPixelCoords(meta.width, meta.height, poster.qr_config);

    const CONCURRENCY = 5;
    const posters = [];
    for (let i = 0; i < codes.length; i += CONCURRENCY) {
      const batch = codes.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (code) => {
          try {
            const buffer = await makePoster(code, templateBuffer, qrCoords);
            return { code, buffer, ok: true };
          } catch (err) {
            return { code, ok: false, error: err.message };
          }
        })
      );
      posters.push(...results);
    }

    const zip = new JSZip();
    let successCount = 0;
    posters.forEach((p) => {
      if (p.ok) {
        zip.file(`quttr-poster-${p.code}.jpg`, p.buffer);
        successCount++;
      }
    });

    zip.file(
      'README.txt',
      `Quttr QR Posters — JPEG (High Quality)\n` +
      `Poster: ${poster.name}\n` +
      `Count: ${successCount}\n` +
      `Dimensions: ${meta.width}×${meta.height}px\n` +
      `Format: JPEG 95%\n` +
      `Generated: ${new Date().toLocaleString('en-IN')}\n`
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 3 },
    });

    const cleanName = (poster.name || 'poster').replace(/[^a-z0-9]/gi, '-');
    const filename = `quttr-${cleanName}-${new Date().toISOString().split('T')[0]}-${successCount}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/qr/poster-bulk] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
