// Central config for poster template & QR placement
// Update this via the calibration tool at /dashboard/qr-print/calibrate
// or edit manually here.

export const POSTER_CONFIG = {
  // Path to poster template (in /public folder)
  templatePath: '/poster-template.png',

  // QR position — INITIAL ESTIMATE based on your poster
  // (fine-tune via calibration tool)
  qr: {
    // Percentages (relative to poster width/height)
    // Using % makes it work regardless of actual image resolution
    xPercent: 4.5,     // 4.5% from left
    yPercent: 61.5,    // 61.5% from top
    widthPercent: 34,  // QR is 34% of poster width
    heightPercent: 22.5, // QR square (adjusted for portrait)
  },

  // Output settings
  output: {
    format: 'png',
    quality: 100,
  },
};

// Helper: get pixel coords for a given poster width/height
export function getQRPixelCoords(posterWidth, posterHeight) {
  const c = POSTER_CONFIG.qr;
  return {
    x: Math.round((c.xPercent / 100) * posterWidth),
    y: Math.round((c.yPercent / 100) * posterHeight),
    width: Math.round((c.widthPercent / 100) * posterWidth),
    height: Math.round((c.widthPercent / 100) * posterWidth), // square, use width
  };
}
