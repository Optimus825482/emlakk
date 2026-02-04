"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface AnalyticsOverview {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface PageViewData {
  pagePath: string;
  pageTitle: string;
  views: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

interface DailyData {
  date: string;
  users: number;
  sessions: number;
  pageViews: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  pages: PageViewData[];
  sources: TrafficSource[];
  trend: DailyData[];
  realtime: number;
}

export default function AdminAnalitikPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    fetchAnalytics();
    // Tüm veriler için her 60 saniyede otomatik yenile
    const analyticsInterval = setInterval(fetchAnalytics, 60000);
    // Realtime için her 30 saniyede güncelle
    const realtimeInterval = setInterval(fetchRealtime, 30000);
    return () => {
      clearInterval(analyticsInterval);
      clearInterval(realtimeInterval);
    };
  }, [dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      // Eğer 60 dakika veya 24 saat seçiliyse, days parametresini float olarak gönder
      const daysParam = dateRange < 1 ? dateRange.toFixed(2) : dateRange;
      const response = await fetch(`/api/analytics?type=all&days=${daysParam}`);
      const result = await response.json();

      if (!result.configured) {
        setConfigured(false);
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRealtime() {
    try {
      const response = await fetch("/api/analytics?type=realtime");
      const result = await response.json();
      if (result.data !== undefined && data) {
        setData({ ...data, realtime: result.data });
      }
    } catch {
      // Sessizce başarısız ol
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(dateStr: string): string {
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${day}.${month}`;
  }

  // GA yapılandırılmamışsa
  if (!configured) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Analitik
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Web sitesi performans ve ziyaretçi verileri
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <Icon name="analytics" className="text-5xl text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Google Analytics Yapılandırılmamış
          </h3>
          <p className="text-slate-400 mb-4">
            Analitik verilerini görmek için .env dosyasına GA credentials
            ekleyin.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Analitik
          </h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <Icon name="error" className="text-4xl text-red-400 mb-3" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Analitik
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Google Analytics verileri • Son{" "}
            {dateRange < 1
              ? dateRange === 0.04
                ? "60 dakika"
                : "24 saat"
              : `${dateRange} gün`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            aria-label="Tarih aralığı seçin"
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value={0.04}>Son 60 Dakika</option>
            <option value={1}>Son 24 Saat</option>
            <option value={7}>Son 7 gün</option>
            <option value={14}>Son 14 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
          >
            <Icon name="refresh" />
            Yenile
          </button>
        </div>
      </div>

      {/* Realtime Badge */}
      {data && data.realtime > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">
            {data.realtime} aktif kullanıcı şu anda sitede
          </span>
        </div>
      )}

      {/* Overview Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="group" className="text-blue-400" />
              <span className="text-xs text-slate-500 uppercase">
                Kullanıcı
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.overview.totalUsers.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="person_add" className="text-emerald-400" />
              <span className="text-xs text-slate-500 uppercase">Yeni</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.overview.newUsers.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="login" className="text-purple-400" />
              <span className="text-xs text-slate-500 uppercase">Oturum</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.overview.sessions.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="pageview" className="text-orange-400" />
              <span className="text-xs text-slate-500 uppercase">
                Görüntüleme
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.overview.pageViews.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="timer" className="text-yellow-400" />
              <span className="text-xs text-slate-500 uppercase">
                Ort. Süre
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatDuration(data.overview.avgSessionDuration)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="exit_to_app" className="text-red-400" />
              <span className="text-xs text-slate-500 uppercase">
                Hemen Çıkış
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.overview.bounceRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="trending_up" className="text-emerald-400" />
              Günlük Trend
            </h3>
            <div className="h-48 flex items-end gap-1">
              {data.trend.slice(-14).map((day, i) => {
                const maxUsers = Math.max(...data.trend.map((d) => d.users));
                const height = maxUsers > 0 ? (day.users / maxUsers) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-emerald-500/80 rounded-t transition-all hover:bg-emerald-400"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${formatDate(day.date)}: ${day.users} kullanıcı`}
                    />
                    <span className="text-[10px] text-slate-500">
                      {formatDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="language" className="text-blue-400" />
              Trafik Kaynakları
            </h3>
            <div className="space-y-3">
              {data.sources.slice(0, 5).map((source, i) => {
                const maxSessions = data.sources[0]?.sessions || 1;
                const width = (source.sessions / maxSessions) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">
                        {source.source} / {source.medium}
                      </span>
                      <span className="text-slate-500">{source.sessions}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Pages */}
      {data && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Icon name="article" className="text-purple-400" />
              En Çok Görüntülenen Sayfalar
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-3">
                    Sayfa
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase px-6 py-3">
                    Görüntüleme
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.pages.slice(0, 10).map((page, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="px-6 py-3">
                      <p className="text-sm text-white truncate max-w-md">
                        {page.pageTitle || page.pagePath}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {page.pagePath}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-mono text-emerald-400">
                        {page.views.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* External Links */}
      <div className="flex flex-wrap gap-3 justify-center">
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Icon name="open_in_new" />
          Google Analytics
        </a>
      </div>
    </div>
  );
}
