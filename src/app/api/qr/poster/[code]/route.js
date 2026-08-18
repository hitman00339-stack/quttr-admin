import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { getPosterConfig, getQRPixelCoords } from '@/lib/poster-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache the template image buffer in memory (loads once per server instance)
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
  // Free QR API with High error correction (survives 30% damage)
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

    // 1. Load template
    const { buffer: templateBuffer, meta } = await loadTemplate();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    // 2. Get calibrated QR position from DB (or defaults)
    const config = await getPosterConfig();
    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, config);

    // 3. Generate QR at needed size
    const qrBuffer = await fetchQRPNG(code, qrCoords.width);

    // 4. Ensure QR is exactly right dimensions with white background
    //    (scanner-safe padding built in via ecc=H)
    const qrResized = await sharp(qrBuffer)
      .resize(qrCoords.width, qrCoords.height, {
        fit: 'contain',
        background: '#ffffff',
      })
      .toBuffer();

    // 5. Composite QR onto poster at exact coordinates
    const finalBuffer = await sharp(templateBuffer)
      .composite([
        {
          input: qrResized,
          left: qrCoords.x,
          top: qrCoords.y,
        },
      ])
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    // 6. Return image
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
