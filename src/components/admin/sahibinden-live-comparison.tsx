"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface ComparisonData {
  database: number;
  sahibinden: number;
  diff: number;
  status: "new" | "removed" | "synced";
  last_checked_at: string;
}

interface RecentListing {
  id: string;
  title: string;
  price?: number;
  area?: number;
  category: string;
  first_seen_at?: string;
  removed_at?: string;
  sahibinden_url?: string;
}

interface LiveComparisonResponse {
  success: boolean;
  comparison: Record<string, ComparisonData>;
  summary: {
    total_new: number;
    total_removed: number;
  };
  recentNew?: RecentListing[];
  recentRemoved?: RecentListing[];
  timestamp: string;
  error?: string;
  hint?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  konut: "Konut Satılık",
  konut_kiralik: "Konut Kiralık",
  isyeri: "İşyeri Satılık",
  isyeri_kiralik: "İşyeri Kiralık",
  arsa: "Arsa",
  bina: "Bina",
};

const CATEGORY_ICONS: Record<string, string> = {
  konut: "home",
  konut_kiralik: "key",
  isyeri: "store",
  isyeri_kiralik: "storefront",
  arsa: "landscape",
  bina: "domain",
};

export function SahibindenLiveComparison() {
  const [data, setData] = useState<LiveComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "removed">("new");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Sayfa yüklendiğinde otomatik fetch
  useEffect(() => {
    fetchComparison();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchComparison, 60000); // Her 1 dakikada
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchComparison() {
    setLoading(true);
    setError(null);
    setHint(null);

    try {
      const res = await fetch("/api/crawler/live-comparison");
      const json = await res.json();

      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Veri alınamadı");
        setHint(json.hint || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price?: number): string {
    if (!price) return "-";
    if (price >= 1000000) {
      return `₺${(price / 1000000).toFixed(1)}M`;
    }
    return `₺${price.toLocaleString("tr-TR")}`;
  }

  function formatArea(area?: number): string {
    if (!area) return "-";
    return `${area.toLocaleString("tr-TR")}m²`;
  }

  function timeAgo(dateStr?: string): string {
    if (!dateStr) return "-";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    return "Az önce";
  }

  const totalNew = data?.summary?.total_new || 0;
  const totalRemoved = data?.summary?.total_removed || 0;
  const hasChanges = totalNew > 0 || totalRemoved > 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
      {/* Header - Prominent */}
      <div className="relative overflow-hidden">
        {/* Background Effect */}
        {hasChanges && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-red-500/10" />
        )}

        <div className="relative p-5 border-b border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Icon name="sync_alt" className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Sahibinden.com Takip
                    {autoRefresh && (
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {data?.timestamp
                      ? `Son güncelleme: ${new Date(
                          data.timestamp,
                        ).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Veri bekleniyor..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  autoRefresh
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-700 text-slate-400 hover:text-white",
                )}
              >
                <Icon
                  name={autoRefresh ? "timer" : "timer_off"}
                  className="text-lg"
                />
                {autoRefresh ? "Otomatik: ON" : "Otomatik"}
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchComparison}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all",
                  loading
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                )}
              >
                <Icon
                  name="refresh"
                  className={cn(loading && "animate-spin")}
                />
                {loading ? "Kontrol Ediliyor..." : "Şimdi Kontrol Et"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 m-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Icon name="error" className="text-red-400 text-xl mt-0.5" />
            <div>
              <p className="font-bold text-red-400">{error}</p>
              {hint && <p className="text-red-300 text-sm mt-1">{hint}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="p-12 text-center">
          <Icon
            name="sync"
            className="text-4xl text-emerald-400 animate-spin mb-3"
          />
          <p className="text-slate-400">Sahibinden.com kontrol ediliyor...</p>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="p-5 space-y-6">
          {/* Summary Cards - Big & Prominent */}
          <div className="grid grid-cols-2 gap-4">
            {/* New Listings Card */}
            <button
              onClick={() => setActiveTab("new")}
              className={cn(
                "relative overflow-hidden rounded-xl p-5 text-left transition-all",
                activeTab === "new"
                  ? "bg-emerald-500/20 border-2 border-emerald-500/50 ring-2 ring-emerald-500/20"
                  : "bg-slate-700/50 border-2 border-transparent hover:border-emerald-500/30",
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    name="add_circle"
                    className="text-emerald-400 text-xl"
                  />
                  <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">
                    Yeni İlanlar
                  </span>
                </div>
                <p className="text-4xl font-mono font-black text-white">
                  +{totalNew.toLocaleString("tr-TR")}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Son 24 saatte eklenen
                </p>
              </div>
            </button>

            {/* Removed Listings Card */}
            <button
              onClick={() => setActiveTab("removed")}
              className={cn(
                "relative overflow-hidden rounded-xl p-5 text-left transition-all",
                activeTab === "removed"
                  ? "bg-red-500/20 border-2 border-red-500/50 ring-2 ring-red-500/20"
                  : "bg-slate-700/50 border-2 border-transparent hover:border-red-500/30",
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="remove_circle" className="text-red-400 text-xl" />
                  <span className="text-red-400 text-sm font-bold uppercase tracking-wider">
                    Kaldırılan İlanlar
                  </span>
                </div>
                <p className="text-4xl font-mono font-black text-white">
                  -{totalRemoved.toLocaleString("tr-TR")}
                </p>
                <p className="text-slate-400 text-sm mt-1">Son zamanlarda</p>
              </div>
            </button>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              Kategori Bazlı Değişimler
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(data.comparison)
                .sort(([, a], [, b]) => Math.abs(b.diff) - Math.abs(a.diff))
                .map(([category, info]) => (
                  <div
                    key={category}
                    className={cn(
                      "rounded-lg p-3 border transition-colors",
                      info.diff > 0
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : info.diff < 0
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-slate-600/30 border-slate-600",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        name={CATEGORY_ICONS[category] || "category"}
                        className={cn(
                          "text-lg",
                          info.diff > 0
                            ? "text-emerald-400"
                            : info.diff < 0
                              ? "text-red-400"
                              : "text-slate-400",
                        )}
                      />
                      <span className="text-xs text-slate-300 font-medium truncate">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xl font-mono font-bold",
                        info.diff > 0
                          ? "text-emerald-400"
                          : info.diff < 0
                            ? "text-red-400"
                            : "text-slate-400",
                      )}
                    >
                      {info.diff > 0 && "+"}
                      {info.diff}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {info.sahibinden} toplam
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Listings List */}
          {(activeTab === "new" &&
            data.recentNew &&
            data.recentNew.length > 0) ||
          (activeTab === "removed" &&
            data.recentRemoved &&
            data.recentRemoved.length > 0) ? (
            <div className="bg-slate-700/30 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-600 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Icon
                    name={activeTab === "new" ? "fiber_new" : "delete_sweep"}
                    className={
                      activeTab === "new" ? "text-emerald-400" : "text-red-400"
                    }
                  />
                  {activeTab === "new"
                    ? "Son Eklenen İlanlar"
                    : "Son Kaldırılan İlanlar"}
                </h4>
                <Link
                  href={
                    activeTab === "new"
                      ? "/admin/sahibinden-inceleme?tab=new"
                      : "/admin/sahibinden-inceleme?tab=removed"
                  }
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Tümünü Gör →
                </Link>
              </div>
              <div className="divide-y divide-slate-600/50">
                {(activeTab === "new"
                  ? data.recentNew || []
                  : data.recentRemoved || []
                )
                  .slice(0, 5)
                  .map((listing, i) => (
                    <div
                      key={listing.id || i}
                      className="p-4 hover:bg-slate-600/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {listing.title || "İlan"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">
                              {CATEGORY_LABELS[listing.category] ||
                                listing.category}
                            </span>
                            {listing.area && (
                              <span className="text-xs text-slate-500">
                                {formatArea(listing.area)}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {timeAgo(
                                activeTab === "new"
                                  ? listing.first_seen_at
                                  : listing.removed_at,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={cn(
                              "font-mono font-bold text-sm",
                              activeTab === "new"
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {formatPrice(listing.price)}
                          </p>
                          {listing.sahibinden_url && (
                            <a
                              href={listing.sahibinden_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300"
                            >
                              Sahibinden →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-700/30 rounded-xl p-8 text-center">
              <Icon
                name={activeTab === "new" ? "inbox" : "delete_outline"}
                className="text-4xl text-slate-600 mb-2"
              />
              <p className="text-slate-500">
                {activeTab === "new"
                  ? "Son eklenen ilan detayı yok"
                  : "Son kaldırılan ilan detayı yok"}
              </p>
              <Link
                href="/admin/sahibinden-inceleme"
                className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Icon name="open_in_new" />
                Sahibinden İnceleme Sayfası
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/sahibinden-inceleme"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name="search" />
              Detaylı İnceleme
            </Link>
            <Link
              href="/admin/sahibinden-inceleme?tab=new"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
            >
              <Icon name="add_business" />
              Yeni İlanları İncele
            </Link>
            <Link
              href="/admin/sahibinden-inceleme?tab=removed"
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
            >
              <Icon name="delete_sweep" />
              Kaldırılanları İncele
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
