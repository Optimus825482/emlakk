"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { PropertyListing, MapSettings } from "./property-map";
import MapMarkers from "./map-markers";
import MapZoomControls from "./map-zoom-controls";

interface MapViewProps {
  listings: PropertyListing[];
  settings: MapSettings;
  onSettingsChange: (settings: Partial<MapSettings>) => void;
}

// Tile Layer URLs for different map types
const TILE_LAYERS: Record<string, { url: string; attribution: string }> = {
  // Standart Haritalar
  roadmap: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },

  // Uydu Görünümleri
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; World Imagery",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },

  // Arazi ve Topografik
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap",
  },

  // Karanlık Temalar
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  darkMatter: {
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
  },

  // Aydınlık Temalar
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
  },
  positron: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
  },

  // Renkli ve Artistik
  watercolor: {
    url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; Stamen Design',
  },
  toner: {
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png",
    attribution: "&copy; Stadia Maps &copy; Stamen Design",
  },

  // Sokak ve Ulaşım
  transport: {
    url: "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=YOUR_API_KEY",
    attribution:
      '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>',
  },

  // Bisiklet Yolları
  cycle: {
    url: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=YOUR_API_KEY",
    attribution: "&copy; Thunderforest",
  },

  // Açık Sokak Haritası (Humanitarian)
  humanitarian: {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      "&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team",
  },

  // Wikimedia Haritası
  wikimedia: {
    url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
  },
};

function MapUpdater({ settings }: { settings: MapSettings }) {
  const map = useMap();

  useEffect(() => {
    // Update map when settings change
    map.invalidateSize();
  }, [settings, map]);

  return null;
}

export default function MapView({
  listings,
  settings,
  onSettingsChange,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [center, setCenter] = useState<[number, number]>([40.795, 30.745]);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    setIsMounted(true);

    // Calculate center from listings
    if (listings.length > 0) {
      const avgLat =
        listings.reduce((sum, l) => sum + l.latitude, 0) / listings.length;
      const avgLng =
        listings.reduce((sum, l) => sum + l.longitude, 0) / listings.length;
      setCenter([avgLat, avgLng]);
    }
  }, [listings]);

  if (!isMounted) return null;

  const tileLayer = TILE_LAYERS[settings.mapType] || TILE_LAYERS.roadmap;

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border-2 border-white/10 dark:border-slate-800 shadow-2xl">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
        style={{ background: "#1e293b" }}
      >
        {/* Base Tile Layer */}
        <TileLayer
          key={settings.mapType}
          url={tileLayer.url}
          attribution={tileLayer.attribution}
          className={`map-tiles ${settings.mapType === "satellite" || settings.mapType === "hybrid" ? "brightness-90" : ""}`}
        />

        {/* Hybrid Labels Overlay */}
        {settings.mapType === "hybrid" && settings.showLabels && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution=""
            opacity={0.4}
          />
        )}

        <MapUpdater settings={settings} />
        <MapMarkers listings={listings} settings={settings} />
        <MapZoomControls />
      </MapContainer>

      {/* Map Type Badge */}
      <div className="absolute bottom-6 left-6 z-[1000] px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {TILE_LAYERS[settings.mapType]
              ? settings.mapType.charAt(0).toUpperCase() +
                settings.mapType.slice(1)
              : "Roadmap"}
          </span>
        </div>
      </div>

      {/* Listings Count Badge */}
      <div className="absolute bottom-6 right-6 z-[1000] px-4 py-2 bg-primary-600 backdrop-blur-xl rounded-xl shadow-lg">
        <span className="text-xs font-bold text-white">
          {listings.length} İlan
        </span>
      </div>
    </div>
  );
}
