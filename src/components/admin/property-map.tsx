"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ALL_NEIGHBORHOODS } from "@/lib/neighborhood-boundaries";
import { toast } from "sonner";

// Leaflet'i dinamik olarak yükle (SSR sorununu önlemek için)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polygon = dynamic(() => import("react-leaflet").then((mod) => mod.Polygon), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster").then((mod) => mod.default), { ssr: false });

// Leaflet CSS'ini import et
import "leaflet/dist/leaflet.css";

interface MapMarker {
  id: string | number;
  position: { lat: number; lng: number };
  title: string;
  price: number | string;
  type: string;
  transactionType: "sale" | "rent";
  area?: number;
  thumbnail?: string;
  slug: string;
  district: string;
  neighborhood?: string;
  category?: string;
}

const CATEGORIES = [
  { id: "all", label: "HEPSİ", icon: "dashboard", color: "slate" },
  { id: "konut", label: "KONUT", icon: "home", color: "blue" },
  { id: "arsa", label: "ARSA", icon: "landscape", color: "emerald" },
  { id: "isyeri", label: "İŞYERİ", icon: "store", color: "orange" },
  { id: "bina", label: "BİNA", icon: "apartment", color: "red" },
];

const categoryColors: Record<string, string> = {
  konut: "bg-blue-500",
  arsa: "bg-emerald-500",
  isyeri: "bg-orange-500",
  bina: "bg-red-500",
  sanayi: "bg-cyan-500",
  tarim: "bg-green-600",
  ticari: "bg-purple-500",
  default: "bg-slate-500",
};

