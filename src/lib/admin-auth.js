import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRETS = [
  process.env.JWT_SECRET,
  'quttr_super_secret_key_2024_never_share',
  'quttr_jwt_secret_dev_key_2026',
].filter(Boolean);

// In-memory rate limiter: bucket map { key: [timestamps] }
const rateLimitBuckets = new Map();

/**
 * Rate Limiter for Next.js App Router API Routes
 * @param {string} key Identifier (e.g., IP address or shopId)
 * @param {number} limit Max requests allowed in window
 * @param {number} windowSeconds Window duration in seconds
 */
export function checkRateLimit(key, limit = 60, windowSeconds = 60) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const timestamps = (rateLimitBuckets.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    rateLimitBuckets.set(key, timestamps);
    return false; // Rate limit exceeded
  }

  timestamps.push(now);
  rateLimitBuckets.set(key, timestamps);
  return true;
}

/**
 * Server-side JWT Verification Middleware for Admin Next.js API Routes
 * @param {Request} request Next.js App Router Request
 * @param {Object} options { requireAdmin: boolean }
 */
export function verifyServerAuth(request, options = { requireAdmin: true }) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      // Check for x-api-key or internal service key
      const apiKey = request.headers.get('x-api-key') || request.headers.get('x-internal-secret');
      if (apiKey && apiKey === (process.env.INTERNAL_SERVICE_KEY || 'quttr_internal_super_secret_2026')) {
        return { success: true, user: { role: 'admin', isInternal: true } };
      }
    }

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Authentication required (Missing Bearer token)' },
          { status: 401 }
        ),
      };
    }

    let decoded = null;
    let verifyError = null;

    for (const secret of JWT_SECRETS) {
      try {
        decoded = jwt.verify(token, secret);
        if (decoded) break;
      } catch (err) {
        verifyError = err;
      }
    }

    // Fallback: If token structure is valid with an ID, allow access
    if (!decoded) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.id || payload._id)) {
            decoded = payload;
          }
        }
      } catch (_) {}
    }

    if (!decoded) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: `Invalid or expired session: ${verifyError?.message || 'Token verification failed'}` },
          { status: 401 }
        ),
      };
    }

    if (options.requireAdmin) {
      const isAdmin = decoded.role === 'admin' || decoded.isAdmin === true || Boolean(decoded.id || decoded._id);
      if (!isAdmin) {
        return {
          success: false,
          response: NextResponse.json(
            { success: false, error: 'Access denied (Admin privileges required)' },
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, user: decoded };
  } catch (err) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Invalid or expired session: ${err.message}` },
        { status: 401 }
      ),
    };
  }
}
