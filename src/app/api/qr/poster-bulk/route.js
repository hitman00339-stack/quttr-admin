import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { getPosterConfig, getQRPixelCoords } from '@/lib/poster-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

async function generateQRBuffer(code, size) {
  const url = `https://quttrr.com/q/${code}`;
  return await QRCode.toBuffer(url, {
    type: 'png',
    width: size,
    margin: 0,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

async function makePoster(code, templateBuffer, qrCoords) {
  const qrBuffer = await generateQRBuffer(code, qrCoords.width);
  const qrResized = await sharp(qrBuffer)
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
    const { codes } = await request.json();

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

    // Load template once
    const { buffer: templateBuffer, meta } = await loadTemplate();
    const config = await getPosterConfig();
    const qrCoords = getQRPixelCoords(meta.width, meta.height, config);

    // Generate posters in parallel (concurrency limit for stability)
    const CONCURRENCY = 8; // Higher since local QR generation is fast
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
      `Generated: ${new Date().toLocaleString('en-IN')}\n` +
      `Total requested: ${codes.length}\n` +
      `Successful: ${successCount}\n` +
      `Failed: ${failCount}\n\n` +
      `Each poster is a print-ready PNG (A4 portrait).\n` +
      `Print at 100% scale on A4 paper.\n` +
      `Recommended: 200 GSM paper + lamination for outdoor use.\n`
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `quttr-posters-${new Date().toISOString().split('T')[0]}-${successCount}.zip`;

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
