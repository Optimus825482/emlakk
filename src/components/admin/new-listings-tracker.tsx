"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Clock, ExternalLink } from "lucide-react";

interface NewListing {
  id: number;
  listing_id: number;
  baslik: string;
  link: string;
  fiyat: number;
  konum: string;
  category: string;
  transaction: string;
  resim: string;
  first_seen_at: string;
  hours_since_added: number;
  tarih?: string; // İlan tarihi (Sahibinden'den: "Bugün 14:30", "15 Ocak" vb.)
}

interface CategoryStats {
  category: string;
  transaction: string;
  total_new: number;
  last_24h: number;
  last_48h: number;
  oldest_new: string;
  newest_new: string;
}

interface NewListingsData {
  listings: NewListing[];
  groupedByCategory: Record<string, NewListing[]>;
  stats: CategoryStats[];
  totalNew: number;
  last24h: number;
  last48h: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  konut: "Konut",
  arsa: "Arsa",
  isyeri: "İşyeri",
  bina: "Bina",
};

const TRANSACTION_LABELS: Record<string, string> = {
  satilik: "Satılık",
  kiralik: "Kiralık",
};

export default function NewListingsTracker() {
  const [data, setData] = useState<NewListingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewListings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crawler/new-listings");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Veri yüklenemedi");
      }
    } catch (err) {
      setError("Bağlantı hatası");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewListings();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchNewListings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 1) return "Az önce";
    if (hours < 24) return `${Math.floor(hours)} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  const getTimeBadgeColor = (hours: number) => {
    if (hours < 6) return "bg-green-500";
    if (hours < 24) return "bg-blue-500";
    return "bg-gray-500";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Yeni İlanlar (Son 2 Gün)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Yeni İlanlar (Son 2 Gün)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalNew === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Yeni İlanlar (Son 2 Gün)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Son 2 günde yeni ilan eklenmedi
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Yeni İlan</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {data.totalNew}
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Son 24 Saat</p>
                <p className="text-3xl font-bold text-green-600">
                  {data.last24h}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Son 48 Saat</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.last48h}
                </p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategori Bazlı İstatistikler */}
      {data.stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kategori Bazlı Yeni İlanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.stats.map((stat) => (
                <div
                  key={`${stat.category}_${stat.transaction}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {CATEGORY_LABELS[stat.category] || stat.category}
                    </h3>
                    <Badge variant="outline">
                      {TRANSACTION_LABELS[stat.transaction] || stat.transaction}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Toplam:</span>
                      <span className="font-semibold">{stat.total_new}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">24 saat:</span>
                      <span className="text-green-600 font-semibold">
                        {stat.last_24h}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">48 saat:</span>
                      <span className="text-blue-600 font-semibold">
                        {stat.last_48h}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yeni İlanlar Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Yeni Eklenen İlanlar
            </span>
            <button
              onClick={fetchNewListings}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Yenile
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {data.listings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Resim */}
                  {listing.resim && (
                    <div className="flex-shrink-0">
                      <img
                        src={listing.resim}
                        alt={listing.baslik}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                  )}

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {listing.baslik}
                      </h3>
                      <Badge
                        className={getTimeBadgeColor(listing.hours_since_added)}
                      >
                        {formatTimeAgo(listing.hours_since_added)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[listing.category] ||
                            listing.category}
                        </Badge>
                        <Badge variant="outline">
                          {TRANSACTION_LABELS[listing.transaction] ||
                            listing.transaction}
                        </Badge>
                      </div>

                      <p className="text-gray-600">{listing.konum}</p>

                      {/* İlan Tarihi (Sahibinden'den) */}
                      {listing.tarih && (
                        <p className="text-xs text-orange-500 font-medium">
                          🕐 İlan Tarihi: {listing.tarih}
                        </p>
                      )}

                      {/* Sisteme Eklenme Tarihi */}
                      <p className="text-xs text-gray-400">
                        📅 Sisteme Eklendi:{" "}
                        {new Date(listing.first_seen_at).toLocaleDateString(
                          "tr-TR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(listing.fiyat)}
                        </p>
                        <a
                          href={listing.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <span className="text-sm">İlanı Gör</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
