"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <div className="group relative overflow-hidden bg-zinc-950 border border-emerald-500/20 rounded-2xl p-6 transition-all duration-500 hover:border-emerald-500/40 shadow-lg shadow-emerald-500/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Icon name="analytics" className="text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-mono">
                SİTE ANALİTİK
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] text-emerald-500/70 font-mono tracking-widest uppercase">
                  CANLI VERİ AKIŞI
                </span>
                {data.realtime > 0 && (
                  <span className="text-[10px] text-white bg-emerald-500 px-1.5 py-0.5 rounded font-bold font-mono">
                    {data.realtime} AKTİF
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/admin/analitik"
            className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-400 transition-all active:scale-90"
          >
            <Icon name="open_in_new" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "ZİYARETÇİ",
              value: data.overview?.totalUsers?.toLocaleString() ?? "0",
              icon: "group",
              color: "blue",
            },
            {
              label: "GÖRÜNTÜLEME",
              value: data.overview?.pageViews?.toLocaleString() ?? "0",
              icon: "pageview",
              color: "orange",
            },
            {
              label: "ORT. SÜRE",
              value: formatDuration(data.overview?.avgSessionDuration ?? 0),
              icon: "timer",
              color: "yellow",
            },
            {
              label: "HEMEN ÇIKIŞ",
              value: `${(data.overview?.bounceRate ?? 0).toFixed(1)}%`,
              icon: "exit_to_app",
              color: "red",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative group/stat p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                <Icon
                  name={stat.icon}
                  className={cn(
                    "text-xs",
                    stat.color === "blue"
                      ? "text-blue-400"
                      : stat.color === "orange"
                        ? "text-orange-400"
                        : stat.color === "yellow"
                          ? "text-yellow-400"
                          : "text-red-400",
                  )}
                />
                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-mono font-bold text-white tracking-tighter group-hover/stat:text-emerald-400 transition-colors">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
              <span className="size-1 rounded-full bg-purple-500" />
              POPÜLER SAYFALAR
            </h4>
            <div className="space-y-2">
              {data.pages.slice(0, 5).map((page, i) => (
                <div
                  key={i}
                  className="group/item flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-zinc-600">
                      0{i + 1}
                    </span>
                    <span className="text-xs text-zinc-300 truncate font-medium">
                      {page.pagePath === "/"
                        ? "ANA SAYFA"
                        : page.pagePath.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 ml-4">
                    {page.views}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
              <span className="size-1 rounded-full bg-blue-500" />
              TRAFİK KAYNAKLARI
            </h4>
            <div className="space-y-2">
              {data.sources.slice(0, 5).map((source, i) => (
                <div
                  key={i}
                  className="group/item flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-zinc-600">
                      0{i + 1}
                    </span>
                    <span className="text-xs text-zinc-300 truncate font-medium">
                      {source.source === "(direct)"
                        ? "DİREKT ERİŞİM"
                        : source.source.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 ml-4">
                    {source.sessions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
