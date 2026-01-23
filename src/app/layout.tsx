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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "DEMİR Gayrimenkul | Sakarya Hendek Emlak & Yatırım Danışmanlığı",
    template: "%s | DEMİR Gayrimenkul",
  },
  description:
    "Demir Gayrimenkul - Sakarya ve Hendek'in öncü emlak ve gayrimenkul yatırım danışmanlığı. AI destekli değerleme, kiralık ve satılık daire, arsa, sanayi ve tarım arazileri.",
  keywords: [
    "emlak",
    "gayrimenkul",
    "hendek emlak",
    "sakarya emlak",
    "hendek gayrimenkul",
    "sakarya gayrimenkul",
    "satılık daire hendek",
    "kiralık daire hendek",
    "satılık arsa sakarya",
    "yatırım danışmanlığı",
    "değerleme",
    "arsa",
    "tarım arazisi",
    "sanayi parseli",
    "AI emlak",
  ],
  authors: [{ name: "Demir Gayrimenkul" }],
  verification: {
    google: "olsqZYoGQT6m4V-kcBAI2-VCG6Z_TRLqZNLY4LRbvXs",
    yandex: "17f21331080420eb",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "DEMİR Gayrimenkul | Hendek'in Sağlam Kararı",
    description:
      "Geleneksel dürüstlük, yapay zeka destekli yatırım öngörüleri ile buluşuyor. Sakarya Hendek'te güvenilir emlak ortağınız.",
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: "DEMİR Gayrimenkul",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Demir Gayrimenkul Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DEMİR Gayrimenkul | Hendek'in Sağlam Kararı",
    description:
      "Geleneksel dürüstlük, yapay zeka destekli yatırım öngörüleri ile buluşuyor.",
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
