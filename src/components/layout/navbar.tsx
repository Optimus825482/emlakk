"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MarketTicker } from "./market-ticker";

interface SiteSettings {
  siteName: string;
  siteTagline?: string;
  logo?: string;
}

export function Navbar() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "DEMİR",
    siteTagline: "Gayrimenkul",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            setSettings({
              siteName: data.siteName || "DEMİR",
              siteTagline: data.siteTagline || "Gayrimenkul",
              logo: data.logo,
            });
          }
        }
      } catch (error) {
        console.error("Site ayarları yüklenemedi:", error);
      }
    }
    fetchSettings();
  }, []);

  // Site adını parçala (ilk kelime büyük, geri kalan küçük)
  const nameParts = settings.siteName.split(" ");
  const mainName = nameParts[0]?.toUpperCase() || "DEMİR";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass border-b border-gray-200/75">
        {/* Market Ticker - Navbar üstünde */}
        <MarketTicker />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt={settings.siteName}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[var(--demir-slate)] rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="apartment" className="text-white text-xl" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--terracotta)] rounded-full flex items-center justify-center">
                  <Icon
                    name="verified"
                    className="text-white text-[10px]"
                    filled
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[var(--demir-slate)]">
                  {mainName}
                </span>
                <span className="text-[10px] font-medium text-[var(--terracotta)] tracking-widest uppercase -mt-1">
                  {settings.siteTagline}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2  font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5"
              >
                Anasayfa
              </Link>

              <Link
                href="/hakkimizda"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5"
              >
                Hakkımızda
              </Link>

              <Link
                href="/ilanlar"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5"
              >
                İlanlar
              </Link>

              <Link
                href="/harita"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5 flex items-center gap-1.5"
              >
                <Icon
                  name="map"
                  className="text-[var(--terracotta)] text-base"
                />
                Emlak Haritası
              </Link>

              <Link
                href="/degerleme"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5 flex items-center gap-1.5"
              >
                <Icon
                  name="auto_awesome"
                  className="text-[var(--terracotta)] text-base"
                  filled
                />
                Mülk Değerleme Platformu
              </Link>
              <Link
                href="/rehber"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5"
              >
                Yatırım Rehberi
              </Link>

              <Link
                href="/iletisim"
                className="px-4 py-2 text-sm font-medium text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors rounded-lg hover:bg-[var(--terracotta)]/5"
              >
                Bize Ulaşın
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/randevu"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--demir-slate)] border-2 border-[var(--demir-slate)]/20 rounded-xl hover:border-[var(--terracotta)] hover:text-[var(--terracotta)] transition-all"
              >
                <Icon name="coffee" className="text-lg" />
                Kahve İçelim
              </Link>
              <Link
                href="/iletisim"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[var(--demir-slate)] rounded-xl hover:bg-[var(--terracotta)] transition-all shadow-lg"
              >
                <Icon name="call" className="text-lg" />
                İletişim
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors">
              <Icon name="menu" className="text-2xl" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
