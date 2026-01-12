"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="visibility" className="text-blue-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Görüntüleme
            </span>
          </div>
          <p className="text-xl font-mono text-white">{data.totalViews}</p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="group" className="text-emerald-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">Tekil</span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.totalUniqueVisitors}
          </p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="phone" className="text-green-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              Telefon
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.totalPhoneClicks}
          </p>
        </div>

        <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="chat" className="text-green-400 text-sm" />
            <span className="text-[10px] text-slate-500 uppercase">
              WhatsApp
            </span>
          </div>
          <p className="text-xl font-mono text-white">
            {data.totalWhatsappClicks}
          </p>
        </div>
      </div>

      {/* Top Listings */}
      {data.topListings.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <Icon name="trending_up" className="text-yellow-400 text-sm" />
            En Çok Görüntülenen
          </h4>
          <div className="space-y-1.5">
            {data.topListings.slice(0, 3).map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-slate-700/30"
              >
                <span className="text-xs text-slate-300 truncate max-w-[200px]">
                  {listing.title}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                    <Icon name="visibility" className="text-[10px]" />
                    {listing.views}
                  </span>
                  <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                    <Icon name="phone" className="text-[10px]" />
                    {listing.phoneClicks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
