import { getDb } from '@/lib/mongodb';

/**
 * Default QR position on poster (as percentages, so it works
 * regardless of image resolution).
 * These are initial estimates for your poster — fine-tune via
 * the calibration tool at /dashboard/qr-print/calibrate.
 */
export const DEFAULT_CONFIG = {
  templatePath: '/poster-template.png',
  qr: {
    xPercent: 4.5,      // Left offset (% of poster width)
    yPercent: 61.5,     // Top offset (% of poster height)
    widthPercent: 34,   // QR width (% of poster width)
    heightPercent: 22.5,
  },
};

/**
 * Cached config for performance (30s cache).
 * Loads from `app_config` collection if calibration has been saved.
 */
let cachedConfig = null;
let cacheTime = 0;

export async function getPosterConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < 30_000) return cachedConfig;

  try {
    const db = await getDb();
    const doc = await db
      .collection('app_config')
      .findOne({ key: 'poster_qr_position' });

    if (doc?.value) {
      cachedConfig = { ...DEFAULT_CONFIG, qr: doc.value };
    } else {
      cachedConfig = DEFAULT_CONFIG;
    }
    cacheTime = now;
    return cachedConfig;
  } catch (e) {
    console.error('[poster-config] DB load failed, using defaults:', e.message);
    return DEFAULT_CONFIG;
  }
}

/**
 * Convert percentage-based QR config to actual pixel coordinates
 * for a given poster image size.
 */
export function getQRPixelCoords(posterWidth, posterHeight, config = DEFAULT_CONFIG) {
  const c = config.qr;
  return {
    x: Math.round((c.xPercent / 100) * posterWidth),
    y: Math.round((c.yPercent / 100) * posterHeight),
    // Keep QR square using widthPercent for both dimensions
    // (widthPercent is relative to poster width — most consistent)
    width: Math.round((c.widthPercent / 100) * posterWidth),
    height: Math.round((c.widthPercent / 100) * posterWidth),
  };
}

/**
 * Invalidate cache — call after saving new config.
 */
export function invalidatePosterConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}
