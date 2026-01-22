"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

interface Listing {
  id: string;
  title: string;
  type: string;
  price: string;
  slug: string;
}

interface TickerStats {
  totalListings: number;
  monthlySales: number;
  avgPrice: string;
}

const typeLabels: Record<string, string> = {
  sanayi: "SANAYİ",
  tarim: "TARIM",
  konut: "KONUT",
  ticari: "TİCARİ",
};

const typeColors: Record<string, string> = {
  sanayi: "text-blue-400",
  tarim: "text-green-400",
  konut: "text-amber-400",
  ticari: "text-purple-400",
};

export function MarketTicker() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<TickerStats>({
    totalListings: 0,
    monthlySales: 0,
    avgPrice: "₺0",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/listings?limit=10&status=active");
        if (response.ok) {
          const { data, pagination } = await response.json();

          if (data && data.length > 0) {
            setListings(data);

            setStats({
              totalListings: pagination?.total || data.length,
              monthlySales: Math.floor(Math.random() * 20) + 10, // Bu gerçek veriden gelmeli
              avgPrice: "0", // Artık kullanılmıyor
            });
          }
        }
      } catch (error) {
        console.error("Ticker verileri yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--demir-charcoal)] text-white py-2.5 overflow-hidden">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-pulse" />
          <span className="text-xs text-gray-400">Veriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  // İlan yoksa basit istatistik göster
  if (listings.length === 0) {
    return (
      <div className="w-full bg-[var(--demir-charcoal)] text-white py-2.5 overflow-hidden">
        <div className="flex items-center justify-center gap-8">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-gray-400">
              CANLI VERİ
            </span>
          </span>
          <span className="text-sm text-gray-400">
            Henüz aktif ilan bulunmuyor
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--demir-charcoal)] text-white py-2.5 overflow-hidden relative">
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {[0, 1].map((group) => (
          <div key={group} className="flex items-center gap-6 px-4">
            {/* Canlı Veri Badge */}
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-400">
                CANLI VERİ
              </span>
            </span>

            {/* İstatistikler */}
            <span className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Aktif İlan</span>
              <span className="text-white font-bold">
                {stats.totalListings}
              </span>
            </span>
            <span className="text-gray-600">•</span>

            {/* İlanlar */}
            {listings.map((listing, idx) => (
              <span key={listing.id} className="flex items-center gap-2">
                <Link
                  href={`/ilanlar/${listing.slug}`}
                  className="flex items-center gap-2 text-sm hover:text-[var(--terracotta)] transition-colors group"
                >
                  <span
                    className={`${
                      typeColors[listing.type] || "text-gray-400"
                    } font-bold text-xs`}
                  >
                    {typeLabels[listing.type] || listing.type?.toUpperCase()}
                  </span>
                  <span className="text-white group-hover:text-[var(--terracotta)] font-medium truncate max-w-[200px]">
                    {listing.title}
                  </span>
                  <span className="text-[var(--hazelnut)] font-bold">
                    {formatPrice(listing.price)}
                  </span>
                </Link>
                {idx < listings.length - 1 && (
                  <span className="text-gray-600 ml-2">•</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
