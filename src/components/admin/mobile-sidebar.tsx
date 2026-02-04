"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, User } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { coreModules, contentModules, tools } from "@/constants/admin-navigation";
import { useAdminCounts } from "@/hooks/use-admin-counts";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function MobileSidebar({ isOpen, onClose, user }: MobileSidebarProps) {
  const pathname = usePathname();
  const { counts } = useAdminCounts();

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

  function getBadgeCount(badgeKey: string | null): number {
    if (!badgeKey) return 0;
    return counts[badgeKey as keyof typeof counts] || 0;
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
            className="fixed left-0 top-0 bottom-0 w-[300px] bg-slate-900 border-r border-slate-800 z-[9999] flex flex-col overflow-hidden md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobil navigasyon menüsü"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Icon name="terminal" className="text-xl" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold tracking-widest leading-none">
                    DEMİR-NET
                  </h2>
                  <p className="text-emerald-400 text-[10px] font-mono mt-1 opacity-80">
                    KOMUTA MERKEZİ
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
                aria-label="Menüyü kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="px-5 py-6 border-b border-slate-800/50 bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">
                    {user.name || "Yönetici"}
                  </p>
                  <p className="text-emerald-400 text-[10px] font-mono uppercase tracking-tighter">
                    Sistem Erişimi: Tam
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/admin/giris" })}
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                  title="Çıkış Yap"
                  aria-label="Oturumu kapat"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
              {/* Ana Modüller */}
              <section>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
                  Sistem Modülleri
                </h3>
                <nav className="space-y-1.5" role="navigation" aria-label="Sistem modülleri navigasyonu">
                  {coreModules.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" &&
                        pathname.startsWith(item.href));
                    const badgeCount = getBadgeCount(item.badgeKey);

                    return (
                      <Link
                        key={item.href}
                        href={item.href} aria-current={isActive ? "page" : undefined} className={cn(
                          "flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 touch-manipulation group",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] border-l-4 border-emerald-500"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 active:bg-slate-800",
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon
                            name={item.icon}
                            className={cn(
                              "text-[22px] transition-transform duration-300",
                              isActive ? "scale-110" : "group-hover:scale-110"
                            )}
                          />
                          <span className="tracking-wide">{item.label}</span>
                        </div>
                        {badgeCount > 0 && (
                          <span className="min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 shadow-lg shadow-red-500/20 animate-in zoom-in">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </section>

              {/* Content Management */}
              <section>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
                  İçerik Yönetimi
                </h3>
                <nav className="space-y-1.5" role="navigation" aria-label="İçerik yönetimi navigasyonu">
                  {contentModules.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 touch-manipulation group",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] border-l-4 border-emerald-500"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 active:bg-slate-800",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={cn(
                            "text-[22px] transition-transform duration-300",
                            isActive ? "scale-110" : "group-hover:scale-110"
                          )}
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </section>

              {/* Araçlar */}
              <section>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">
                  Terminal Araçları
                </h3>
                <nav className="space-y-1.5" role="navigation" aria-label="Terminal araçları navigasyonu">
                  {tools.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3.5 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 touch-manipulation group",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] border-l-4 border-emerald-500"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 active:bg-slate-800",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={cn(
                            "text-[22px] transition-transform duration-300",
                            isActive ? "scale-110" : "group-hover:scale-110"
                          )}
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </section>
            </div>

            {/* Footer - Sistem Durumu */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 shadow-inner">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    Sistem Operasyonel
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">VERİTABANI</span>
                    <span className="text-emerald-500/80">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">AI ÇEKİRDEĞİ</span>
                    <span className="text-emerald-500/80">AKTİF</span>
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
