// Google Maps Places API (New) ile Yakındaki Önemli Noktaları Tespit Et

import { LocationPoint, NearbyPOI, POIDetail, CategoryPOIDetails } from "./types";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const CHAIN_MARKETS = [
  "A101", "BİM", "BIM", "ŞOK", "SOK", "Şok",
  "CarrefourSA", "Carrefour", "Migros", "Macro Center", "MacroCenter",
  "Metro", "File", "Hakmar", "Yunus Market", "Tarım Kredi",
  "Gratis", "Watsons", "Rossmann",
  "Özdilek", "Kipa", "Real", "Tesco", "Groseri",
] as const;

export function isChainMarket(name: string): boolean {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9ığüşöçı]/g, "");
  return CHAIN_MARKETS.some(chain => {
    const normalizedChain = chain.toLowerCase().replace(/[^a-z0-9ığüşöçı]/g, "");
    return normalizedName.includes(normalizedChain);
  });
}

const POI_CATEGORIES = {
  school: { types: ["school", "primary_school", "secondary_school", "university"], weight: 15, maxDistance: 2000 },
  hospital: { types: ["hospital", "doctor", "pharmacy"], weight: 10, maxDistance: 5000 },
  shopping_mall: { types: ["shopping_mall", "department_store"], weight: 8, maxDistance: 3000 },
  park: { types: ["park"], weight: 7, maxDistance: 1000 },
  transportation: { types: ["bus_station", "transit_station", "train_station"], weight: 12, maxDistance: 1500 },
  mosque: { types: ["mosque"], weight: 5, maxDistance: 1000 },
  market: { types: ["supermarket", "grocery_store", "convenience_store"], weight: 6, maxDistance: 1000 },
  bakery: { types: ["bakery"], weight: 4, maxDistance: 800 },
} as const;

async function searchNearbyNew(
  location: LocationPoint,
  includedTypes: string[],
  maxRadius: number
): Promise<any[]> {
  const url = "https://places.googleapis.com/v1/places:searchNearby";
  
  const requestBody = {
    includedTypes: includedTypes,
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: maxRadius,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.rating,places.types",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Places API (New) error:", data.error);
      return [];
    }

    return data.places || [];
  } catch (error) {
    console.error("Places API (New) fetch error:", error);
    return [];
  }
}

export async function detectNearbyPOIs(
  location: LocationPoint,
): Promise<NearbyPOI[]> {
  const allPOIs: NearbyPOI[] = [];

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not configured for POI detection - using defaults");
    return getDefaultPOIs();
  }

  console.log("🔍 Using Places API (New) for POI detection...");

  try {
    for (const [category, config] of Object.entries(POI_CATEGORIES)) {
      const places = await searchNearbyNew(location, [...config.types], config.maxDistance);
      
      console.log(`POI Search [${category}]:`, {
        types: config.types,
        count: places.length,
      });

      for (const place of places) {
        if (!place.location) continue;
        
        const placeLat = place.location.latitude;
        const placeLng = place.location.longitude;
        const placeName = place.displayName?.text || "Unknown";
        
        const distance = calculateDistance(
          location.lat,
          location.lng,
          placeLat,
          placeLng,
        );

        console.log(`POI Distance [${placeName}]:`, {
          from: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          to: `${placeLat.toFixed(6)}, ${placeLng.toFixed(6)}`,
          distance: Math.round(distance),
        });

        allPOIs.push({
          type: category as NearbyPOI["type"],
          name: placeName,
          distance: Math.round(distance),
          rating: place.rating,
          isChainMarket: category === "market" ? isChainMarket(placeName) : undefined,
        });
      }
    }

    if (allPOIs.length === 0) {
      console.warn("No POIs found from API (New) - using defaults");
      return getDefaultPOIs();
    }

    console.log(`✅ Total POIs found: ${allPOIs.length}`);
    return allPOIs.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("POI detection error:", error);
    return getDefaultPOIs();
  }
}

function getDefaultPOIs(): NearbyPOI[] {
  return [
    { type: "school", name: "Yakın Okul", distance: 800, rating: 4.0 },
    { type: "hospital", name: "Sağlık Ocağı", distance: 1500, rating: 3.8 },
    { type: "transportation", name: "Otobüs Durağı", distance: 400, rating: 4.2 },
    { type: "market", name: "Market", distance: 300, rating: 4.0 },
    { type: "park", name: "Park", distance: 600, rating: 4.1 },
    { type: "mosque", name: "Cami", distance: 500, rating: 4.5 },
  ];
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

  return R * c;
}

