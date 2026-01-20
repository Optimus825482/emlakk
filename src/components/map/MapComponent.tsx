"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  listings: any[];
  center?: [number, number];
  zoom?: number;
}

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const createIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const icons = {
  blue: createIcon("blue"),
  gold: createIcon("gold"),
  red: createIcon("red"),
  green: createIcon("green"),
  orange: createIcon("orange"),
  violet: createIcon("violet"),
  grey: createIcon("grey"),
  black: createIcon("black"),
};

function getMarkerIcon(category: string, type: string) {
  const cat = category?.toLowerCase() || "";
  const t = type?.toLowerCase() || "";

  // Category based Colors
  if (cat.includes("konut")) {
    return t === "kiralık" ? icons.gold : icons.blue;
  }
  if (cat.includes("arsa")) {
    return icons.green; // Arsa usually satılık
  }
  if (cat.includes("işyeri") || cat.includes("isyeri")) {
    return t === "kiralık" ? icons.violet : icons.orange;
  }
  if (cat.includes("bina")) {
    return icons.black;
  }

  return icons.grey;
}

export default function MapComponent({
  listings,
  center = [40.835, 30.749],
  zoom = 13,
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="w-full h-full relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />

        <ChangeView center={center} zoom={zoom} />

        {listings.map((listing) => {
          if (!listing.latitude || !listing.longitude) return null;

          const pos: [number, number] = [
            parseFloat(listing.latitude),
            parseFloat(listing.longitude),
          ];

          return (
            <Marker
              key={listing.id}
              position={pos}
              icon={getMarkerIcon(listing.category, listing.type)}
            >
              <Popup className="premium-popup">
                <div className="p-2 min-w-[200px]">
                  {listing.thumbnail && (
                    <img
                      src={listing.thumbnail}
                      alt={listing.title}
                      className="w-full h-24 object-cover rounded-xl mb-3"
                    />
                  )}
                  <h3 className="font-outfit font-bold text-sm mb-1 leading-tight">
                    {listing.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 font-bold text-sm">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(listing.price)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg">
                      {listing.type}
                    </span>
                  </div>
                  <a
                    href={`/ilanlar/${listing.slug}`}
                    className="block w-full text-center mt-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors"
                  >
                    Detayları Gör
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
        <div className="flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <button className="p-3 hover:bg-primary-500 hover:text-white transition-premium">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <div className="h-px bg-white/10"></div>
          <button className="p-3 hover:bg-primary-500 hover:text-white transition-premium">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
