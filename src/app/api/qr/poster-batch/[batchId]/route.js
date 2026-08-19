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

    const db = await getDb();
    const query = { batch_id: batchId };
    if (statusFilter === 'ACTIVE') query.status = 'ACTIVE';
    if (statusFilter === 'INACTIVE') query.status = 'INACTIVE';

    const qrCodes = await db.collection('qr_codes').find(query).toArray();
    if (qrCodes.length === 0) {
      return NextResponse.json({ success: false, message: `No QRs found in batch ${batchId}` }, { status: 404 });
    }
    if (qrCodes.length > 200) {
      return NextResponse.json({ success: false, message: `Batch has ${qrCodes.length} QRs. Max 200 per download.` }, { status: 400 });
    }

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
      `Quttr QR Posters\nBatch: ${batchName}\nPoster: ${poster.name}\nTotal: ${successCount}\nGenerated: ${new Date().toLocaleString('en-IN')}\n`
    );

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `${cleanBatchName}-${cleanPosterName}-${successCount}.zip`;

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
