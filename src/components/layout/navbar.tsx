"use client";

import { useEffect, useState, memo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { MarketTicker } from "./market-ticker";

interface SiteSettings {
  siteName: string;
  siteTagline?: string;
  logo?: string;
}

import { motion, AnimatePresence } from "framer-motion";

interface SiteSettings {
  siteName: string;
  siteTagline?: string;
  logo?: string;
}

const navLinks = [
  { href: "/", label: "Anasayfa", icon: "home" },
  { href: "/hakkimizda", label: "Hakkımızda", icon: "info" },
  { href: "/ilanlar", label: "İlanlar", icon: "real_estate_agent" },
  {
    href: "/degerleme",
    label: "Mülk Değerleme Platformu",
    icon: "auto_awesome",
    highlight: true,
  },
  { href: "/rehber", label: "Yatırım Rehberi", icon: "explore" },
  { href: "/iletisim", label: "Bize Ulaşın", icon: "mail" },
];

export const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "DEMİR",
    siteTagline: "Gayrimenkul",
  });

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const result = await response.json();
          console.log("Navbar - Settings API response:", result);
          if (result.data) {
            setSettings({
              siteName: result.data.siteName || "DEMİR",
              siteTagline: result.data.siteTagline || "Gayrimenkul",
              logo: result.data.logo,
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
                {settings.logo || "/logo.png" ? (
                  <img
                    src={settings.logo || "/logo.png"}
                    alt={settings.siteName}
                    className="w-23 h-20 rounded-2xl object-cover"
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
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-[var(--demir-slate)] hover:text-[var(--terracotta)] transition-colors z-[60]"
              aria-label="Toggle Menu"
            >
              <Icon name={isOpen ? "close" : "menu"} className="text-2xl" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-[300px] bg-white z-[60] flex flex-col shadow-2xl lg:hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-[var(--demir-slate)]">
                      {mainName}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--terracotta)] uppercase tracking-widest">
                      {settings.siteTagline}
                    </span>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"
                  >
                    <Icon name="close" className="text-2xl text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.98] touch-manipulation",
                        link.highlight
                          ? "bg-[var(--terracotta)]/5 text-[var(--terracotta)] border border-[var(--terracotta)]/10"
                          : "text-[var(--demir-slate)] hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center",
                          link.highlight
                            ? "bg-[var(--terracotta)] text-white shadow-lg shadow-[var(--terracotta)]/20"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        <Icon
                          name={link.icon}
                          className="text-xl"
                          filled={link.highlight}
                        />
                      </div>
                      <span className="font-semibold text-base">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 space-y-4">
                  <Link
                    href="/randevu"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-3 w-full py-4 font-bold text-[var(--demir-slate)] border-2 border-gray-200 rounded-2xl active:scale-[0.98] transition-all"
                  >
                    <Icon name="coffee" className="text-xl" />
                    Kahve İçelim
                  </Link>
                  <Link
                    href="/iletisim"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-3 w-full py-4 font-bold text-white bg-[var(--demir-slate)] rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    <Icon name="call" className="text-xl" />
                    Hemen Arayın
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
});

Navbar.displayName = "Navbar";
