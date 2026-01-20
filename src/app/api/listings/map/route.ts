import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Hendek Neighborhood Coordinates (Approximate Centers)
// Hendek Neighborhood Coordinates (Approximate Centers)
const HENDEK_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // Merkez Mahalleler
  Başpınar: { lat: 40.793, lng: 30.742 },
  Kemaliye: { lat: 40.796, lng: 30.748 },
  "Yeni Mah": { lat: 40.801, lng: 30.735 },
  Yeni: { lat: 40.801, lng: 30.735 },
  Rasimpaşa: { lat: 40.798, lng: 30.755 },
  Mahmutbey: { lat: 40.8, lng: 30.745 },
  Turanlar: { lat: 40.805, lng: 30.72 },
  Akova: { lat: 40.81, lng: 30.71 },
  Dereboğazı: { lat: 40.79, lng: 30.75 },
  Köprübaşı: { lat: 40.785, lng: 30.76 },
  Sarıdede: { lat: 40.792, lng: 30.73 },
  Bayraktepe: { lat: 40.788, lng: 30.74 },
  Büyükdere: { lat: 40.785, lng: 30.73 },
  Yeşilköy: { lat: 40.815, lng: 30.725 },

  // Belde/Büyük Köyler
  Çamlıca: { lat: 40.82, lng: 30.8 },
  Yeşilyurt: { lat: 40.85, lng: 30.85 },
  Puna: { lat: 40.83, lng: 30.7 },
  Ortaköy: { lat: 40.83, lng: 30.7 },
  Kargalı: { lat: 40.77, lng: 30.7 }, // Kargalıhanbaba/Yeniköy
  Uzuncaorman: { lat: 40.76, lng: 30.68 },
  Nuriye: { lat: 40.815, lng: 30.68 },
  Kazımiye: { lat: 40.825, lng: 30.65 },
  Sivritepe: { lat: 40.84, lng: 30.62 },
  Kurtköy: { lat: 40.85, lng: 30.72 },
  Yukarıhüseyinşeyh: { lat: 40.85, lng: 30.75 },
  Çağlayan: { lat: 40.86, lng: 30.76 },
  Hacıkışla: { lat: 40.87, lng: 30.77 },
  Sümbüllü: { lat: 40.88, lng: 30.78 },
  Kocatöngel: { lat: 40.9, lng: 30.8 },
  Soğuksu: { lat: 40.89, lng: 30.75 },

  // Diğer Köyler
  Dikmen: { lat: 40.7, lng: 30.85 }, // Yüksek
  Aksu: { lat: 40.68, lng: 30.82 },
  Göksu: { lat: 40.69, lng: 30.8 },
  Kurtuluş: { lat: 40.75, lng: 30.78 },
  Martinler: { lat: 40.82, lng: 30.6 },
  Lütfiyeköşk: { lat: 40.83, lng: 30.58 },
  Kırktepe: { lat: 40.84, lng: 30.55 },
  Güldibi: { lat: 40.795, lng: 30.76 },
};

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  try {
    const { data: listings, error } = await supabase
      .from("sahibinden_liste")
      .select(
        "id, baslik, fiyat, konum, resim, koordinatlar, category, transaction",
      )
      .order("id", { ascending: false })
      .limit(1000);

    if (error) throw error;

    const mappedListings = listings.map((item) => {
      let lat = null;
      let lng = null;

      let isExact = false;

      // 1. Check explicit coordinates column
      if (item.koordinatlar && item.koordinatlar.lat && item.koordinatlar.lng) {
        lat = parseFloat(item.koordinatlar.lat);
        lng = parseFloat(item.koordinatlar.lng);
        isExact = true;
      }
      // 2. Fallback to Neighborhood Mapping
      else if (item.konum) {
        // Normalize: "MerkezYeni Mah." -> "Yeni"
        // "KöylerYukarıhüseyinşeyh Mh." -> "Yukarıhüseyinşeyh"
        // Try to find matching key in HENDEK_LOCATIONS
        for (const [key, coords] of Object.entries(HENDEK_LOCATIONS)) {
          if (item.konum.includes(key)) {
            // Add some random jitter so they don't stack perfectly
            lat = coords.lat + (Math.random() - 0.5) * 0.002;
            lng = coords.lng + (Math.random() - 0.5) * 0.002;
            break;
          }
        }
      }

      // 3. Fallback to Hendek Center (with heavy jitter)
      if (!lat) {
        lat = 40.795 + (Math.random() - 0.5) * 0.05;
        lng = 30.745 + (Math.random() - 0.5) * 0.05;
      }

      return {
        id: item.id,
        title: item.baslik,
        price: item.fiyat,
        latitude: lat,
        longitude: lng,
        thumbnail: item.resim, // Or parse if it's JSONB array
        location: item.konum,
        type: item.transaction || "Satılık",
        category: item.category,
        slug: `ilan-${item.id}`, // Mock slug
        isExact: isExact,
      };
    });

    return NextResponse.json(mappedListings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
