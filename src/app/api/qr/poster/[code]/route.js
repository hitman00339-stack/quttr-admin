import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { POSTER_CONFIG, getQRPixelCoords } from '@/lib/poster-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache the template buffer for performance
let templateCache = null;
let templateMetaCache = null;

async function loadTemplate() {
  if (templateCache) return { buffer: templateCache, meta: templateMetaCache };
  const templatePath = path.join(process.cwd(), 'public', 'poster-template.png');
  const buffer = await fs.readFile(templatePath);
  const meta = await sharp(buffer).metadata();
  templateCache = buffer;
  templateMetaCache = meta;
  return { buffer, meta };
}

async function fetchQRPNG(code, size) {
  // Uses free QR API (ECC=H for max damage resistance)
  const url = `https://quttrr.com/q/${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=0&ecc=H&format=png`;
  const res = await fetch(qrUrl);
  if (!res.ok) throw new Error('QR generation failed');
  return Buffer.from(await res.arrayBuffer());
}

export async function GET(request, { params }) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === '1';

    // Load template
    const { buffer: templateBuffer, meta } = await loadTemplate();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    // Calculate QR pixel coords
    const qrCoords = getQRPixelCoords(posterWidth, posterHeight);

    // Generate QR at needed size
    const qrBuffer = await fetchQRPNG(code, qrCoords.width);

    // Optional: add tiny white padding around QR for scanner safety
    const qrPadded = await sharp(qrBuffer)
      .resize(qrCoords.width, qrCoords.height, { fit: 'contain', background: '#ffffff' })
      .toBuffer();

    // Composite QR onto poster
    const finalBuffer = await sharp(templateBuffer)
      .composite([
        {
          input: qrPadded,
          left: qrCoords.x,
          top: qrCoords.y,
        },
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
