import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { getPosterConfig, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(request, { params }) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === '1';

    // 1. Load poster template
    const { buffer: templateBuffer, meta } = await loadTemplate();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    // 2. Get calibrated QR position
    const config = await getPosterConfig();
    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, config);

    // 3. Generate STYLED QR (with red circle + scissors logo)
    const styledQRBuffer = await generateQuttrQR(code, qrCoords.width);

    // 4. Ensure exact dimensions
    const qrResized = await sharp(styledQRBuffer)
      .resize(qrCoords.width, qrCoords.height, {
        fit: 'contain',
        background: '#ffffff',
      })
      .toBuffer();

    // 5. Composite onto poster
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
