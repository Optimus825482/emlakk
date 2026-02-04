"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface ListingWithAnalytics {
  id: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  uniqueVisitors: number;
  phoneClicks: number;
  whatsappClicks: number;
  emailClicks: number;
  mapClicks: number;
  favoriteAdds: number;
  appointmentRequests: number;
  conversionRate: number;
}

export default function IlanAnalitikPage() {
  const [listings, setListings] = useState<ListingWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [sortBy, setSortBy] = useState<keyof ListingWithAnalytics>("views");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchListings();
  }, [days]);

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listing-analytics/all?days=${days}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(column: keyof ListingWithAnalytics) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  const sortedListings = [...listings].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const totalPhoneClicks = listings.reduce((sum, l) => sum + l.phoneClicks, 0);
  const totalWhatsappClicks = listings.reduce(
    (sum, l) => sum + l.whatsappClicks,
    0
  );
  const avgConversion =
    listings.length > 0
      ? (
        listings.reduce((sum, l) => sum + l.conversionRate, 0) /
        listings.length
      ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            İlan Analitikleri
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Tüm ilanların performans metrikleri
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={fetchListings}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="refresh" className="text-sm" />
            Yenile
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon="visibility"
          label="Toplam Görüntüleme"
          value={totalViews}
          color="blue"
        />
        <SummaryCard
          icon="phone"
          label="Telefon Tıklaması"
          value={totalPhoneClicks}
          color="green"
        />
        <SummaryCard
          icon="chat"
          label="WhatsApp Tıklaması"
          value={totalWhatsappClicks}
          color="emerald"
        />
        <SummaryCard
          icon="trending_up"
          label="Ort. Dönüşüm"
          value={`${avgConversion}%`}
          color="purple"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Icon
            name="sync"
            className="text-4xl text-emerald-400 animate-spin"
          />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Icon
            name="hourglass_empty"
            className="text-5xl text-slate-600 mb-4"
          />
          <p className="text-slate-400 text-lg">Henüz analitik verisi yok</p>
          <p className="text-slate-500 text-sm mt-2">
            İlan sayfaları ziyaret edildiğinde veriler burada görünecek
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <SortableHeader
                    label="İlan"
                    column="title"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-left"
                  />
                  <SortableHeader
                    label="Görüntüleme"
                    column="views"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Tekil"
                    column="uniqueVisitors"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Telefon"
                    column="phoneClicks"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="WhatsApp"
                    column="whatsappClicks"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Favori"
                    column="favoriteAdds"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Randevu"
                    column="appointmentRequests"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Dönüşüm"
                    column="conversionRate"
                    currentSort={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedListings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ilan-analitik/${listing.id}`}
                        className="text-white hover:text-emerald-400 transition-colors font-medium text-sm max-w-[250px] truncate block"
                      >
                        {listing.title}
                      </Link>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${listing.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-600/50 text-slate-400"
                          }`}
                      >
                        {listing.status === "active" ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-mono">
                        {listing.views}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-300 font-mono">
                        {listing.uniqueVisitors}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400 font-mono">
                        {listing.phoneClicks}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400 font-mono">
                        {listing.whatsappClicks}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-pink-400 font-mono">
                        {listing.favoriteAdds}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-400 font-mono">
                        {listing.appointmentRequests}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono ${listing.conversionRate > 5
                            ? "text-emerald-400"
                            : listing.conversionRate > 2
                              ? "text-yellow-400"
                              : "text-slate-400"
                          }`}
                      >
                        {listing.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/ilan-analitik/${listing.id}`}
                        className="text-emerald-400 hover:text-emerald-300 text-sm"
                      >
                        <Icon name="arrow_forward" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
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
    green: "text-green-400",
    emerald: "text-emerald-400",
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

// Sortable Header Component
function SortableHeader({
  label,
  column,
  currentSort,
  sortOrder,
  onSort,
  className = "text-center",
}: {
  label: string;
  column: keyof ListingWithAnalytics;
  currentSort: keyof ListingWithAnalytics;
  sortOrder: "asc" | "desc";
  onSort: (column: keyof ListingWithAnalytics) => void;
  className?: string;
}) {
  const isActive = currentSort === column;

  return (
    <th
      className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-slate-300 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div
        className={`flex items-center gap-1 ${className === "text-left" ? "" : "justify-center"
          }`}
      >
        {label}
        {isActive && (
          <Icon
            name={sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
            className="text-emerald-400 text-sm"
          />
        )}
      </div>
    </th>
  );
}
