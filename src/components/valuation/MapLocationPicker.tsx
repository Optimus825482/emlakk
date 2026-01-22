"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";
import { Icon } from "@/components/ui/icon";

interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
  ilce?: string;
  mahalle?: string;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: LocationPoint) => void;
  initialLocation?: LocationPoint;
}

const defaultCenter = {
  lat: 40.8008, // Hendek, Sakarya
  lng: 30.7469,
};

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "1rem",
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export function MapLocationPicker({
  onLocationSelect,
  initialLocation,
}: MapLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationPoint | null>(initialLocation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setIsLoading(true);

      try {
        // Reverse geocoding - koordinattan adres bilgisi al
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });

        if (response.results[0]) {
          const addressComponents = response.results[0].address_components;
          const formattedAddress = response.results[0].formatted_address;

          // İlçe ve mahalle bilgisini çıkar
          let ilce = "";
          let mahalle = "";

          for (const component of addressComponents) {
            if (component.types.includes("administrative_area_level_2")) {
              ilce = component.long_name;
            }
            if (
              component.types.includes("sublocality_level_1") ||
              component.types.includes("neighborhood")
            ) {
              mahalle = component.long_name;
            }
            // Fallback: route veya sublocality'den mahalle al
            if (!mahalle && component.types.includes("sublocality")) {
              mahalle = component.long_name;
            }
            if (!mahalle && component.types.includes("route")) {
              // Son çare: sokak/cadde adından mahalle çıkar
              const routeName = component.long_name;
              // "Merkez Mahallesi", "Cumhuriyet Mahallesi" gibi
              if (routeName.toLowerCase().includes("mahalle")) {
                mahalle = routeName;
              }
            }
          }
          
          // Fallback: formatted_address'ten mahalle parse et
          // Format: "Sokak No, Mahalle, İlçe/İl, Ülke"
          if (!mahalle && formattedAddress) {
            const parts = formattedAddress.split(",").map((p: string) => p.trim());
            // Genellikle 2. veya 3. part mahalle oluyor
            for (let i = 1; i < Math.min(parts.length, 4); i++) {
              const part = parts[i];
              if (part.toLowerCase().includes("mah") || 
                  part.toLowerCase().includes("köy") ||
                  part.toLowerCase().includes("mahallesi")) {
                mahalle = part;
                break;
              }
            }
          }

          const location: LocationPoint = {
            lat,
            lng,
            address: formattedAddress,
            ilce,
            mahalle,
          };

          setSelectedLocation(location);
          onLocationSelect(location);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onLocationSelect],
  );

  const handleSearch = async () => {
    if (!searchQuery.trim() || !geocoderRef.current) return;

    setIsLoading(true);

    try {
      const response = await geocoderRef.current.geocode({
        address: searchQuery,
      });

      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        const addressComponents = response.results[0].address_components;
        let ilce = "";
        let mahalle = "";

        for (const component of addressComponents) {
          if (component.types.includes("administrative_area_level_2")) {
            ilce = component.long_name;
          }
          if (
            component.types.includes("sublocality_level_1") ||
            component.types.includes("neighborhood")
          ) {
            mahalle = component.long_name;
          }
          if (!mahalle && component.types.includes("sublocality")) {
            mahalle = component.long_name;
          }
          if (!mahalle && component.types.includes("route")) {
            const routeName = component.long_name;
            if (routeName.toLowerCase().includes("mahalle")) {
              mahalle = routeName;
            }
          }
        }
        
        const formattedAddress = response.results[0].formatted_address;
        if (!mahalle && formattedAddress) {
          const parts = formattedAddress.split(",").map((p: string) => p.trim());
          for (let i = 1; i < Math.min(parts.length, 4); i++) {
            const part = parts[i];
            if (part.toLowerCase().includes("mah") || 
                part.toLowerCase().includes("köy") ||
                part.toLowerCase().includes("mahallesi")) {
              mahalle = part;
              break;
            }
          }
        }

        const locationData: LocationPoint = {
          lat,
          lng,
          address: response.results[0].formatted_address,
          ilce,
          mahalle,
        };

        setSelectedLocation(locationData);
        onLocationSelect(locationData);

        // Haritayı konuma odakla
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(16);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Adres bulunamadı. Lütfen farklı bir adres deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Adres ara (örn: Hendek Merkez, Atatürk Caddesi)"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="px-6 py-3 bg-[var(--terracotta)] text-white rounded-xl font-medium hover:bg-[var(--terracotta-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Icon name="sync" className="animate-spin" />
          ) : (
            <Icon name="search" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Icon name="info" className="text-[var(--terracotta)]" />
        <span>Harita üzerinde mülkünüzün konumunu tıklayarak seçin</span>
      </div>

      {/* Map */}
      <div className="relative">
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={selectedLocation || defaultCenter}
            zoom={selectedLocation ? 16 : 13}
            options={mapOptions}
            onLoad={onMapLoad}
            onClick={onMapClick}
          >
            {selectedLocation && (
              <>
                {/* Seçilen konum marker */}
                <Marker
                  position={{
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng,
                  }}
                  icon={{
                    url:
                      "data:image/svg+xml;charset=UTF-8," +
                      encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                        <path fill="#E74C3C" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                  }}
                />

                {/* Yakınlık çemberi (500m) */}
                <Circle
                  center={{
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng,
                  }}
                  radius={500}
                  options={{
                    fillColor: "#E74C3C",
                    fillOpacity: 0.1,
                    strokeColor: "#E74C3C",
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                  }}
                />
              </>
            )}
          </GoogleMap>
        </LoadScript>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-white">
              <Icon name="sync" className="text-2xl animate-spin" />
              <span className="font-medium">Konum bilgisi alınıyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Icon
              name="location_on"
              className="text-[var(--terracotta)] text-2xl mt-1"
            />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">Seçilen Konum</h4>
              <p className="text-gray-400 text-sm mb-2">
                {selectedLocation.address}
              </p>
              <div className="flex gap-4 text-xs">
                {selectedLocation.ilce && (
                  <span className="text-gray-500">
                    İlçe:{" "}
                    <span className="text-white">{selectedLocation.ilce}</span>
                  </span>
                )}
                {selectedLocation.mahalle && (
                  <span className="text-gray-500">
                    Mahalle:{" "}
                    <span className="text-white">
                      {selectedLocation.mahalle}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
