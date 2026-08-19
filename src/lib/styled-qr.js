import sharp from 'sharp';
import QRCode from 'qrcode';

/**
 * Generate a styled QR code (same as ScissorQR component)
 * - Black QR on white background
 * - Red circle in center with gold scissors icon
 * - Returns PNG buffer
 */
export async function generateStyledQR(url, size = 400) {
  // 1. Generate base QR (black on white, high error correction)
  const qrBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H', // Survives 30% damage — needed since we overlay logo
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  // 2. Create SVG overlay (red circle + scissors icon)
  const cx = size / 2;
  const cy = size / 2;
  const logoR = size * 0.1;
  const whiteBgR = logoR + 4;
  const s = logoR * 0.7;

  const svgOverlay = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- White circle background -->
      <circle cx="${cx}" cy="${cy}" r="${whiteBgR}" fill="#FFFFFF"/>
      
      <!-- Red circle -->
      <circle cx="${cx}" cy="${cy}" r="${logoR}" fill="#E63946"/>
      
      <!-- Scissors icon (gold) -->
      <g stroke="#FFD700" stroke-width="2.5" stroke-linecap="round" fill="none">
        <!-- Top circle -->
        <circle cx="${cx - s/2}" cy="${cy - s/3}" r="${s/4}"/>
        <!-- Bottom circle -->
        <circle cx="${cx - s/2}" cy="${cy + s/3}" r="${s/4}"/>
        <!-- Blade 1 (top to bottom-right) -->
        <line x1="${cx - s/4}" y1="${cy - s/3}" x2="${cx + s/2}" y2="${cy + s/2}"/>
        <!-- Blade 2 (bottom to top-right) -->
        <line x1="${cx - s/4}" y1="${cy + s/3}" x2="${cx + s/2}" y2="${cy - s/2}"/>
      </g>
    </svg>
  `;

  const overlayBuffer = Buffer.from(svgOverlay);

  // 3. Composite overlay onto QR
  const finalBuffer = await sharp(qrBuffer)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return finalBuffer;
}

/**
 * Convenience: generate styled QR for a Quttr short code
 */
export async function generateQuttrQR(shortCode, size = 400) {
  const url = `https://quttrr.com/q/${shortCode}`;
  return generateStyledQR(url, size);
}
