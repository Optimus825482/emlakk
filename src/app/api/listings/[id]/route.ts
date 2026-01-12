import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugify, calculatePricePerSqm } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/listings/[id]
 * Get a single listing by ID or slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // UUID formatı kontrolü
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    const [listing] = await db
      .select()
      .from(listings)
      .where(isUUID ? eq(listings.id, id) : eq(listings.slug, id))
      .limit(1);

    if (!listing) {
      return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: listing });
  } catch (error) {
    console.error("Listing GET error:", error);
    return NextResponse.json(
      { error: "İlan yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listings/[id]
 * Update a listing
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Mevcut ilanı kontrol et
    const [existing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
    }

    // Güncellenecek alanları hazırla
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Basit alanlar
    const simpleFields = [
      "title",
      "description",
      "type",
      "status",
      "transactionType",
      "address",
      "city",
      "district",
      "neighborhood",
      "latitude",
      "longitude",
      "aiScore",
      "aiInsight",
      "roiEstimate",
      "thumbnail",
      "videoUrl",
      "metaTitle",
      "metaDescription",
      "isFeatured",
      "isNew",
    ];

    for (const field of simpleFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Slug güncelleme (başlık değiştiyse)
    if (body.title && body.title !== existing.title) {
      const baseSlug = slugify(body.title);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const [existingSlug] = await db
          .select({ id: listings.id })
          .from(listings)
          .where(eq(listings.slug, slug))
          .limit(1);

        if (!existingSlug || existingSlug.id === id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Alan ve fiyat
    if (body.area !== undefined) {
      updateData.area = parseInt(body.area);
    }
    if (body.price !== undefined) {
      updateData.price = body.price.toString();
    }

    // Fiyat/m² hesapla
    const newArea =
      body.area !== undefined ? parseInt(body.area) : existing.area;
    const newPrice =
      body.price !== undefined
        ? parseFloat(body.price)
        : parseFloat(existing.price);
    updateData.pricePerSqm = calculatePricePerSqm(newPrice, newArea).toString();

    // Görseller
    if (body.images !== undefined) {
      updateData.images = body.images;
    }

    // Özellikler (features)
    if (body.features !== undefined) {
      updateData.features = body.features;
    }

    // Yayın tarihi
    if (body.status === "active" && existing.status !== "active") {
      updateData.publishedAt = new Date();
    }
    if (body.status === "sold" && existing.status !== "sold") {
      updateData.soldAt = new Date();
    }

    const [updated] = await db
      .update(listings)
      .set(updateData)
      .where(eq(listings.id, id))
      .returning();

    return NextResponse.json({
      data: updated,
      message: "İlan başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Listing PATCH error:", error);
    return NextResponse.json(
      { error: "İlan güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * Delete a listing
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning({ id: listings.id });

    if (!deleted) {
      return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      message: "İlan başarıyla silindi",
    });
  } catch (error) {
    console.error("Listing DELETE error:", error);
    return NextResponse.json(
      { error: "İlan silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
