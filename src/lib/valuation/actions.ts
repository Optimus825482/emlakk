import { db } from "@/db";
import { valuations, NewValuation } from "@/db/schema/valuations";
import { LocationPoint, PropertyFeatures, ValuationResult } from "./types";
import { eq } from "drizzle-orm";

/**
 * Mülk değerleme talebini ve sonucunu veritabanına kaydeder.
 */
export async function saveValuationRequest(
  userInfo: { name: string; email: string; phone: string },
  location: LocationPoint,
  features: PropertyFeatures,
  result: ValuationResult,
  ip?: string,
  userAgent?: string,
) {
  try {
    const newValuation: NewValuation = {
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      propertyType: features.propertyType as any,
      address: location.address || "Belirtilmedi",
      city: "Sakarya", // Varsayılan veya location'dan alınabilir
      district: location.ilce || "Hendek",
      area: features.area,
      details: {
        ...features,
        lat: location.lat,
        lng: location.lng,
        mahalle: location.mahalle,
      },
      estimatedValue: Math.min(result.estimatedValue, 999999999).toString(),
      minValue: Math.min(result.priceRange.min, 999999999).toString(),
      maxValue: Math.min(result.priceRange.max, 999999999).toString(),
      pricePerSqm: Math.min(result.pricePerM2, 999999).toString(),

      confidenceScore: Math.round(result.confidenceScore).toString(), // 0-100 arası tam sayı olarak saklayalım (Schema decimal beklediği için string)
      marketAnalysis: result.aiInsights,
      comparables: result.comparableProperties,
      trends: result.marketAnalysis as any,
      ipAddress: ip,
      userAgent: userAgent,
    };

    const inserted = await db
      .insert(valuations)
      .values(newValuation)
      .returning();
    console.log(`✅ Değerleme kaydedildi: ${inserted[0].id}`);
    return inserted[0];
  } catch (error) {
    console.error("❌ Değerleme kaydedilirken hata:", error);
    // Hatanın değerleme sonucunu döndürmeyi engellemesine izin vermiyoruz, sadece logluyoruz
    return null;
  }
}

/**
 * Belirli bir değerlemeyi siler.
 */
export async function deleteValuation(id: string) {
  try {
    await db.delete(valuations).where(eq(valuations.id, id));
    return { success: true };
  } catch (error) {
    console.error("❌ Değerleme silinirken hata:", error);
    throw error;
  }
}
