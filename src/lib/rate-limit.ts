/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiting (production'da Redis kullan)
 *
 * @example
 * ```ts
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(req: Request) {
 *   const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
 *
 *   if (!await rateLimit(identifier)) {
 *     return new Response('Too Many Requests', { status: 429 });
 *   }
 *
 *   // ... handle request
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (production'da Redis kullan)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   * @default 10
   */
  limit?: number;

  /**
   * Time window in seconds
   * @default 60
   */
  window?: number;
}

/**
 * Check if request is rate limited
 *
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = {},
): Promise<boolean> {
  const { limit = 10, window = 60 } = config;
  const now = Date.now();
  const windowMs = window * 1000;

  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  return true;
}

/**
 * Get rate limit info for identifier
 */
export function getRateLimitInfo(identifier: string) {
  const entry = store.get(identifier);

  if (!entry) {
    return {
      remaining: 10,
      resetAt: Date.now() + 60000,
    };
  }

  return {
    remaining: Math.max(0, 10 - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware for API routes
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(async (req) => {
 *   // ... handle request
 * }, { limit: 5, window: 60 });
 * ```
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response | NextResponse>,
  config: RateLimitConfig = {},
) {
  return async (req: NextRequest): Promise<Response | NextResponse> => {
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    if (!(await rateLimit(identifier, config))) {
      const info = getRateLimitInfo(identifier);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
            retryAfter: Math.ceil((info.resetAt - Date.now()) / 1000),
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((info.resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(config.limit || 10),
            "X-RateLimit-Remaining": String(info.remaining),
            "X-RateLimit-Reset": String(Math.floor(info.resetAt / 1000)),
          },
        },
      );
    }

    return handler(req);
  };
}
