"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ListingAnalyticsSummary {
  totalViews: number;
  totalUniqueVisitors: number;
  totalPhoneClicks: number;
  totalWhatsappClicks: number;
  topListings: Array<{
    id: string;
    title: string;
    views: number;
    phoneClicks: number;
  }>;
}

export function ListingAnalyticsWidget() {
  const [data, setData] = useState<ListingAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/listing-analytics/summary");
      const result = await res.json();
      if (result) setData(result);
    } catch {
      // Sessizce başarısız ol
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="insights" className="text-orange-400" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">
            İlan Performansı
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Icon name="sync" className="text-2xl text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.totalViews === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="insights" className="text-orange-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              İlan Performansı
            </h3>
          </div>
          <Link
            href="/admin/ilan-analitik"
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Detaylar →
          </Link>
        </div>
        <div className="text-center py-6">
          <Icon
            name="hourglass_empty"
            className="text-4xl text-slate-600 mb-2"
          />
          <p className="text-slate-500 text-sm">Henüz veri toplanmadı</p>
          <p className="text-slate-600 text-xs mt-1">
            İlan sayfaları ziyaret edildiğinde veriler burada görünecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden bg-zinc-950 border border-orange-500/20 rounded-2xl p-6 transition-all duration-500 hover:border-orange-500/40 shadow-lg shadow-orange-500/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <Icon name="insights" className="text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-mono">
                İLAN PERFORMANSI
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="size-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                <span className="text-[10px] text-orange-500/70 font-mono tracking-widest uppercase">
                  AKTİF TAKİP SİSTEMİ
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/ilan-analitik"
            className="p-2 hover:bg-orange-500/10 rounded-xl text-orange-400 transition-all active:scale-90"
          >
            <Icon name="open_in_new" />
          </Link>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "GÖRÜNTÜLEME", value: data.totalViews, icon: "visibility", color: "blue" },
            { label: "TEKİL ZİYARET", value: data.totalUniqueVisitors, icon: "group", color: "emerald" },
            { label: "TEL. TIKLAMA", value: data.totalPhoneClicks, icon: "phone", color: "green" },
            { label: "WA. TIKLAMA", value: data.totalWhatsappClicks, icon: "chat", color: "green" }
          ].map((stat, i) => (
            <div key={i} className="relative group/stat p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 opacity-60 group-hover/stat:opacity-100 transition-opacity">
                <Icon name={stat.icon} className={cn("text-xs", 
                  stat.color === "blue" ? "text-blue-400" :
                  stat.color === "emerald" ? "text-emerald-400" :
                  "text-green-400"
                )} />
                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-mono font-bold text-white tracking-tighter group-hover/stat:text-orange-400 transition-colors">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Top Listings */}
        {data.topListings.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
              <span className="size-1 rounded-full bg-yellow-500" />
              EN ÇOK ETKİLEŞİM ALAN İLANLAR
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.topListings.slice(0, 3).map((listing, i) => (
                <div
                  key={listing.id}
                  className="group/item flex flex-col p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-orange-500/5 hover:border-orange-500/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono text-zinc-600">RANK {i+1}</span>
                    <span className="text-[10px] font-bold text-orange-500/70 uppercase font-mono tracking-tighter">
                      ACTIVE_ID: {listing.id.substring(0, 6)}
                    </span>
                  </div>
                  <h5 className="text-xs text-zinc-200 font-bold line-clamp-2 mb-4 min-h-[2rem] leading-relaxed group-hover/item:text-white transition-colors">
                    {listing.title.toUpperCase()}
                  </h5>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Icon name="visibility" className="text-[10px] text-blue-400" />
                        <span className="text-[10px] font-mono font-bold text-blue-400">{listing.views}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="phone" className="text-[10px] text-green-400" />
                        <span className="text-[10px] font-mono font-bold text-green-400">{listing.phoneClicks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
