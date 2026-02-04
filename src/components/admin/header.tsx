"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { toast } from "sonner";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  appointment: "calendar_month",
  contact: "mail",
  valuation: "calculate",
  listing: "real_estate_agent",
  system: "settings",
};

const TYPE_COLORS: Record<string, string> = {
  appointment: "text-blue-400 bg-blue-400/10",
  contact: "text-emerald-400 bg-emerald-400/10",
  valuation: "text-amber-400 bg-amber-400/10",
  listing: "text-purple-400 bg-purple-400/10",
  system: "text-slate-400 bg-slate-400/10",
};

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error("Bildirimler yüklenemedi:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Bildirimler güncellenemedi:", error);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  }

  function getEntityLink(notification: Notification): string | null {
    if (!notification.entityType || !notification.entityId) return null;
    const routes: Record<string, string> = {
      appointment: "/admin/randevular",
      contact: "/admin/mesajlar",
      valuation: "/admin/degerlemeler",
      listing: `/admin/ilanlar/${notification.entityId}`,
    };
    return routes[notification.entityType] || null;
  }

  return (
    <header className="flex-none h-16 border-b border-slate-700 bg-slate-800 px-4 md:px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors md:hidden touch-manipulation"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="size-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Icon name="terminal" className="text-xl" />
        </div>
        <div>
          <h1 className="text-white text-sm md:text-base font-bold tracking-wider leading-none">
            DEMİR-NET{" "}
            <span className="text-emerald-400 font-mono text-[10px] md:text-xs ml-1">
              KOMUTA MERKEZİ
            </span>
          </h1>
          <p className="text-slate-400 text-[9px] md:text-[10px] tracking-widest uppercase mt-0.5 hidden sm:block">
            Güvenli Bağlantı Kuruldu • v1.0
          </p>
        </div>
      </div>

      {/* Search - Desktop */}
      <div className="flex-1 max-w-xl mx-8 hidden lg:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full rounded bg-slate-900 border border-slate-700 text-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm pl-10 py-2 placeholder-slate-500 font-mono transition-colors"
            placeholder="Ara..."
            type="text"
            role="searchbox"
            aria-label="Admin panelinde ara"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <kbd className="inline-flex items-center border border-slate-600 rounded px-2 text-xs font-mono text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Search Button */}
        <button
          className="p-2 text-slate-400 hover:text-white transition-colors lg:hidden touch-manipulation"
          aria-label="Ara"
          onClick={() => {
            // Future: Implement mobile search modal or expand bar
            toast.info("Arama sistemi yakında mobil cihazlarda da aktif olacak.");
          }}
        >
          <Icon name="search" />
        </button>
        {/* System Stats */}
        <div className="hidden lg:flex items-center gap-3 mr-4 border-r border-slate-600 pr-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Sistem
            </span>
            <span className="text-xs font-mono text-emerald-400">Aktif</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              API
            </span>
            <span className="text-xs font-mono text-emerald-400">24ms</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
            aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
            aria-expanded={showDropdown || undefined}
            aria-haspopup="menu"
          >
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <Icon name="notifications" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-white">
                  Bildirimler
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <Icon name="notifications_off" className="text-3xl mb-2" />
                    <p className="text-sm">Bildirim yok</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const link = getEntityLink(notification);
                    const Content = (
                      <div
                        className={`px-4 py-3 hover:bg-slate-700/50 transition-colors ${!notification.isRead ? "bg-slate-700/30" : ""
                          }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[notification.type] ||
                              TYPE_COLORS.system
                              }`}
                          >
                            <Icon
                              name={TYPE_ICONS[notification.type] || "info"}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    );

                    return link ? (
                      <a
                        key={notification.id}
                        href={link}
                        onClick={() => setShowDropdown(false)}
                      >
                        {Content}
                      </a>
                    ) : (
                      <div key={notification.id}>{Content}</div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 md:gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">
              {user.name || "Admin"}
            </p>
            <p className="text-[10px] text-emerald-400">Tam Yetki</p>
          </div>
          <div className="size-8 md:size-9 rounded bg-slate-600 border border-slate-500 flex items-center justify-center">
            <Icon name="person" className="text-slate-300 text-lg md:text-xl" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/giris" })}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors touch-manipulation"
            title="Çıkış Yap"
            aria-label="Oturumu kapat"
          >
            <Icon name="logout" className="text-lg md:text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}
