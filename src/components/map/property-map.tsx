"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MapControls from "./map-controls";
import { MapPin, Loader2 } from "lucide-react";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-pulse flex items-center justify-center rounded-3xl">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="font-outfit font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">
          Harita Yükleniyor
        </p>
      </div>
    </div>
  ),
});

export interface PropertyListing {
  id: number;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  thumbnail: string | null;
  location: string;
  type: string;
  category: string;
  slug: string;
  isExact: boolean;
}

export type MapType =
  | "roadmap"
  | "satellite"
  | "hybrid"
  | "terrain"
  | "topo"
  | "dark"
  | "darkMatter"
  | "light"
  | "positron"
  | "watercolor"
  | "toner"
  | "transport"
  | "cycle"
  | "humanitarian"
  | "wikimedia";

export interface MapSettings {
  mapType: MapType;
  showClusters: boolean;
  showTraffic: boolean;
  showLabels: boolean;
}

const DEFAULT_SETTINGS: MapSettings = {
  mapType: "roadmap",
  showClusters: true,
  showTraffic: false,
  showLabels: true,
};

export default function PropertyMap() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [settings, setSettings] = useState<MapSettings>(() => {
    // Load settings from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mapSettings");
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mapSettings", JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/api/listings/map");
        const data = await response.json();
        if (Array.isArray(data)) {
          setListings(data.filter((l) => l.latitude && l.longitude));
        }
      } catch (error) {
        console.error("Harita verileri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    if (filter === "all") return listings;
    return listings.filter((l) =>
      l.category?.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [listings, filter]);

  const categories = useMemo(() => {
    const cats = new Set(listings.map((l) => l.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [listings]);

  const updateSettings = (updates: Partial<MapSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                filter === cat
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
              }`}
            >
              {cat === "all" ? "Tümü" : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                {filteredListings.length} İlan
              </span>
            </div>
          </div>

          <MapControls settings={settings} onSettingsChange={updateSettings} />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {filteredListings.length > 0 ? (
          <MapView
            listings={filteredListings}
            settings={settings}
            onSettingsChange={updateSettings}
          />
        ) : !loading ? (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">
              Henüz Konumlu İlan Yok
            </h3>
            <p className="text-slate-500 max-w-sm">
              Bu filtreye uygun, harita üzerinde işaretlenmiş ilan bulunamadı.
              Lütfen diğer kategorilere göz atın.
            </p>
          </div>
        ) : null}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-3xl"
            >
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
