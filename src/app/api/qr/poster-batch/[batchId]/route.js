import { NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { getDb } from '@/lib/mongodb';
import { getPoster, getImageBuffer, getQRPixelCoords } from '@/lib/poster-config';
import { generateQuttrQR } from '@/lib/styled-qr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Safe limit for Vercel Free tier (60s timeout)
const MAX_POSTERS_PER_REQUEST = 50;

async function makePoster(code, templateBuffer, qrCoords) {
  const styledQRBuffer = await generateQuttrQR(code, qrCoords.width);
  const qrResized = await sharp(styledQRBuffer)
    .resize(qrCoords.width, qrCoords.height, { fit: 'contain', background: '#ffffff' })
    .toBuffer();
  return await sharp(templateBuffer)
    .composite([{ input: qrResized, left: qrCoords.x, top: qrCoords.y }])
    .png({ quality: 100, compressionLevel: 6 })
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
    const chunk = parseInt(searchParams.get('chunk') || '1');   // Which chunk (1, 2, 3...)
    const chunkSize = parseInt(searchParams.get('size') || String(MAX_POSTERS_PER_REQUEST));

    const db = await getDb();
    const query = { batch_id: batchId };
    if (statusFilter === 'ACTIVE') query.status = 'ACTIVE';
    if (statusFilter === 'INACTIVE') query.status = 'INACTIVE';

    const totalCount = await db.collection('qr_codes').countDocuments(query);
    if (totalCount === 0) {
      return NextResponse.json({ success: false, message: `No QRs found in batch ${batchId}` }, { status: 404 });
    }

    // Calculate chunk boundaries
    const safeChunkSize = Math.min(chunkSize, MAX_POSTERS_PER_REQUEST);
    const totalChunks = Math.ceil(totalCount / safeChunkSize);
    const skip = (chunk - 1) * safeChunkSize;

    if (chunk > totalChunks || chunk < 1) {
      return NextResponse.json(
        { success: false, message: `Invalid chunk ${chunk}. Total chunks: ${totalChunks}` },
        { status: 400 }
      );
    }

    // Fetch this chunk only
    const qrCodes = await db.collection('qr_codes')
      .find(query)
      .skip(skip)
      .limit(safeChunkSize)
      .toArray();

    const poster = await getPoster(posterId);
    if (!poster) {
      return NextResponse.json(
        { success: false, message: 'No poster template available. Upload one at /dashboard/posters' },
        { status: 404 }
      );
    }

    const templateBuffer = getImageBuffer(poster);
    if (!templateBuffer) {
      return NextResponse.json({ success: false, message: 'Poster image data invalid' }, { status: 500 });
    }

    let posterWidth = poster.width;
    let posterHeight = poster.height;
    if (!posterWidth || !posterHeight) {
      const meta = await sharp(templateBuffer).metadata();
      posterWidth = meta.width;
      posterHeight = meta.height;
    }

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
      `Quttr QR Posters\nBatch: ${batchName}\nPoster: ${poster.name}\n` +
      `Chunk: ${chunk} of ${totalChunks}\nCount in this ZIP: ${successCount}\n` +
      `Total posters in batch: ${totalCount}\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n` +
      (totalChunks > 1 ? `⚠️ This is PART ${chunk} of ${totalChunks}. Download remaining chunks separately.\n` : '')
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
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
