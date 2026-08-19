import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs/promises';
import { getDb } from '@/lib/mongodb';
import { getPosterConfig, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

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

/**
 * GET /api/qr/poster-batch/BATCH_XXX
 * Optional query params:
 *   ?status=INACTIVE  → only inactive
 *   ?status=ACTIVE    → only active
 *   (no status)       → all
 */
export async function GET(request, { params }) {
  try {
    const { batchId } = params;
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: 'Batch ID required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // ACTIVE | INACTIVE | null

    // 1. Fetch all QRs in this batch
    const db = await getDb();
    const query = { batch_id: batchId };
    if (statusFilter === 'ACTIVE') query.status = 'ACTIVE';
    if (statusFilter === 'INACTIVE') query.status = 'INACTIVE';

    const qrCodes = await db
      .collection('qr_codes')
      .find(query)
      .toArray();

    if (qrCodes.length === 0) {
      return NextResponse.json(
        { success: false, message: `No QRs found in batch ${batchId}` },
        { status: 404 }
      );
    }

    if (qrCodes.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: `Batch has ${qrCodes.length} QRs. Max 200 per download. Use /dashboard/qr-print/bulk to filter.`,
        },
        { status: 400 }
      );
    }

    // 2. Get batch name for filename
    const batchName = qrCodes[0]?.batch_name || batchId;
    const cleanBatchName = batchName.replace(/[^a-z0-9]/gi, '-');

    // 3. Load poster template
    const { buffer: templateBuffer, meta } = await loadTemplate();
    const config = await getPosterConfig();
    const qrCoords = getQRPixelCoords(meta.width, meta.height, config);

    // 4. Generate posters
    const CONCURRENCY = 5;
    const posters = [];
    for (let i = 0; i < qrCodes.length; i += CONCURRENCY) {
      const batch = qrCodes.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (qr) => {
          try {
            const buffer = await makePoster(qr.short_code, templateBuffer, qrCoords);
            return { code: qr.short_code, buffer, ok: true };
          } catch (err) {
            return { code: qr.short_code, ok: false, error: err.message };
          }
        })
      );
      posters.push(...results);
    }

    // 5. Build ZIP
    const zip = new JSZip();
    let successCount = 0;
    posters.forEach((p) => {
      if (p.ok) {
        zip.file(`quttr-poster-${p.code}.png`, p.buffer);
        successCount++;
      }
    });

    zip.file(
      'README.txt',
      `Quttr QR Posters — Batch: ${batchName}\n` +
      `Batch ID: ${batchId}\n` +
      `Generated: ${new Date().toLocaleString('en-IN')}\n` +
      `Total posters: ${successCount}\n` +
      `Filter applied: ${statusFilter || 'all statuses'}\n\n` +
      `Each poster is print-ready A4 PNG.\n` +
      `Print at 100% scale on 200 GSM paper.\n`
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `${cleanBatchName}-posters-${successCount}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/qr/poster-batch] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
