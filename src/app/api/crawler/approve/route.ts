import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectedListings, listings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// Slug oluştur (title'dan)
function createSlug(title: string, sourceId: string): string {
  const base = title
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 100);
  return `${base}-${sourceId}`;
}

// Kategori mapping (collected → listings schema)
const categoryToType: Record<
  string,
  "sanayi" | "tarim" | "konut" | "ticari" | "arsa"
> = {
  konut: "konut",
  isyeri: "ticari",
  arsa: "arsa",
  bina: "ticari",
};

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "ID listesi gerekli" },
        { status: 400 },
      );
    }

    // Onaylanacak ilanları al
    const toApprove = await db
      .select()
      .from(collectedListings)
      .where(inArray(collectedListings.id, ids));

    if (toApprove.length === 0) {
      return NextResponse.json(
        { success: false, error: "İlan bulunamadı" },
        { status: 404 },
      );
    }

    // Ana listings tablosuna aktar
    const insertedListings: string[] = [];

    for (const collected of toApprove) {
      // Address oluştur
      const addressParts = [
        collected.neighborhood,
        collected.district,
        collected.city,
      ].filter(Boolean);

      const address =
        addressParts.length > 0
          ? addressParts.join(", ")
          : collected.location || "Hendek, Sakarya";

      // Listing'e dönüştür
      const newListing = {
        title: collected.title,
        slug: createSlug(collected.title, collected.sourceId),
        description: collected.description || "",
        type: categoryToType[collected.category] || "konut",
        status: "active" as const,
        transactionType:
          collected.transactionType === "satilik"
            ? ("sale" as const)
            : ("rent" as const),
        address: address,
        city: collected.city || "Hendek",
        district: collected.district || "Hendek",
        neighborhood: collected.neighborhood || "",
        area: collected.area || 0,
        price: String(collected.priceValue || 0),
        isFeatured: false,
        images: collected.images || [],
        features: {
          ...collected.features,
          sourceUrl: collected.sourceUrl,
          sourceId: collected.sourceId,
        },
      };

      const [inserted] = await db
        .insert(listings)
        .values(newListing)
        .returning({ id: listings.id });

      insertedListings.push(inserted.id);

      // Collected listing'i güncelle
      await db
        .update(collectedListings)
        .set({
          status: "approved",
          approvedAt: new Date(),
          processedAt: new Date(),
          listingId: inserted.id,
        })
        .where(eq(collectedListings.id, collected.id));
    }

    return NextResponse.json({
      success: true,
      approved: insertedListings.length,
      listingIds: insertedListings,
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    );
  }
}
