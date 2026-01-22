import { NextResponse } from "next/server";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import {
  getNeighborhoodBoundary,
  generateCoordinateInBounds,
} from "@/lib/neighborhood-boundaries";

// Sakarya ilçe merkez koordinatları
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  adapazarı: { lat: 40.7569, lng: 30.4013 },
  akyazı: { lat: 40.685, lng: 30.625 },
  geyve: { lat: 40.5083, lng: 30.2917 },
  hendek: { lat: 40.7972, lng: 30.7472 },
  karasu: { lat: 41.0972, lng: 30.6917 },
  kaynarca: { lat: 41.0333, lng: 30.3 },
  sapanca: { lat: 40.6917, lng: 30.2667 },
  serdivan: { lat: 40.7833, lng: 30.3667 },
  söğütlü: { lat: 40.8833, lng: 30.4833 },
  taraklı: { lat: 40.3917, lng: 30.4917 },
};

// İlan koordinatı üret - mahalle sınırları içinde
function generateCoordinates(
  listingId: number,
  district: string,
  location: string,
): { lat: number; lng: number } {
  const districtKey = district.toLowerCase();
  const center = DISTRICT_CENTERS[districtKey] || {
    lat: 40.7569,
    lng: 30.4013,
  };

  // Konum string'inden mahalle ismini parse et
  let neighborhood = "";
  if (location) {
    const parts = location.split(",").map((p) => p.trim());
    // İlçe ismini içermeyen kısmı mahalle olarak al
    neighborhood =
      parts.find((p) => !p.toLowerCase().includes(district.toLowerCase())) ||
      parts[0] ||
      "";
  }

  // Mahalle sınırlarını bul
  const boundary = neighborhood
    ? getNeighborhoodBoundary(neighborhood, district)
    : null;

  if (boundary) {
    // Mahalle sınırları içinde koordinat üret
    const hash = crypto
      .createHash("md5")
      .update(listingId.toString())
      .digest("hex");
    const seed = parseInt(hash.substring(0, 8), 16);

    return generateCoordinateInBounds(boundary.bounds, seed);
  }

  // Mahalle bulunamazsa ilçe merkezine yakın random koordinat
  const hash = crypto
    .createHash("md5")
    .update(listingId.toString())
    .digest("hex");
  const hashInt = parseInt(hash.substring(0, 8), 16);

  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const latOffset = (random(hashInt) - 0.5) * 0.04;
  const lngOffset = (random(hashInt + 1) - 0.5) * 0.04;

  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const category = searchParams.get("category");
    const transaction = searchParams.get("transaction");

    if (!district || district === "all") {
      return NextResponse.json(
        { success: false, error: "Lütfen bir ilçe seçin" },
        { status: 400 },
      );
    }

    // Türkçe karakter mapping (URL'den gelen değerleri normalize et)
    const districtMap: Record<string, string> = {
      adapazari: "Adapazarı",
      akyazi: "Akyazı",
      geyve: "Geyve",
      hendek: "Hendek",
      karasu: "Karasu",
      kaynarca: "Kaynarca",
      sapanca: "Sapanca",
      serdivan: "Serdivan",
      sogutlu: "Söğütlü",
      tarakli: "Taraklı",
    };

    // District'i normalize et (lowercase + türkçe karakter mapping)
    const normalizedDistrict = districtMap[district.toLowerCase()] || district;

    console.log("Fetching map data:", {
      originalDistrict: district,
      normalizedDistrict,
      category,
      transaction,
    });

    // Where conditions - exact match with normalized district name
    const conditions = [eq(sahibindenListe.ilce, normalizedDistrict)];

    if (category && category !== "all") {
      conditions.push(eq(sahibindenListe.category, category));
    }

    if (transaction && transaction !== "all") {
      conditions.push(eq(sahibindenListe.transaction, transaction));
    }

    // Query - clustering ile tüm ilanları gösterebiliriz
    const mapData = await db
      .select({
        id: sahibindenListe.id,
        baslik: sahibindenListe.baslik,
        link: sahibindenListe.link,
        fiyat: sahibindenListe.fiyat,
        konum: sahibindenListe.konum,
        resim: sahibindenListe.resim,
        category: sahibindenListe.category,
        transaction: sahibindenListe.transaction,
        m2: sahibindenListe.m2,
        ilce: sahibindenListe.ilce,
      })
      .from(sahibindenListe)
      .where(and(...conditions));

    console.log("Map data fetched:", mapData.length, "listings");

    if (!mapData || mapData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          markers: [],
          stats: {
            total: 0,
            satilik: 0,
            kiralik: 0,
            categories: { konut: 0, arsa: 0, isyeri: 0, bina: 0 },
          },
          filters: {
            district,
            category: category || "all",
            transaction: transaction || "all",
          },
        },
      });
    }

    const markers = mapData.map((item) => {
      const coords = generateCoordinates(
        item.id,
        normalizedDistrict,
        item.konum || "",
      );

      return {
        id: item.id,
        position: coords,
        title: item.baslik || "İlan",
        price: item.fiyat
          ? `${item.fiyat.toLocaleString("tr-TR")} ₺`
          : "Fiyat belirtilmemiş",
        location: item.konum || "",
        image: item.resim || "",
        link: item.link || "",
        category: item.category || "",
        transaction: item.transaction || "",
        m2: item.m2 || "",
        district: item.ilce || "",
        markerColor: item.transaction === "satilik" ? "blue" : "red",
      };
    });

    const stats = {
      total: markers.length,
      satilik: markers.filter((m) => m.transaction === "satilik").length,
      kiralik: markers.filter((m) => m.transaction === "kiralik").length,
      categories: {
        konut: markers.filter((m) => m.category === "konut").length,
        arsa: markers.filter((m) => m.category === "arsa").length,
        isyeri: markers.filter((m) => m.category === "isyeri").length,
        bina: markers.filter((m) => m.category === "bina").length,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        markers,
        stats,
        filters: {
          district,
          category: category || "all",
          transaction: transaction || "all",
        },
      },
    });
  } catch (error: any) {
    console.error("Map data error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Harita verileri alınamadı" },
      { status: 500 },
    );
  }
}
