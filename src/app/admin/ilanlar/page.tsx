"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";

interface Listing {
  id: string;
  title: string;
  slug: string;
  type: "sanayi" | "tarim" | "konut" | "ticari";
  status: "active" | "sold" | "pending" | "draft";
  transactionType: "sale" | "rent";
  area: number;
  price: string;
  thumbnail: string | null;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const typeLabels: Record<string, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
  arsa: "Arsa",
};

const typeColors: Record<string, string> = {
  sanayi: "bg-blue-500",
  tarim: "bg-emerald-500",
  konut: "bg-orange-500",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

const statusLabels: Record<string, string> = {
  active: "Aktif",
  pending: "Beklemede",
  sold: "Satıldı",
  draft: "Taslak",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  sold: "bg-red-500/10 text-red-400 border-red-500/20",
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function AdminIlanlarPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "10");
      if (filters.type) params.set("type", filters.type);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      // Admin için tüm durumları göster
      if (!filters.status) {
        params.delete("status");
      }

      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();

      if (data.data) {
        setListings(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("İlanlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [currentPage, filters.type, filters.status]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchListings();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinizden emin misiniz?")) return;

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchListings();
      } else {
        alert("İlan silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("İlan silinirken hata oluştu");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchListings();
      } else {
        alert("Durum güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            İlan Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {pagination ? `Toplam ${pagination.total} ilan` : "Yükleniyor..."}
          </p>
        </div>
        <Link
          href="/admin/ilanlar/yeni"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Icon name="add" />
          Yeni İlan
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters((f) => ({ ...f, type: e.target.value }));
            setCurrentPage(1);
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Tüm Tipler</option>
          <option value="sanayi">Sanayi</option>
          <option value="tarim">Tarım</option>
          <option value="konut">Konut</option>
          <option value="ticari">Ticari</option>
          <option value="arsa">Arsa</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters((f) => ({ ...f, status: e.target.value }));
            setCurrentPage(1);
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="pending">Beklemede</option>
          <option value="sold">Satıldı</option>
          <option value="draft">Taslak</option>
        </select>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="İlan ara..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon
              name="sync"
              className="text-emerald-400 text-3xl animate-spin"
            />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="inventory_2" className="text-slate-600 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              İlan Bulunamadı
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {filters.search || filters.type || filters.status
                ? "Arama kriterlerinize uygun ilan bulunamadı."
                : "Henüz ilan eklenmemiş."}
            </p>
            <Link
              href="/admin/ilanlar/yeni"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-bold transition-colors"
            >
              <Icon name="add" />
              İlk İlanı Ekle
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      İlan
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Öne Çıkan
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                            {listing.thumbnail || listing.images?.[0] ? (
                              <Image
                                src={listing.thumbnail || listing.images[0]}
                                alt={listing.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="image" className="text-slate-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {listing.title}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {listing.area.toLocaleString("tr-TR")}m²
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${
                            typeColors[listing.type]
                          }`}
                        >
                          {typeLabels[listing.type]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={listing.status}
                          onChange={(e) =>
                            handleStatusChange(listing.id, e.target.value)
                          }
                          className={`px-2 py-1 rounded text-xs font-medium border bg-transparent cursor-pointer ${
                            statusColors[listing.status]
                          }`}
                        >
                          <option
                            value="draft"
                            className="bg-slate-800 text-white"
                          >
                            Taslak
                          </option>
                          <option
                            value="pending"
                            className="bg-slate-800 text-white"
                          >
                            Beklemede
                          </option>
                          <option
                            value="active"
                            className="bg-slate-800 text-white"
                          >
                            Aktif
                          </option>
                          <option
                            value="sold"
                            className="bg-slate-800 text-white"
                          >
                            Satıldı
                          </option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-white font-mono text-sm">
                          ₺{(parseFloat(listing.price) / 1000000).toFixed(1)}M
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {listing.isFeatured ? (
                          <Icon name="star" className="text-amber-400" filled />
                        ) : (
                          <Icon name="star_border" className="text-slate-600" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/ilanlar/${listing.id}`}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Icon name="edit" className="text-lg" />
                          </Link>
                          <Link
                            href={`/ilanlar/${listing.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                            title="Görüntüle"
                          >
                            <Icon name="open_in_new" className="text-lg" />
                          </Link>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                            title="Sil"
                          >
                            <Icon name="delete" className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  {(currentPage - 1) * pagination.limit + 1}-
                  {Math.min(currentPage * pagination.limit, pagination.total)} /{" "}
                  {pagination.total} ilan
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Önceki
                  </button>
                  <span className="px-3 py-1 text-slate-400 text-sm">
                    {currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
