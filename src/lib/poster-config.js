import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * ============================================================
 * POSTER CONFIG HELPER
 * ============================================================
 * Handles multi-poster system where admin can upload multiple
 * poster templates and calibrate each one individually.
 *
 * Each poster is stored in `posters` collection with:
 *   - name, description
 *   - image_data (binary buffer)
 *   - image_type (mime), image_size, width, height
 *   - is_default (only one at a time)
 *   - qr_config: { xPercent, yPercent, widthPercent, heightPercent }
 * ============================================================
 */

/**
 * Default QR position (percentages) used as fallback
 * if no poster is calibrated yet.
 */
export const DEFAULT_QR_POSITION = {
  xPercent: 4.5,
  yPercent: 61.5,
  widthPercent: 34,
  heightPercent: 22.5,
};

/**
 * Simple in-memory cache (30s) to avoid hitting DB on every poster render.
 * Keyed by poster ID (or 'default' for default poster).
 */
const posterCache = new Map();
const CACHE_TTL_MS = 30_000;

function getCached(key) {
  const entry = posterCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) {
    posterCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  posterCache.set(key, { value, time: Date.now() });
}

/**
 * Invalidate cache — call after uploading/updating/deleting a poster.
 */
export function invalidatePosterCache(posterId = null) {
  if (posterId) {
    posterCache.delete(posterId);
    posterCache.delete(posterId.toString());
  }
  // Also clear default cache since a change might affect it
  posterCache.delete('default');
}

/**
 * Get a poster by ID.
 * - If posterId is provided → returns that specific poster
 * - If posterId is null/undefined → returns default poster (is_default: true)
 * - If no default exists → returns oldest poster
 * - If no posters exist at all → returns null
 *
 * The returned object includes `image_data` (Buffer) — heavy field.
 * Use `getPosterMeta` if you don't need the image bytes.
 */
export async function getPoster(posterId = null) {
  const cacheKey = posterId ? String(posterId) : 'default';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const db = await getDb();

    // 1. Try to get specific poster by ID
    if (posterId && ObjectId.isValid(posterId)) {
      const poster = await db
        .collection('posters')
        .findOne({ _id: new ObjectId(posterId) });
      if (poster) {
        setCached(cacheKey, poster);
        return poster;
      }
    }

    // 2. Try default poster
    const defaultPoster = await db
      .collection('posters')
      .findOne({ is_default: true });
    if (defaultPoster) {
      setCached('default', defaultPoster);
      return defaultPoster;
    }

    // 3. Fallback: oldest poster
    const firstPoster = await db
      .collection('posters')
      .findOne({}, { sort: { created_at: 1 } });
    if (firstPoster) {
      setCached('default', firstPoster);
      return firstPoster;
    }

    // No posters at all
    return null;
  } catch (e) {
    console.error('[getPoster] error:', e);
    return null;
  }
}

/**
 * Lightweight version — returns poster metadata WITHOUT image_data.
 * Use this in listings/UI where you don't need the actual image bytes.
 */
export async function getPosterMeta(posterId = null) {
  try {
    const db = await getDb();

    if (posterId && ObjectId.isValid(posterId)) {
      const poster = await db
        .collection('posters')
        .findOne(
          { _id: new ObjectId(posterId) },
          { projection: { image_data: 0 } }
        );
      if (poster) return poster;
    }

    const defaultPoster = await db
      .collection('posters')
      .findOne({ is_default: true }, { projection: { image_data: 0 } });
    if (defaultPoster) return defaultPoster;

    const firstPoster = await db
      .collection('posters')
      .findOne({}, { projection: { image_data: 0 }, sort: { created_at: 1 } });
    return firstPoster;
  } catch (e) {
    console.error('[getPosterMeta] error:', e);
    return null;
  }
}

/**
 * Extract raw Buffer from a MongoDB poster document.
 * Handles both native Buffer and BSON Binary formats.
 */
export function getImageBuffer(poster) {
  if (!poster?.image_data) return null;

  if (Buffer.isBuffer(poster.image_data)) {
    return poster.image_data;
  }
  if (poster.image_data.buffer) {
    return Buffer.from(poster.image_data.buffer);
  }
  return Buffer.from(poster.image_data);
}

/**
 * Convert percentage-based QR config to actual pixel coordinates
 * for a given poster image size.
 *
 * QR is always a square — uses widthPercent for both dimensions
 * to guarantee a perfect square regardless of poster aspect ratio.
 */
export function getQRPixelCoords(posterWidth, posterHeight, qrConfig) {
  const c = qrConfig || DEFAULT_QR_POSITION;

  const width = Math.round((c.widthPercent / 100) * posterWidth);

  return {
    x: Math.round((c.xPercent / 100) * posterWidth),
    y: Math.round((c.yPercent / 100) * posterHeight),
    width,
    height: width, // always square
  };
}

/**
 * Convenience: get a poster + its QR pixel coords in one call.
 * Returns null if no poster available.
 */
export async function getPosterWithCoords(posterId = null) {
  const poster = await getPoster(posterId);
  if (!poster) return null;

  const width = poster.width || 0;
  const height = poster.height || 0;

  return {
    poster,
    coords: getQRPixelCoords(width, height, poster.qr_config),
  };
}
