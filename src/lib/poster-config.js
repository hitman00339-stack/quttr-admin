import { getDb } from '@/lib/mongodb';

export const DEFAULT_CONFIG = {
  templatePath: '/poster-template.png',
  qr: {
    xPercent: 4.5,
    yPercent: 61.5,
    widthPercent: 34,
    heightPercent: 22.5,
  },
};

// Load saved config from DB, or use defaults
let cachedConfig = null;
let cacheTime = 0;

export async function getPosterConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < 30000) return cachedConfig; // 30s cache

  try {
    const db = await getDb();
    const doc = await db.collection('app_config').findOne({ key: 'poster_qr_position' });
    if (doc?.value) {
      cachedConfig = { ...DEFAULT_CONFIG, qr: doc.value };
    } else {
      cachedConfig = DEFAULT_CONFIG;
    }
    cacheTime = now;
    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function getQRPixelCoords(posterWidth, posterHeight, config = DEFAULT_CONFIG) {
  const c = config.qr;
  return {
    x: Math.round((c.xPercent / 100) * posterWidth),
    y: Math.round((c.yPercent / 100) * posterHeight),
    width: Math.round((c.widthPercent / 100) * posterWidth),
    height: Math.round((c.widthPercent / 100) * posterWidth),
  };
}
