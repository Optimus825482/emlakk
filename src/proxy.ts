import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

// Edge-compatible auth (no DB)
const { auth } = NextAuth(authConfig);

interface AuthRequest extends NextRequest {
  auth: Session | null;
}

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  // Upload proxy - /uploads/* -> /api/uploads/*
  if (pathname.startsWith("/uploads/")) {
    const apiPath = pathname.replace("/uploads/", "/api/uploads/");
    return NextResponse.rewrite(new URL(apiPath, req.url));
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=()",
  );

  // Admin collector bypass
  if (pathname.startsWith("/admin/collector")) {
    return response;
  }

  // Admin login redirect
  if (pathname === "/admin/giris") {
    if (isLoggedIn && isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return response;
  }

  // Admin auth check
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/giris", req.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return response;
});

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/uploads/:path*"],
};
