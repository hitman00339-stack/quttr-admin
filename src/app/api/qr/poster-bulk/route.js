import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import {
  getPoster,
  getImageBuffer,
  getQRPixelCoords,
} from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function makePoster(code, templateBuffer, qrCoords) {
  const styledQRBuffer = await generateQuttrQR(code, qrCoords.width);
  const qrResized = await sharp(styledQRBuffer)
    .resize(qrCoords.width, qrCoords.height, {
      fit: 'contain',
      background: '#ffffff',
    })
    .toBuffer();
  return await sharp(templateBuffer)
    .composite([
      { input: qrResized, left: qrCoords.x, top: qrCoords.y },
    ])
    .png({ quality: 100, compressionLevel: 6 })
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
    if (codes.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Max 200 posters per batch' },
        { status: 400 }
      );
    }

    // Load poster
    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        {
          success: false,
          message: 'No poster template available. Upload one at /dashboard/posters',
        },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json(
        { success: false, message: 'Poster image data invalid' },
        { status: 500 }
      );
    }

    // Get dimensions
    let posterWidth = poster.width;
    let posterHeight = poster.height;
    if (!posterWidth || !posterHeight) {
      const meta = await sharp(templateBuffer).metadata();
      posterWidth = meta.width;
      posterHeight = meta.height;
    }

    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, poster.qr_config);

    // Generate all posters in parallel
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
            console.error(`Failed for ${code}:`, err.message);
            return { code, ok: false, error: err.message };
          }
        })
      );
      posters.push(...results);
    }

    // Build ZIP
    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;
    posters.forEach((p) => {
      if (p.ok) {
        zip.file(`quttr-poster-${p.code}.png`, p.buffer);
        successCount++;
      } else {
        failCount++;
      }
    });

    zip.file(
      'README.txt',
      `Quttr QR Posters — Batch Export\n` +
      `Template: ${poster.name}\n` +
      `Generated: ${new Date().toLocaleString('en-IN')}\n` +
      `Total requested: ${codes.length}\n` +
      `Successful: ${successCount}\n` +
      `Failed: ${failCount}\n\n` +
      `Each poster is print-ready A4 PNG with styled QR.\n` +
      `Print at 100% scale on 200 GSM paper.\n`
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const cleanName = (poster.name || 'poster').replace(/[^a-z0-9]/gi, '-');
    const filename = `${cleanName}-${new Date().toISOString().split('T')[0]}-${successCount}.zip`;

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
