"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">
      Harita Yükleniyor...
    </div>
  ),
  ssr: false,
});

interface Listing {
  id: number;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  thumbnail?: string;
  location: string;
  type: string;
  category?: string;
}

export default function RealEstateMapPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all"); // all, satilik, kiralik
  const [filterCategory, setFilterCategory] = useState<string>("all"); // all, konut, arsa...

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      const res = await fetch("/api/listings/map");
      const data = await res.json();
      if (Array.isArray(data)) {
        setListings(data);
      } else {
        setListings([]);
        console.error("Map listings response is not an array:", data);
      }
    } catch (error) {
      console.error("Failed to load map listings", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredListings = listings.filter((item) => {
    // Normalization helper
    const normalize = (str: string) =>
      str
        ?.toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ş/g, "s")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c") || "";

    if (filterType !== "all") {
      const itemType = normalize(item.type);
      const currentFilter = normalize(filterType);
      if (itemType !== currentFilter) return false;
    }

    if (filterCategory !== "all") {
      const itemCat = normalize(item.category || "");
      const currentFilter = normalize(filterCategory);

      // Handle "isyeri" vs "işyeri" specifically if needed, but normalize should cover it
      if (!itemCat.includes(currentFilter) && !currentFilter.includes(itemCat))
        return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Header & Filters */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Icon name="map" className="text-indigo-500 text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Hendek Emlak Haritası
            </h1>
            <p className="text-xs text-slate-500">
              Toplam {filteredListings.length} ilan görüntüleniyor
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Transaction Type Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {[
              { id: "all", label: "Tümü" },
              { id: "satilik", label: "Satılık" },
              { id: "kiralik", label: "Kiralık" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === type.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>

          {/* Category Filters with Color Indicators */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Hepsi", color: "bg-slate-500" },
              { id: "konut", label: "Konut", color: "bg-blue-500" },
              { id: "isyeri", label: "İşyeri", color: "bg-orange-500" }, // Orange default
              { id: "arsa", label: "Arsa", color: "bg-green-500" },
              { id: "bina", label: "Bina", color: "bg-slate-800" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterCategory === cat.id
                    ? "bg-white dark:bg-slate-800 border-indigo-500 text-indigo-600 shadow-sm ring-1 ring-indigo-500"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${cat.color} shadow-sm`}
                ></div>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        {!loading && (
          <MapComponent
            listings={filteredListings}
            center={[40.795, 30.745]}
            zoom={14}
          />
        )}
      </div>
    </div>
  );
}
