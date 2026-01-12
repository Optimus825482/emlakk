"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

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

interface AnalyticsData {
  overview: AnalyticsOverview;
  pages: PageViewData[];
  sources: TrafficSource[];
  realtime: number;
}

export function AnalyticsWidget() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/analytics?type=all&days=7&limit=5");
      const result = await res.json();
      if (result.data) setData(result.data);
    } catch {
      // Sessizce başarısız ol
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="analytics" className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              Analitik
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Icon name="sync" className="text-3xl text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="analytics" className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              Analitik
            </h3>
          </div>
          <Link
            href="/admin/analitik"
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Detaylar →
          </Link>
        </div>
        <p className="text-slate-500 text-sm text-center py-8">
          Analytics yapılandırılmamış
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="analytics" className="text-emerald-400" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">
            Analitik
          </h3>
          {data.realtime > 0 && (
            <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {data.realtime} aktif
            </span>
          )}
        </div>
        <Link
          href="/admin/analitik"
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          Detaylar →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="group" className="text-blue-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Ziyaretçi
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.overview.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="pageview" className="text-orange-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Görüntüleme
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.overview.pageViews.toLocaleString()}
          </p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="timer" className="text-yellow-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Ort. Süre
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {formatDuration(data.overview.avgSessionDuration)}
          </p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="exit_to_app" className="text-red-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Hemen Çıkış
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.overview.bounceRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Pages */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <Icon name="article" className="text-purple-400 text-sm" />
            Popüler Sayfalar
          </h4>
          <div className="space-y-1.5">
            {data.pages.slice(0, 5).map((page, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-slate-700/30"
              >
                <span className="text-xs text-slate-300 truncate max-w-[150px]">
                  {page.pagePath === "/" ? "Ana Sayfa" : page.pagePath}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {page.views}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <Icon name="language" className="text-blue-400 text-sm" />
            Trafik Kaynakları
          </h4>
          <div className="space-y-1.5">
            {data.sources.slice(0, 5).map((source, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-slate-700/30"
              >
                <span className="text-xs text-slate-300 truncate max-w-[150px]">
                  {source.source === "(direct)" ? "Direkt" : source.source}
                </span>
                <span className="text-xs font-mono text-blue-400">
                  {source.sessions}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
