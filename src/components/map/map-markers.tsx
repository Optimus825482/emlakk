"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { PropertyListing, MapSettings } from "./property-map";
import { renderToString } from "react-dom/server";

interface MapMarkersProps {
  listings: PropertyListing[];
  settings: MapSettings;
}

// Custom marker icons based on category
const createCustomIcon = (category: string, type: string, isExact: boolean) => {
  const colors: Record<string, string> = {
    konut: type === "Kiralık" ? "#f59e0b" : "#3b82f6",
    arsa: "#10b981",
    işyeri: "#8b5cf6",
    bina: "#1f2937",
    default: "#6b7280",
  };

  const cat = category?.toLowerCase() || "default";
  const color = colors[cat] || colors.default;
  const opacity = isExact ? 1 : 0.7;

  const iconHtml = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: ${opacity};
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%);
        color: white;
        font-size: 14px;
        font-weight: bold;
        z-index: 1;
      ">🏠</div>
      ${
        !isExact
          ? `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 2;
        "></div>
      `
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Create cluster icon
const createClusterIcon = (cluster: any) => {
  const childCount = cluster.getChildCount();
  let sizeClass = "w-10 h-10 text-sm";

  if (childCount > 100) {
    sizeClass = "w-16 h-16 text-lg";
  } else if (childCount > 10) {
    sizeClass = "w-12 h-12 text-base";
  }

  const iconHtml = `
    <div class="${sizeClass} flex items-center justify-center bg-primary-600 text-white font-bold rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
      ${childCount}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-cluster-icon",
    iconSize: [40, 40],
  });
};

export default function MapMarkers({ listings, settings }: MapMarkersProps) {
  const map = useMap();
  const markersRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);

  useEffect(() => {
    // Clear existing markers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    // Create marker group (clustered or not)
    const markerGroup = settings.showClusters
      ? L.markerClusterGroup({
          iconCreateFunction: createClusterIcon,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 50,
          disableClusteringAtZoom: 16,
        })
      : L.layerGroup();

    // Add markers
    listings.forEach((listing) => {
      const icon = createCustomIcon(
        listing.category,
        listing.type,
        listing.isExact,
      );

      const marker = L.marker([listing.latitude, listing.longitude], { icon });

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-[240px] max-w-[280px]">
          ${
            listing.thumbnail
              ? `<img 
                  src="${listing.thumbnail}" 
                  alt="${listing.title}"
                  class="w-full h-32 object-cover rounded-xl mb-3 shadow-md"
                  onerror="this.style.display='none'"
                />`
              : ""
          }
          <h3 class="font-outfit font-bold text-sm mb-2 leading-tight text-slate-900 line-clamp-2">
            ${listing.title}
          </h3>
          
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-1 rounded-lg bg-primary-100 text-primary-700 font-bold">
              ${listing.category || "Emlak"}
            </span>
            <span class="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
              ${listing.type}
            </span>
          </div>

          ${
            listing.location
              ? `<div class="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="truncate">${listing.location}</span>
                </div>`
              : ""
          }

          <div class="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
            <span class="text-primary-600 font-bold text-lg">
              ${new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
                maximumFractionDigits: 0,
              }).format(listing.price)}
            </span>
            ${
              !listing.isExact
                ? `<span class="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-bold">
                    ~Yaklaşık
                  </span>`
                : ""
            }
          </div>

          <a
            href="/ilanlar/${listing.slug}"
            class="block w-full text-center py-2.5 bg-slate-900 hover:bg-primary-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-md hover:shadow-lg"
          >
            Detayları Gör →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-popup",
      });

      // Add hover effect
      marker.on("mouseover", () => {
        marker.openPopup();
      });

      markerGroup.addLayer(marker);
    });

    // Add to map
    map.addLayer(markerGroup);
    markersRef.current = markerGroup;

    // Fit bounds if listings exist
    if (listings.length > 0) {
      const bounds = L.latLngBounds(
        listings.map((l) => [l.latitude, l.longitude]),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
    };
  }, [listings, settings.showClusters, map]);

  return null;
}
