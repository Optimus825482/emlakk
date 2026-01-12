"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface ListingAnalytics {
  totals: {
    views: number;
    uniqueVisitors: number;
    phoneClicks: number;
    whatsappClicks: number;
    emailClicks: number;
    mapClicks: number;
    galleryClicks: number;
    shareClicks: number;
    favoriteAdds: number;
    appointmentRequests: number;
    mobileViews: number;
    desktopViews: number;
    tabletViews: number;
    avgDuration: number;
    avgScrollDepth: number;
    conversionRate: number;
  };
  dailyStats: Array<{
    date: string;
    views: number;
    phoneClicks: number;
    whatsappClicks: number;
  }>;
}

export default function IlanAnalitikPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (selectedListing) {
      fetchAnalytics(selectedListing);
    }
  }, [selectedListing, days]);

  async function fetchListings() {
    try {
      const res = await fetch("/api/listings?limit=100");
      const data = await res.json();
      setListings(data.listings || []);
      if (data.listings?.length > 0) {
        setSelectedListing(data.listings[0].id);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics(listingId: string) {
    try {
      const res = await fetch(
        `/api/listing-analytics?listingId=${listingId}&days=${days}`
      );
      const data = await res.json();
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            İlan Analitikleri
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            İlan bazlı detaylı performans verileri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value={7}>Son 7 gün</option>
            <option value={14}>Son 14 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
        </div>
      </div>

      {/* Listing Selector */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <label className="text-xs text-slate-400 uppercase mb-2 block">
          İlan Seç
        </label>
        <select
          value={selectedListing || ""}
          onChange={(e) => setSelectedListing(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
        >
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.title}
            </option>
          ))}
        </select>
      </div>

      {analytics && (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              icon="visibility"
              label="Görüntüleme"
              value={analytics.totals.views}
              color="blue"
            />
            <StatCard
              icon="group"
              label="Tekil Ziyaretçi"
              value={analytics.totals.uniqueVisitors}
              color="emerald"
            />
            <StatCard
              icon="phone"
              label="Telefon"
              value={analytics.totals.phoneClicks}
              color="green"
            />
            <StatCard
              icon="chat"
              label="WhatsApp"
              value={analytics.totals.whatsappClicks}
              color="green"
            />
            <StatCard
              icon="timer"
              label="Ort. Süre"
              value={formatDuration(analytics.totals.avgDuration)}
              color="yellow"
            />
            <StatCard
              icon="trending_up"
              label="Dönüşüm"
              value={`${analytics.totals.conversionRate}%`}
              color="purple"
            />
          </div>

          {/* Device & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Distribution */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon name="devices" className="text-blue-400" />
                Cihaz Dağılımı
              </h3>
              <div className="space-y-3">
                <DeviceBar
                  label="Mobil"
                  value={analytics.totals.mobileViews}
                  total={analytics.totals.views}
                  color="emerald"
                />
                <DeviceBar
                  label="Masaüstü"
                  value={analytics.totals.desktopViews}
                  total={analytics.totals.views}
                  color="blue"
                />
                <DeviceBar
                  label="Tablet"
                  value={analytics.totals.tabletViews}
                  total={analytics.totals.views}
                  color="purple"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon name="touch_app" className="text-orange-400" />
                Kullanıcı Aksiyonları
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ActionStat
                  icon="phone"
                  label="Telefon"
                  value={analytics.totals.phoneClicks}
                />
                <ActionStat
                  icon="chat"
                  label="WhatsApp"
                  value={analytics.totals.whatsappClicks}
                />
                <ActionStat
                  icon="email"
                  label="E-posta"
                  value={analytics.totals.emailClicks}
                />
                <ActionStat
                  icon="map"
                  label="Harita"
                  value={analytics.totals.mapClicks}
                />
                <ActionStat
                  icon="photo_library"
                  label="Galeri"
                  value={analytics.totals.galleryClicks}
                />
                <ActionStat
                  icon="share"
                  label="Paylaşım"
                  value={analytics.totals.shareClicks}
                />
                <ActionStat
                  icon="favorite"
                  label="Favori"
                  value={analytics.totals.favoriteAdds}
                />
                <ActionStat
                  icon="event"
                  label="Randevu"
                  value={analytics.totals.appointmentRequests}
                />
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="insights" className="text-emerald-400" />
              Etkileşim Metrikleri
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-3xl font-mono text-white">
                  {formatDuration(analytics.totals.avgDuration)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Ortalama Süre</p>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-3xl font-mono text-white">
                  {analytics.totals.avgScrollDepth}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Scroll Derinliği</p>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-3xl font-mono text-emerald-400">
                  {analytics.totals.conversionRate}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Dönüşüm Oranı</p>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-3xl font-mono text-white">
                  {analytics.totals.views > 0
                    ? (
                        (analytics.totals.uniqueVisitors /
                          analytics.totals.views) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
                <p className="text-xs text-slate-400 mt-1">Tekil Oran</p>
              </div>
            </div>
          </div>
        </>
      )}

      {!analytics && selectedListing && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Icon name="analytics" className="text-5xl text-slate-600 mb-4" />
          <p className="text-slate-400">
            Bu ilan için henüz analitik verisi yok
          </p>
        </div>
      )}
    </div>
  );
}

// Sub-components
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} className={`${colorClasses[color]} text-lg`} />
        <span className="text-xs text-slate-500 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-mono text-white">{value}</p>
    </div>
  );
}

function DeviceBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">
          {value} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ActionStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
      <Icon name={icon} className="text-slate-400" />
      <div>
        <p className="text-lg font-mono text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
