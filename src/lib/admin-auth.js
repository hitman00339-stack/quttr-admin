import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'quttr_jwt_secret_dev_key_2026';

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
      if (apiKey && apiKey === process.env.INTERNAL_SERVICE_KEY) {
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

    const decoded = jwt.verify(token, JWT_SECRET);

    if (options.requireAdmin) {
      const isAdmin = decoded.role === 'admin' || decoded.isAdmin === true;
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

