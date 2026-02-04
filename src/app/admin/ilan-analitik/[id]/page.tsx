"use client";

import { useState, useEffect, use } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface ListingInfo {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface DailyStat {
  date: string;
  views: number;
  phoneClicks: number;
  whatsappClicks: number;
}

interface AnalyticsData {
  listing: ListingInfo;
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
  dailyStats: DailyStat[];
}

export default function IlanAnalitikDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [id, days]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/listing-analytics/detail?listingId=${id}&days=${days}`
      );
      const result = await res.json();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
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

  if (!data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ilan-analitik"
          className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
        >
          <Icon name="arrow_back" /> Geri Dön
        </Link>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Icon name="error" className="text-5xl text-red-400 mb-4" />
          <p className="text-slate-400">İlan bulunamadı veya veri yok</p>
        </div>
      </div>
    );
  }

  const { listing, totals, dailyStats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/ilan-analitik"
            className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1 mb-2"
          >
            <Icon name="arrow_back" /> Tüm İlanlar
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {listing.title}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded ${listing.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-600/50 text-slate-400"
                }`}
            >
              {listing.status === "active" ? "Aktif" : "Pasif"}
            </span>
            <Link
              href={`/ilanlar/${listing.slug}`}
              target="_blank"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Icon name="open_in_new" className="text-sm" /> İlanı Görüntüle
            </Link>
          </div>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          aria-label="Tarih aralığı seçin"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          <option value={7}>Son 7 gün</option>
          <option value={14}>Son 14 gün</option>
          <option value={30}>Son 30 gün</option>
          <option value={90}>Son 90 gün</option>
        </select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          icon="visibility"
          label="Görüntüleme"
          value={totals.views}
          color="blue"
        />
        <StatCard
          icon="group"
          label="Tekil Ziyaretçi"
          value={totals.uniqueVisitors}
          color="emerald"
        />
        <StatCard
          icon="phone"
          label="Telefon"
          value={totals.phoneClicks}
          color="green"
        />
        <StatCard
          icon="chat"
          label="WhatsApp"
          value={totals.whatsappClicks}
          color="green"
        />
        <StatCard
          icon="timer"
          label="Ort. Süre"
          value={formatDuration(totals.avgDuration)}
          color="yellow"
        />
        <StatCard
          icon="trending_up"
          label="Dönüşüm"
          value={`${totals.conversionRate}%`}
          color="purple"
        />
      </div>

      {/* Two Column Layout */}
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
              value={totals.mobileViews}
              total={totals.views}
              color="emerald"
            />
            <DeviceBar
              label="Masaüstü"
              value={totals.desktopViews}
              total={totals.views}
              color="blue"
            />
            <DeviceBar
              label="Tablet"
              value={totals.tabletViews}
              total={totals.views}
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
              value={totals.phoneClicks}
            />
            <ActionStat
              icon="chat"
              label="WhatsApp"
              value={totals.whatsappClicks}
            />
            <ActionStat
              icon="email"
              label="E-posta"
              value={totals.emailClicks}
            />
            <ActionStat icon="map" label="Harita" value={totals.mapClicks} />
            <ActionStat
              icon="photo_library"
              label="Galeri"
              value={totals.galleryClicks}
            />
            <ActionStat
              icon="share"
              label="Paylaşım"
              value={totals.shareClicks}
            />
            <ActionStat
              icon="favorite"
              label="Favori"
              value={totals.favoriteAdds}
            />
            <ActionStat
              icon="event"
              label="Randevu"
              value={totals.appointmentRequests}
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
              {formatDuration(totals.avgDuration)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Ortalama Süre</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-3xl font-mono text-white">
              {totals.avgScrollDepth}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Scroll Derinliği</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-3xl font-mono text-emerald-400">
              {totals.conversionRate}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Dönüşüm Oranı</p>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <p className="text-3xl font-mono text-white">
              {totals.views > 0
                ? ((totals.uniqueVisitors / totals.views) * 100).toFixed(0)
                : 0}
              %
            </p>
            <p className="text-xs text-slate-400 mt-1">Tekil Oran</p>
          </div>
        </div>
      </div>

      {/* Daily Chart (Simple) */}
      {dailyStats.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="show_chart" className="text-blue-400" />
            Günlük Görüntüleme
          </h3>
          <div className="flex items-end gap-1 h-32">
            {dailyStats.slice(-14).map((day, i) => {
              const maxViews = Math.max(...dailyStats.map((d) => d.views), 1);
              const height = (day.views / maxViews) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-emerald-500/80 rounded-t transition-all hover:bg-emerald-400"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.views} görüntüleme`}
                  />
                  <span className="text-[8px] text-slate-500 rotate-45 origin-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
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
