'use client';

import JSZip from 'jszip';
import QRCode from 'qrcode';

/**
 * Client-side poster generator
 * Generates posters in browser using Canvas API
 * No server processing = no timeouts, no memory limits
 */

/**
 * Load an image from URL
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generate styled QR code (with red circle + scissors logo) as canvas
 */
async function generateStyledQR(shortCode, size = 400) {
  const url = `https://quttrr.com/q/${shortCode}`;
  
  // Generate base QR
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Generate QR code
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  
  // Draw styled center logo (red circle + gold scissors)
  const cx = size / 2;
  const cy = size / 2;
  const logoR = size * 0.1;
  const whiteBgR = logoR + 4;
  const s = logoR * 0.7;
  
  // White circle background
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, whiteBgR, 0, Math.PI * 2);
  ctx.fill();
  
  // Red circle
  ctx.fillStyle = '#E63946';
  ctx.beginPath();
  ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
  ctx.fill();
  
  // Scissors icon (gold)
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.arc(cx - s / 2, cy - s / 3, s / 4, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx - s / 2, cy + s / 3, s / 4, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(cx - s / 4, cy - s / 3);
  ctx.lineTo(cx + s / 2, cy + s / 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(cx - s / 4, cy + s / 3);
  ctx.lineTo(cx + s / 2, cy - s / 2);
  ctx.stroke();
  
  return canvas;
}

/**
 * Generate a single poster (QR overlaid on template)
 */
async function generatePoster(templateImg, shortCode, qrConfig, quality = 0.92) {
  const canvas = document.createElement('canvas');
  const width = templateImg.naturalWidth;
  const height = templateImg.naturalHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Draw poster template
  ctx.drawImage(templateImg, 0, 0, width, height);
  
  // Calculate QR position (from percentages)
  const qrX = Math.round((qrConfig.xPercent / 100) * width);
  const qrY = Math.round((qrConfig.yPercent / 100) * height);
  const qrSize = Math.round((qrConfig.widthPercent / 100) * width);
  
  // Generate QR at 2x for sharp downscale
  const qrCanvas = await generateStyledQR(shortCode, qrSize * 2);
  
  // Draw QR onto poster (downscale for sharpness)
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
  
  // Convert to JPEG blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Main function: Generate multiple posters and return ZIP
 * @param {Object} config
 * @param {string} config.posterImageUrl - URL of poster template
 * @param {Object} config.qrConfig - QR position config
 * @param {string[]} config.codes - Array of QR short codes
 * @param {string} config.batchName - Batch name for filename
 * @param {string} config.posterName - Poster name for filename
 * @param {Function} config.onProgress - Progress callback (current, total)
 * @param {number} config.quality - JPEG quality (0.7-1.0), default 0.92
 * @param {number} config.concurrency - How many to generate in parallel, default 3
 */
export async function generatePostersZip({
  posterImageUrl,
  qrConfig,
  codes,
  batchName = 'batch',
  posterName = 'poster',
  onProgress,
  quality = 0.92,
  concurrency = 3,
}) {
  // 1. Load poster template ONCE
  onProgress?.(0, codes.length, 'Loading poster template...');
  const templateImg = await loadImage(posterImageUrl);
  
  // 2. Generate posters in parallel batches
  const zip = new JSZip();
  let completed = 0;
  const errors = [];
  
  for (let i = 0; i < codes.length; i += concurrency) {
    const batch = codes.slice(i, i + concurrency);
    
    const results = await Promise.allSettled(
      batch.map(async (code) => {
        try {
          const blob = await generatePoster(templateImg, code, qrConfig, quality);
          return { code, blob, ok: true };
        } catch (err) {
          console.error(`Failed for ${code}:`, err);
          return { code, ok: false, error: err.message };
        }
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { code, blob, ok, error } = result.value;
        if (ok && blob) {
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(`quttr-poster-${code}.jpg`, arrayBuffer);
        } else {
          errors.push({ code, error });
        }
      } else {
        errors.push({ code: 'unknown', error: result.reason?.message || 'Unknown error' });
      }
      completed++;
      onProgress?.(completed, codes.length, `Generated ${completed} of ${codes.length}...`);
    }
    
    // Small delay to prevent UI freezing
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  
  // 3. Add README
  zip.file(
    'README.txt',
    `Quttr QR Posters — JPEG Print Quality\n` +
    `═══════════════════════════════════\n` +
    `Batch:        ${batchName}\n` +
    `Poster:       ${posterName}\n` +
    `Total codes:  ${codes.length}\n` +
    `Generated:    ${codes.length - errors.length}\n` +
    `Failed:       ${errors.length}\n` +
    `Format:       JPEG (${Math.round(quality * 100)}% quality)\n` +
    `Generated:    ${new Date().toLocaleString('en-IN')}\n` +
    `Method:       Client-side (no server timeout)\n` +
    `═══════════════════════════════════\n\n` +
    (errors.length > 0
      ? `Errors:\n${errors.map((e) => `- ${e.code}: ${e.error}`).join('\n')}\n\n`
      : '') +
    `📄 Print settings:\n` +
    `   - Paper: A4 (210×297mm)\n` +
    `   - Scale: 100% (no scaling)\n` +
    `   - Recommended: 200 GSM matte paper + lamination\n`
  );
  
  // 4. Generate ZIP
  onProgress?.(codes.length, codes.length, 'Creating ZIP file...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 3 },
  });
  
  return {
    zip: zipBlob,
    successCount: codes.length - errors.length,
    failCount: errors.length,
    errors,
  };
}

/**
 * Trigger browser download of the ZIP
 */
export function downloadZip(zipBlob, filename) {
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
