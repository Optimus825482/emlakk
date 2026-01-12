"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Analytics Wrapper
 * Admin sayfalarında (/admin/*) analytics'i devre dışı bırakır
 * Sadece public sayfaları takip eder
 */
export function AnalyticsWrapper() {
  const pathname = usePathname();

  // Admin sayfalarında analytics'i devre dışı bırak
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
