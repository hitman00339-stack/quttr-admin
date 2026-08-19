import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { getDb } from '@/lib/mongodb';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  // Composite + JPEG output
  return await sharp(templateBuffer)
    .composite([{ input: qrResized, left: qrCoords.x, top: qrCoords.y }])
    .jpeg({
      quality: 95,               // 95 = visually lossless, smaller than PNG
      chromaSubsampling: '4:4:4', // Best color quality
      mozjpeg: true,             // Better compression
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

    const meta = await sharp(templateBuffer).metadata();
    const posterWidth = meta.width;
    const posterHeight = meta.height;

    const qrCoords = getQRPixelCoords(posterWidth, posterHeight, poster.qr_config);

    const batchName = qrCodes[0]?.batch_name || batchId;
    const cleanBatchName = batchName.replace(/[^a-z0-9]/gi, '-');
    const cleanPosterName = (poster.name || 'poster').replace(/[^a-z0-9]/gi, '-');

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

    // Build ZIP with JPEG files
    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;
    posters.forEach((p) => {
      if (p.ok) {
        zip.file(`quttr-poster-${p.code}.jpg`, p.buffer);
        successCount++;
      } else {
        failCount++;
      }
    });

    zip.file(
      'README.txt',
      `Quttr QR Posters — JPEG (High Quality)\n` +
      `═══════════════════════════════════\n` +
      `Batch:         ${batchName}\n` +
      `Poster:        ${poster.name}\n` +
      `Dimensions:    ${posterWidth}×${posterHeight}px\n` +
      `Format:        JPEG (95% quality)\n` +
      `Filter:        ${statusFilter || 'all statuses'}\n` +
      `This ZIP:      Part ${chunk} of ${totalChunks}\n` +
      `Posters here:  ${successCount}\n` +
      `Failed:        ${failCount}\n` +
      `Batch total:   ${totalCount}\n` +
      `Generated:     ${new Date().toLocaleString('en-IN')}\n` +
      `═══════════════════════════════════\n\n` +
      (totalChunks > 1
        ? `⚠️  MULTI-PART DOWNLOAD\n` +
          `This is part ${chunk} of ${totalChunks}. Download all parts.\n\n`
        : '') +
      `📄 Print settings:\n` +
      `   - Paper: A4 (210×297mm)\n` +
      `   - Scale: 100% (no scaling)\n` +
      `   - Recommended: 200 GSM matte paper + lamination\n`
    );

    // Use DEFLATE compression since JPEGs are already compressed
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 3 }, // Light compression (JPEGs don't compress much)
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
