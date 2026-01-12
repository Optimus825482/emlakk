"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface GoogleSettings {
  googleAnalyticsId: string | null;
  googleSearchConsoleCode: string | null;
}

export function GoogleAnalytics() {
  const [settings, setSettings] = useState<GoogleSettings | null>(null);
  const pathname = usePathname();

  // Admin sayfalarında GA'yı devre dışı bırak
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    // Admin sayfalarında fetch yapma
    if (isAdminPage) return;

    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const result = await response.json();
          setSettings({
            googleAnalyticsId: result.data?.googleAnalyticsId || null,
            googleSearchConsoleCode:
              result.data?.googleSearchConsoleCode || null,
          });
        }
      } catch (error) {
        console.error("Google settings fetch error:", error);
      }
    }
    fetchSettings();
  }, [isAdminPage]);

  // Admin sayfalarında veya GA ID yoksa render etme
  if (isAdminPage || !settings?.googleAnalyticsId) return null;

  return (
    <>
      {/* Google Analytics 4 - Admin sayfaları hariç */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.googleAnalyticsId}', {
            page_path: window.location.pathname
          });
        `}
      </Script>
    </>
  );
}
