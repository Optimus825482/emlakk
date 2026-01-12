"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface GoogleSettings {
  googleAnalyticsId: string | null;
  googleSearchConsoleCode: string | null;
}

export function GoogleAnalytics() {
  const [settings, setSettings] = useState<GoogleSettings | null>(null);

  useEffect(() => {
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
  }, []);

  if (!settings?.googleAnalyticsId) return null;

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.googleAnalyticsId}');
        `}
      </Script>
    </>
  );
}
