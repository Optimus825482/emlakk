// Google Maps Places API ile Yakındaki Önemli Noktaları Tespit Et

import { LocationPoint, NearbyPOI } from "./types";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// POI kategorileri ve puanlama ağırlıkları
const POI_CATEGORIES = {
  school: { types: ["school", "university"], weight: 15, maxDistance: 2000 },
  hospital: { types: ["hospital", "doctor"], weight: 10, maxDistance: 5000 },
  shopping_mall: {
    types: ["shopping_mall", "supermarket"],
    weight: 8,
    maxDistance: 3000,
  },
  park: { types: ["park"], weight: 7, maxDistance: 1000 },
  transportation: {
    types: ["bus_station", "train_station"],
    weight: 12,
    maxDistance: 1500,
  },
  mosque: { types: ["mosque"], weight: 5, maxDistance: 1000 },
  market: { types: ["grocery_or_supermarket"], weight: 6, maxDistance: 1000 },
} as const;

/**
 * Google Places API ile yakındaki önemli noktaları tespit et
 */
export async function detectNearbyPOIs(
  location: LocationPoint,
): Promise<NearbyPOI[]> {
  const allPOIs: NearbyPOI[] = [];

  try {
    // Her kategori için arama yap
    for (const [category, config] of Object.entries(POI_CATEGORIES)) {
      for (const type of config.types) {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
          `location=${location.lat},${location.lng}&` +
          `radius=${config.maxDistance}&` +
          `type=${type}&` +
          `key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.results) {
          // En yakın 3 sonucu al
          const topResults = data.results.slice(0, 3);

          for (const place of topResults) {
            const distance = calculateDistance(
              location.lat,
              location.lng,
              place.geometry.location.lat,
              place.geometry.location.lng,
            );

            allPOIs.push({
              type: category as NearbyPOI["type"],
              name: place.name,
              distance: Math.round(distance),
              rating: place.rating,
            });
          }
        }
      }
    }

    // Mesafeye göre sırala
    return allPOIs.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("POI detection error:", error);
    return [];
  }
}

/**
 * İki nokta arası mesafe hesapla (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // metre
}

/**
 * POI'lara göre konum skoru hesapla
 */
export function calculateLocationScore(pois: NearbyPOI[]): {
  total: number;
  breakdown: Record<string, number>;
  advantages: string[];
  disadvantages: string[];
} {
  const breakdown: Record<string, number> = {
    proximity: 0,
    transportation: 0,
    amenities: 0,
    education: 0,
    health: 0,
    environment: 0,
  };

  const advantages: string[] = [];
  const disadvantages: string[] = [];

  // Eğitim skoru
  const schools = pois.filter((p) => p.type === "school");
  if (schools.length > 0) {
    const closestSchool = schools[0];
    if (closestSchool.distance < 500) {
      breakdown.education = 15;
      advantages.push(`Okula ${closestSchool.distance}m mesafede`);
    } else if (closestSchool.distance < 1000) {
      breakdown.education = 12;
      advantages.push(`Okula yürüme mesafesinde (${closestSchool.distance}m)`);
    } else if (closestSchool.distance < 2000) {
      breakdown.education = 8;
    } else {
      breakdown.education = 3;
      disadvantages.push("Okullara uzak");
    }
  } else {
    disadvantages.push("Yakında okul yok");
  }

  // Sağlık skoru
  const hospitals = pois.filter((p) => p.type === "hospital");
  if (hospitals.length > 0) {
    const closestHospital = hospitals[0];
    if (closestHospital.distance < 2000) {
      breakdown.health = 10;
      advantages.push(
        `Sağlık tesisine ${Math.round(closestHospital.distance / 1000)}km`,
      );
    } else if (closestHospital.distance < 5000) {
      breakdown.health = 7;
    } else {
      breakdown.health = 3;
    }
  }

  // Ulaşım skoru
  const transportation = pois.filter((p) => p.type === "transportation");
  if (transportation.length > 0) {
    const closest = transportation[0];
    if (closest.distance < 500) {
      breakdown.transportation = 20;
      advantages.push("Toplu taşımaya çok yakın");
    } else if (closest.distance < 1000) {
      breakdown.transportation = 15;
      advantages.push("Toplu taşımaya yakın");
    } else if (closest.distance < 1500) {
      breakdown.transportation = 10;
    } else {
      breakdown.transportation = 5;
      disadvantages.push("Toplu taşımaya uzak");
    }
  }

  // Sosyal tesisler (market, AVM, park)
  const amenities = pois.filter((p) =>
    ["shopping_mall", "market", "park"].includes(p.type),
  );
  if (amenities.length >= 3) {
    breakdown.amenities = 20;
    advantages.push("Sosyal tesislere yakın");
  } else if (amenities.length >= 2) {
    breakdown.amenities = 15;
  } else if (amenities.length >= 1) {
    breakdown.amenities = 10;
  } else {
    breakdown.amenities = 3;
    disadvantages.push("Sosyal tesisler sınırlı");
  }

  // Çevre skoru (park varlığı)
  const parks = pois.filter((p) => p.type === "park");
  if (parks.length > 0 && parks[0].distance < 500) {
    breakdown.environment = 10;
    advantages.push("Yeşil alana yakın");
  } else if (parks.length > 0 && parks[0].distance < 1000) {
    breakdown.environment = 7;
  } else {
    breakdown.environment = 3;
  }

  // Merkeze yakınlık (varsayılan - gerçek merkez koordinatı ile hesaplanabilir)
  breakdown.proximity = 15; // Placeholder

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    total: Math.round(total),
    breakdown,
    advantages,
    disadvantages,
  };
}