export function calculateLocationScore(pois: NearbyPOI[]): {
  total: number;
  breakdown: Record<string, number>;
  advantages: string[];
  disadvantages: string[];
  poiDetails: CategoryPOIDetails;
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
  
  const poiDetails: CategoryPOIDetails = {
    transportation: [],
    education: [],
    amenities: [],
    health: [],
  };

  const formatDistance = (m: number) => m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;

  const schools = pois.filter((p) => p.type === "school").sort((a, b) => a.distance - b.distance);
  if (schools.length > 0) {
    const closestSchool = schools[0];
    if (closestSchool.distance < 500) {
      breakdown.education = 15;
    } else if (closestSchool.distance < 1000) {
      breakdown.education = 12;
    } else if (closestSchool.distance < 2000) {
      breakdown.education = 8;
    } else {
      breakdown.education = 3;
      disadvantages.push("Okullara uzak");
    }
    schools.slice(0, 2).forEach((s) => {
      if (s.distance < 1500) {
        advantages.push(`${s.name} - ${formatDistance(s.distance)}`);
        poiDetails.education.push({ name: s.name, distance: s.distance });
      }
    });
  } else {
    disadvantages.push("Yakında okul yok");
  }

  const hospitals = pois.filter((p) => p.type === "hospital").sort((a, b) => a.distance - b.distance);
  if (hospitals.length > 0) {
    const closestHospital = hospitals[0];
    if (closestHospital.distance < 2000) {
      breakdown.health = 10;
      advantages.push(`${closestHospital.name} - ${formatDistance(closestHospital.distance)}`);
    } else if (closestHospital.distance < 5000) {
      breakdown.health = 7;
    } else {
      breakdown.health = 3;
    }
    hospitals.slice(0, 2).forEach((h) => {
      if (h.distance < 3000) {
        poiDetails.health.push({ name: h.name, distance: h.distance });
      }
    });
  }

  const transportation = pois.filter((p) => p.type === "transportation").sort((a, b) => a.distance - b.distance);
  if (transportation.length > 0) {
    const closest = transportation[0];
    if (closest.distance < 500) {
      breakdown.transportation = 20;
    } else if (closest.distance < 1000) {
      breakdown.transportation = 15;
    } else if (closest.distance < 1500) {
      breakdown.transportation = 10;
    } else {
      breakdown.transportation = 5;
      disadvantages.push("Toplu taşımaya uzak");
    }
    if (closest.distance < 1000) {
      advantages.push(`${closest.name} - ${formatDistance(closest.distance)}`);
    }
    transportation.slice(0, 2).forEach((t) => {
      if (t.distance < 1500) {
        poiDetails.transportation.push({ name: t.name, distance: t.distance });
      }
    });
  }

  const markets = pois.filter((p) => p.type === "market" || p.type === "shopping_mall").sort((a, b) => a.distance - b.distance);
  if (markets.length >= 3) {
    breakdown.amenities = 20;
  } else if (markets.length >= 2) {
    breakdown.amenities = 15;
  } else if (markets.length >= 1) {
    breakdown.amenities = 10;
  } else {
    breakdown.amenities = 3;
    disadvantages.push("Sosyal tesisler sınırlı");
  }
  markets.slice(0, 3).forEach((m) => {
    if (m.distance < 1000) {
      advantages.push(`${m.name} - ${formatDistance(m.distance)}`);
      poiDetails.amenities.push({ 
        name: m.name, 
        distance: m.distance, 
        isChainMarket: m.isChainMarket 
      });
    }
  });

  const mosques = pois.filter((p) => p.type === "mosque").sort((a, b) => a.distance - b.distance);
  if (mosques.length > 0 && mosques[0].distance < 800) {
    advantages.push(`${mosques[0].name} - ${formatDistance(mosques[0].distance)}`);
  }

  const bakeries = pois.filter((p) => p.type === "bakery").sort((a, b) => a.distance - b.distance);
  if (bakeries.length > 0 && bakeries[0].distance < 600) {
    advantages.push(`${bakeries[0].name} - ${formatDistance(bakeries[0].distance)}`);
  }

  const parks = pois.filter((p) => p.type === "park").sort((a, b) => a.distance - b.distance);
  if (parks.length > 0 && parks[0].distance < 500) {
    breakdown.environment = 10;
    advantages.push(`${parks[0].name} - ${formatDistance(parks[0].distance)}`);
  } else if (parks.length > 0 && parks[0].distance < 1000) {
    breakdown.environment = 7;
    advantages.push(`${parks[0].name} - ${formatDistance(parks[0].distance)}`);
  } else {
    breakdown.environment = 3;
  }

  breakdown.proximity = 15;

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    total: Math.round(total),
    breakdown,
    advantages,
    disadvantages,
    poiDetails,
  };
}