export default function PropertyMap() {
  const [listings, setListings] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    transactionType: "all",
    minPrice: "",
    maxPrice: "",
    district: "Hendek"
  });
  const [L, setL] = useState<any>(null);
  const [customIcons, setCustomIcons] = useState<any>(null);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    const mapContainer = document.getElementById("map-container");
    if (!document.fullscreenElement && mapContainer) {
      mapContainer.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // ESC key listener for fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleEsc);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Initialize Leaflet Icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        const Leaflet = leaflet.default;
        setL(Leaflet);

        const createIcon = (color: string) => Leaflet.divIcon({
          className: "custom-div-icon",
          html: `<div class="relative flex items-center justify-center">
                  <div class="absolute w-8 h-8 rounded-full ${color} opacity-20 animate-ping"></div>
                  <div class="relative w-6 h-6 rounded-full ${color} border-2 border-white shadow-lg flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        setCustomIcons({
          konut: createIcon("bg-blue-500"),
          arsa: createIcon("bg-emerald-500"),
          isyeri: createIcon("bg-orange-500"),
          bina: createIcon("bg-red-500"),
          default: createIcon("bg-slate-500"),
        });
      });
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/map/listings");
      const result = await res.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      
      if (Array.isArray(data)) {
        setListings(data);
        toast.success(`Harita güncellendi: ${data.length} ilan`);
      }
    } catch (error) {
      console.error("Map data error:", error);
      toast.error("Harita verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredMarkers = useMemo(() => {
    return listings.filter(m => {
      if (filters.type !== "all" && m.type?.toLowerCase() !== filters.type.toLowerCase()) return false;
      if (filters.transactionType !== "all" && m.transactionType !== filters.transactionType) return false;
      if (filters.minPrice && Number(m.price) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && Number(m.price) > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [listings, filters]);

  const stats = useMemo(() => ({
    total: filteredMarkers.length,
    sale: filteredMarkers.filter(m => m.transactionType === "sale").length,
    rent: filteredMarkers.filter(m => m.transactionType === "rent").length,
  }), [filteredMarkers]);

  const getMarkerIcon = useCallback((type: string) => {
    if (!customIcons) return null;
    const normalizedType = type?.toLowerCase() || "default";
    
    if (normalizedType.includes("konut")) return customIcons.konut;
    if (normalizedType.includes("arsa") || normalizedType.includes("tarla")) return customIcons.arsa;
    if (normalizedType.includes("işyeri") || normalizedType.includes("dükkan")) return customIcons.isyeri;
    if (normalizedType.includes("bina")) return customIcons.bina;
    
    return customIcons.default;
  }, [customIcons]);

  const createClusterIcon = useCallback((cluster: any) => {
    if (!L) return null;
    const count = cluster.getChildCount();
    let colorClass = "bg-slate-600";
    let borderColor = "border-slate-400";
    
    if (count > 100) {
      colorClass = "bg-orange-600";
      borderColor = "border-orange-400";
    } else if (count > 20) {
      colorClass = "bg-blue-600";
      borderColor = "border-blue-400";
    } else if (count > 5) {
      colorClass = "bg-emerald-600";
      borderColor = "border-emerald-400";
    }

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
          <div class="absolute inset-0 rounded-full ${colorClass} opacity-90 animate-pulse"></div>
          <div class="absolute inset-0 rounded-full border-2 ${borderColor} opacity-50"></div>
          <div class="relative z-10 flex items-center justify-center w-10 h-10 bg-zinc-900 rounded-full border-2 ${borderColor} shadow-2xl">
            <span class="text-white font-black font-mono text-sm">${count}</span>
          </div>
        </div>
      `,
      className: "custom-cluster-icon",
      iconSize: [48, 48],
    });
  }, [L]);

  if (loading && listings.length === 0) {
    return (
      <div className="w-full h-[600px] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="size-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <Icon name="map" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-2xl" />
        </div>
        <p className="text-emerald-500 font-mono text-sm animate-pulse uppercase tracking-widest">
          SİSTEM BAŞLATILIYOR: HARİTA VERİLERİ YÜKLENİYOR...
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 animate-in fade-in duration-700", isFullscreen && "fixed inset-0 z-[9999] bg-zinc-950 p-6 overflow-hidden")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-zinc-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Icon name="map" className="text-emerald-400 text-3xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase font-mono">
                  EMLAK KOMUTA HARİTASI <span className="text-emerald-500">v4.1</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] text-emerald-500/70 font-mono tracking-widest uppercase">
                    CANLI VERİ AKIŞI AKTİF
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-zinc-900 border border-slate-800 rounded-xl p-1 flex">
                {[
                  { id: "all", label: "TÜMÜ" },
                  { id: "sale", label: "SATILIK" },
                  { id: "rent", label: "KİRALIK" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFilters(f => ({ ...f, transactionType: t.id }))}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tighter",
                      filters.transactionType === t.id
                        ? "bg-emerald-500 text-slate-900 shadow-lg"
                        : "text-slate-500 hover:text-white"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilters(f => ({ ...f, type: cat.id }))}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 group",
                  filters.type === cat.id
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-zinc-900/50 border-slate-800 text-slate-500 hover:border-slate-600"
                )}
              >
                <Icon name={cat.icon} className={cn(
                  "text-lg transition-transform group-hover:scale-110",
                  filters.type === cat.id ? "text-emerald-400" : "text-slate-600"
                )} />
                <span className="text-[11px] font-bold tracking-widest font-mono uppercase">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">TOPLAM_İLAN</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-white font-mono group-hover:text-emerald-400 transition-colors">{stats.total}</span>
              <Icon name="database" className="text-slate-700 text-xl" />
            </div>
          </div>
          <div className="bg-zinc-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">AKTİF_FİLTRE</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-white font-mono group-hover:text-blue-400 transition-colors">{filteredMarkers.length}</span>
              <Icon name="filter_list" className="text-slate-700 text-xl" />
            </div>
          </div>
          <div className="col-span-2 bg-emerald-500 border border-emerald-400 rounded-2xl p-5 flex items-center justify-between group cursor-pointer hover:bg-emerald-400 transition-all active:scale-[0.98]" onClick={fetchListings}>
            <div>
              <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest font-mono">VERİ_YENİLE</p>
              <p className="text-emerald-950 font-bold">RE-SYNC DATABASE</p>
            </div>
            <Icon name="sync" className={cn("text-emerald-900 text-2xl", loading && "animate-spin")} />
          </div>
        </div>
      </div>

      <div id="map-container" className={cn("relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group/map transition-all duration-500", isFullscreen ? "h-full w-full" : "h-[500px] md:h-[700px]")}>
        <button 
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-[400] p-3 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-zinc-800 transition-all shadow-lg group/fs"
        >
          <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} className="text-xl group-hover/fs:scale-110 transition-transform" />
        </button>

        <MapContainer
          center={[40.8385, 30.7490]}
          zoom={13}
          className="w-full h-full grayscale-[0.2] contrast-[1.1] brightness-[0.9]"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={40}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
          >
            {filteredMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.position.lat, marker.position.lng]}
                icon={getMarkerIcon(marker.type)}
              >
                <Popup className="custom-map-popup">
                  <div className="w-[260px] overflow-hidden rounded-xl bg-zinc-950 border border-slate-800">
                    {marker.thumbnail && (
                      <div className="relative h-32 w-full">
                        <img src={marker.thumbnail} alt={marker.title} className="h-full w-full object-cover" />
                        <div className={cn(
                          "absolute top-2 right-2 px-2 py-1 rounded text-[9px] font-bold text-white",
                          marker.transactionType === "sale" ? "bg-emerald-500" : "bg-blue-500"
                        )}>
                          {marker.transactionType === "sale" ? "SATILIK" : "KİRALIK"}
                        </div>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest", marker.transactionType === "sale" ? "text-emerald-400" : "text-blue-400")}>
                        {marker.type?.toUpperCase()}
                      </p>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{marker.title}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-mono font-bold text-white">
                          ₺{Number(marker.price).toLocaleString("tr-TR")}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">{marker.area} m²</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Icon name="location_on" className="text-xs" />
                        <span className="text-[10px] truncate">{marker.neighborhood}, {marker.district}</span>
                      </div>
                      <a
                        href={`/admin/ilanlar/${marker.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors mt-2"
                      >
                        İLAN_DETAYINA_GİT <Icon name="open_in_new" className="text-[10px]" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <style jsx global>{`
        .custom-map-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-map-popup .leaflet-popup-content {
          margin: 0 !important;
          background: transparent !important;
        }
        .custom-map-popup .leaflet-popup-tip {
          background: #09090b !important;
        }
        .leaflet-container {
          background: #09090b !important;
        }
      `}</style>
    </div>
  );
}
