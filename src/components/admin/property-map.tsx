"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Home,
  Building2,
  Store,
  Landmark,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ALL_NEIGHBORHOODS } from "@/lib/neighborhood-boundaries";

// Leaflet'i dinamik olarak yükle (SSR sorununu önlemek için)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false },
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false },
);

// Marker Clustering için
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-cluster").then((mod) => mod.default),
  { ssr: false },
);

// Leaflet CSS'ini import et
import "leaflet/dist/leaflet.css";

interface District {
  value: string;
  label: string;
  count: number;
}

interface MapMarker {
  id: number;
  position: { lat: number; lng: number };
  title: string;
  price: string;
  location: string;
  image: string;
  link: string;
  category: string;
  transaction: string;
  m2: string;
  district: string;
  markerColor: string;
}

interface MapData {
  markers: MapMarker[];
  stats: {
    total: number;
    satilik: number;
    kiralik: number;
    categories: {
      konut: number;
      arsa: number;
      isyeri: number;
      bina: number;
    };
  };
  filters: {
    district: string;
    category: string;
    transaction: string;
  };
}

const CATEGORIES = [
  { value: "all", label: "Tüm Kategoriler", icon: MapPin },
  { value: "konut", label: "Konut", icon: Home },
  { value: "arsa", label: "Arsa", icon: Landmark },
  { value: "isyeri", label: "İşyeri", icon: Store },
  { value: "bina", label: "Bina", icon: Building2 },
];

const TRANSACTIONS = [
  { value: "all", label: "Tümü" },
  { value: "satilik", label: "Satılık" },
  { value: "kiralik", label: "Kiralık" },
];

export default function PropertyMap() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<string>("all");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    40.7569, 30.4013,
  ]); // Sakarya merkez
  const [L, setL] = useState<any>(null);
  const [customIcons, setCustomIcons] = useState<{
    blueIcon: any;
    redIcon: any;
  } | null>(null);

  // Leaflet'i client-side'da yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        const L = leaflet.default;
        setL(L);

        // Marker icon'larını düzelt
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Custom icon'ları oluştur
        const createCustomIcon = (color: string) => {
          return L.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  background-color: white;
                  border-radius: 50%;
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(45deg);
                "></div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
          });
        };

        setCustomIcons({
          blueIcon: createCustomIcon("#3b82f6"),
          redIcon: createCustomIcon("#ef4444"),
        });
      });
    }
  }, []);

  // İlçeleri yükle
  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/sahibinden/districts");
      const result = await response.json();

      if (result.success) {
        setDistricts([
          { value: "all", label: "Tüm İlçeler", count: 0 },
          ...result.data,
        ]);
      }
    } catch (error) {
      console.error("İlçeler yüklenemedi:", error);
    }
  };

  const fetchMapData = async () => {
    if (
      selectedDistrict === "all" &&
      selectedCategory === "all" &&
      selectedTransaction === "all"
    ) {
      setError(
        "Lütfen en az bir filtre seçin (İlçe, Kategori veya Satılık/Kiralık)",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDistrict !== "all")
        params.append("district", selectedDistrict);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedTransaction !== "all")
        params.append("transaction", selectedTransaction);

      const response = await fetch(
        `/api/sahibinden/map-data?${params.toString()}`,
      );
      const result = await response.json();

      if (result.success) {
        setMapData(result.data);

        // İlk marker'a göre harita merkezini ayarla
        if (result.data.markers.length > 0) {
          const firstMarker = result.data.markers[0];
          setMapCenter([firstMarker.position.lat, firstMarker.position.lng]);
        }
      } else {
        setError(result.error || "Harita verileri yüklenemedi");
      }
    } catch (error: any) {
      setError(error.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Emlak Haritası Filtreleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* İlçe Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                İlçe
              </label>
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue
                    placeholder="İlçe seçin"
                    className="text-foreground"
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {districts.map((district) => (
                    <SelectItem
                      key={district.value}
                      value={district.value}
                      className="text-foreground"
                    >
                      {district.label}
                      {district.count > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({district.count})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kategori Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Kategori
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue
                    placeholder="Kategori seçin"
                    className="text-foreground"
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        className="text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Satılık/Kiralık Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                İlan Tipi
              </label>
              <Select
                value={selectedTransaction}
                onValueChange={setSelectedTransaction}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue
                    placeholder="İlan tipi seçin"
                    className="text-foreground"
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {TRANSACTIONS.map((transaction) => (
                    <SelectItem
                      key={transaction.value}
                      value={transaction.value}
                      className="text-foreground"
                    >
                      {transaction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Haritayı Göster Butonu */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Göster</label>
              <Button
                onClick={fetchMapData}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Haritayı Göster
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* İstatistikler */}
      {mapData && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{mapData.stats.total}</div>
                <div className="text-sm text-muted-foreground">Toplam İlan</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mapData.stats.satilik}
                </div>
                <div className="text-sm text-muted-foreground">Satılık</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {mapData.stats.kiralik}
                </div>
                <div className="text-sm text-muted-foreground">Kiralık</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {mapData.stats.categories.konut}
                </div>
                <div className="text-sm text-muted-foreground">Konut</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {mapData.stats.categories.arsa}
                </div>
                <div className="text-sm text-muted-foreground">Arsa</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {mapData.stats.categories.isyeri +
                    mapData.stats.categories.bina}
                </div>
                <div className="text-sm text-muted-foreground">İşyeri/Bina</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Harita */}
      {mapData && mapData.markers.length > 0 && L && customIcons && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Emlak Haritası</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                  Satılık
                </Badge>
                <Badge variant="outline" className="bg-red-50">
                  <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                  Kiralık
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Mahalle Sınırları - Kırmızı Polygon'lar */}
                {ALL_NEIGHBORHOODS.filter(
                  (nb) =>
                    nb.district.toLowerCase() ===
                    selectedDistrict.toLowerCase(),
                ).map((neighborhood, idx) => (
                  <Polygon
                    key={idx}
                    positions={neighborhood.bounds}
                    pathOptions={{
                      color: "#ef4444",
                      weight: 2,
                      opacity: 0.6,
                      fillColor: "#ef4444",
                      fillOpacity: 0.1,
                    }}
                  >
                    <Tooltip permanent={false} direction="center">
                      <div className="text-xs font-semibold">
                        {neighborhood.name}
                      </div>
                    </Tooltip>
                  </Polygon>
                ))}

                {/* Marker Clustering - Performans için */}
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom={true}
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick={true}
                >
                  {mapData.markers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={[marker.position.lat, marker.position.lng]}
                      icon={
                        marker.transaction === "satilik"
                          ? customIcons.blueIcon
                          : customIcons.redIcon
                      }
                    >
                      <Popup maxWidth={300}>
                        <div className="space-y-2">
                          {marker.image && (
                            <img
                              src={marker.image}
                              alt={marker.title}
                              className="w-full h-32 object-cover rounded"
                            />
                          )}
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {marker.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                marker.transaction === "satilik"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {marker.transaction === "satilik"
                                ? "Satılık"
                                : "Kiralık"}
                            </Badge>
                            <Badge variant="outline">{marker.category}</Badge>
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {marker.price}
                          </div>
                          {marker.m2 && (
                            <div className="text-sm text-muted-foreground">
                              {marker.m2} m²
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            📍 {marker.location}
                          </div>
                          <a
                            href={marker.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            İlanı Görüntüle
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {mapData && mapData.markers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Seçilen filtrelere uygun ilan bulunamadı.</p>
              <p className="text-sm mt-2">Lütfen farklı filtreler deneyin.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
