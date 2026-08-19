import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { getDb } from '@/lib/mongodb';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HARD_MAX = 100;

async function makePoster(code, templateBuffer, qrCoords) {
  // Generate QR at 2x resolution for sharper downscale
  const qrRenderSize = qrCoords.width * 2;
  const styledQRBuffer = await generateQuttrQR(code, qrRenderSize);

  // High-quality downscale
  const qrResized = await sharp(styledQRBuffer)
    .resize(qrCoords.width, qrCoords.height, {
      fit: 'contain',
      background: '#ffffff',
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 0 })
    .toBuffer();

  // LOSSLESS composite
  return await sharp(templateBuffer)
    .composite([{ input: qrResized, left: qrCoords.x, top: qrCoords.y }])
    .png({
      compressionLevel: 0,      // No compression = max quality
      adaptiveFiltering: false,
      force: true,
    })
    .toBuffer();
}

export async function GET(request, { params }) {
  try {
    const { batchId } = params;
    if (!batchId) {
      return NextResponse.json({ success: false, message: 'Batch ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const posterId = searchParams.get('poster') || null;
    const chunk = Math.max(1, parseInt(searchParams.get('chunk') || '1'));
    const requestedSize = parseInt(searchParams.get('size') || String(HARD_MAX));
    const infoOnly = searchParams.get('info') === '1';

    const chunkSize = Math.min(Math.max(1, requestedSize), HARD_MAX);

    const db = await getDb();
    const query = { batch_id: batchId };
    if (statusFilter === 'ACTIVE') query.status = 'ACTIVE';
    if (statusFilter === 'INACTIVE') query.status = 'INACTIVE';

    const totalCount = await db.collection('qr_codes').countDocuments(query);
    if (totalCount === 0) {
      return NextResponse.json({ success: false, message: `No QRs found in batch ${batchId}` }, { status: 404 });
    }

    const totalChunks = Math.ceil(totalCount / chunkSize);

    if (infoOnly) {
      return NextResponse.json({
        success: true,
        total: totalCount,
        chunkSize,
        totalChunks,
      });
    }

    if (chunk > totalChunks) {
      return NextResponse.json(
        { success: false, message: `Invalid chunk ${chunk}. Total chunks: ${totalChunks}` },
        { status: 400 }
      );
    }

    const skip = (chunk - 1) * chunkSize;
    const qrCodes = await db
      .collection('qr_codes')
      .find(query)
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(chunkSize)
      .toArray();

    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        { success: false, message: 'No poster template available. Upload at /dashboard/posters' },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json({ success: false, message: 'Poster image data invalid' }, { status: 500 });
    }

    // Get exact dimensions from actual buffer
    const meta = await sharp(templateBuffer).metadata();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, poster.qr_config);

    const batchName = qrCodes[0]?.batch_name || batchId;
    const cleanBatchName = batchName.replace(/[^a-z0-9]/gi, '-');
    const cleanPosterName = (poster.name || 'poster').replace(/[^a-z0-9]/gi, '-');

    // Concurrency 3 (lower because lossless PNG uses more memory)
    const CONCURRENCY = 3;
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

    // Build ZIP — use STORE (no compression) since PNGs are already optimized
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
      `Quttr QR Posters — LOSSLESS QUALITY\n` +
      `═══════════════════════════════════\n` +
      `Batch:         ${batchName}\n` +
      `Poster:        ${poster.name}\n` +
      `Dimensions:    ${posterWidth}×${posterHeight}px\n` +
      `Chunk:         ${chunk} of ${totalChunks}\n` +
      `Posters here:  ${successCount}\n` +
      `Generated:     ${new Date().toLocaleString('en-IN')}\n` +
      `═══════════════════════════════════\n\n` +
      `📄 Print settings:\n` +
      `   - Paper: A4 (210×297mm)\n` +
      `   - Scale: 100% (no scaling)\n` +
      `   - Resolution: Original quality preserved\n` +
      `   - Recommended: 200 GSM matte paper + lamination\n`
    );

    // STORE compression (no re-compression) — preserves PNG quality
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'STORE',
    });

    const filename = totalChunks > 1
      ? `${cleanBatchName}-${cleanPosterName}-part${chunk}of${totalChunks}-${successCount}.zip`
      : `${cleanBatchName}-${cleanPosterName}-${successCount}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Total-Chunks': String(totalChunks),
        'X-Current-Chunk': String(chunk),
        'X-Total-Posters': String(totalCount),
      },
    });
  } catch (error) {
    console.error('[api/qr/poster-batch] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
