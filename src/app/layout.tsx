import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans } from "next/font/google";
import { AnalyticsWrapper } from "@/components/analytics/analytics-wrapper";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DEMİR Gayrimenkul | Hendek'in Sağlam Kararı",
  description:
    "Demir Gayrimenkul - Hendek'in Premium Gayrimenkul Danışmanlığı. AI destekli değerleme, sanayi, tarım ve konut yatırımları.",
  keywords: [
    "gayrimenkul",
    "hendek",
    "sakarya",
    "arsa",
    "sanayi",
    "tarım",
    "konut",
    "yatırım",
    "değerleme",
    "AI",
  ],
  authors: [{ name: "Demir Gayrimenkul" }],
  openGraph: {
    title: "DEMİR Gayrimenkul | Hendek'in Sağlam Kararı",
    description:
      "Geleneksel dürüstlük, yapay zeka destekli yatırım öngörüleri ile buluşuyor.",
    type: "website",
    locale: "tr_TR",
  },
};

// Google Search Console doğrulama kodunu dinamik olarak ekle
async function getGoogleVerification(): Promise<string | null> {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings?.googleSearchConsoleCode || null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleVerification = await getGoogleVerification();

  return (
    <html lang="tr" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {googleVerification && (
          <meta name="google-site-verification" content={googleVerification} />
        )}
      </head>
      <body
        className={`${spaceGrotesk.variable} ${notoSans.variable} font-sans antialiased`}
      >
        {children}
        <CookieBanner />
        <AnalyticsWrapper />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
