import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse | Response> | NextResponse | Response;

interface UserSession extends Session {
  user: Session["user"] & { role?: string };
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: {
    params: Promise<Record<string, string>>;
    session: UserSession;
  }
) => Promise<NextResponse | Response> | NextResponse | Response;

/**
 * Wrapper for routes that require admin authentication
 * Returns 401 if not authenticated, 403 if not admin
 */
export function withAdmin(handler: AuthenticatedHandler): RouteHandler {
  return async (request, context) => {
    try {
      const session = (await auth()) as UserSession | null;

      if (!session?.user) {
        return NextResponse.json(
          { error: "Yetkilendirme gerekli" },
          { status: 401 }
        );
      }

      if (session.user.role !== "admin") {
        return NextResponse.json(
          { error: "Bu islem icin admin yetkisi gerekli" },
          { status: 403 }
        );
      }

      return handler(request, { ...context, session });
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Yetkilendirme hatasi" },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for routes that require any authenticated user
 * Returns 401 if not authenticated
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (request, context) => {
    try {
      const session = (await auth()) as UserSession | null;

      if (!session?.user) {
        return NextResponse.json(
          { error: "Yetkilendirme gerekli" },
          { status: 401 }
        );
      }

      return handler(request, { ...context, session });
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Yetkilendirme hatasi" },
        { status: 500 }
      );
    }
  };
}

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Basic rate limiting helper
 * @param identifier - Unique identifier (e.g., IP address)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Wrapper with rate limiting for admin routes
 * @param handler - Route handler
 * @param limit - Requests per minute (default: 60)
 */
export function withAdminRateLimit(
  handler: AuthenticatedHandler,
  limit: number = 60
): RouteHandler {
  return async (request, context) => {
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(`admin:${ip}`, limit, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen bekleyin." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    return withAdmin(handler)(request, context);
  };
}
