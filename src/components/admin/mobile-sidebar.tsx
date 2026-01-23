"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface BadgeCounts {
  appointments: number;
  messages: number;
  valuations: number;
}

const coreModules = [
  {
    href: "/admin",
    icon: "dashboard",
    label: "Kontrol Paneli",
    badgeKey: null,
  },
  {
    href: "/admin/ilanlar",
    icon: "real_estate_agent",
    label: "İlan Yönetimi",
    badgeKey: null,
  },
  {
    href: "/admin/emlak-haritasi",
    icon: "map",
    label: "Emlak Haritası",
    badgeKey: null,
  },
  {
    href: "/admin/randevular",
    icon: "calendar_month",
    label: "Randevular",
    badgeKey: "appointments",
  },
  {
    href: "/admin/degerlemeler",
    icon: "calculate",
    label: "Değerleme Raporları",
    badgeKey: "valuations",
  },
  {
    href: "/admin/mesajlar",
    icon: "mail",
    label: "Mesajlar",
    badgeKey: "messages",
  },
];

const contentModules = [
  {
    href: "/admin/sayfalar",
    icon: "web_stories",
    label: "Web Sitesi Sayfa Yönetimi",
  },
  {
    href: "/admin/seo",
    icon: "travel_explore",
    label: "SEO Yönetimi",
  },
  {
    href: "/admin/sosyal-medya",
    icon: "share",
    label: "Sosyal Medya",
  },
];

const tools = [
  {
    href: "/admin/sahibinden-inceleme",
    icon: "search",
    label: "Sahibinden İnceleme",
  },
  {
    href: "/admin/ilan-analitik",
    icon: "insights",
    label: "İlan Analitikleri",
  },
  { href: "/admin/analitik", icon: "analytics", label: "Site Analitik" },
  { href: "/admin/kullanicilar", icon: "group", label: "Kullanıcılar" },
  {
    href: "/admin/ai-bilgi-tabani",
    icon: "psychology",
    label: "AI Bilgi Tabanı",
  },
  { href: "/admin/ayarlar", icon: "settings", label: "Ayarlar" },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<BadgeCounts>({
    appointments: 0,
    messages: 0,
    valuations: 0,
  });

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
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

  async function fetchCounts() {
    try {
      const res = await fetch("/api/admin/counts");
      const data = await res.json();
      setCounts(data);
    } catch {
      // Sessizce başarısız ol
    }
  }

  function getBadgeCount(badgeKey: string | null): number {
    if (!badgeKey) return 0;
    return counts[badgeKey as keyof BadgeCounts] || 0;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] md:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-slate-800 border-r border-slate-700 z-[9999] flex flex-col overflow-hidden md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <Icon name="terminal" className="text-xl" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold tracking-wider leading-none">
                    DEMİR-NET
                  </h2>
                  <p className="text-emerald-400 text-[10px] font-mono">
                    KOMUTA MERKEZİ
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Ana Modüller */}
              <div>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Ana Modüller
                </h3>
                <nav className="space-y-1">
                  {coreModules.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" &&
                        pathname.startsWith(item.href));
                    const badgeCount = getBadgeCount(item.badgeKey);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-3 text-sm font-medium rounded-md transition-colors touch-manipulation",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white active:bg-slate-600",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon name={item.icon} className="text-[22px]" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {badgeCount > 0 && (
                          <span className="min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Content Management */}
              <div>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  İçerik
                </h3>
                <nav className="space-y-1">
                  {contentModules.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors touch-manipulation",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white active:bg-slate-600",
                        )}
                      >
                        <Icon name={item.icon} className="text-[22px]" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Araçlar */}
              <div>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Araçlar
                </h3>
                <nav className="space-y-1">
                  {tools.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors touch-manipulation",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white active:bg-slate-600",
                        )}
                      >
                        <Icon name={item.icon} className="text-[22px]" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Footer - Sistem Durumu */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="bolt" className="text-emerald-400 text-sm" />
                  <span className="text-xs font-bold text-emerald-400 uppercase">
                    Sistem Durumu
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Veritabanı</span>
                    <span className="text-emerald-400">Çevrimiçi</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>AI Motoru</span>
                    <span className="text-emerald-400">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
