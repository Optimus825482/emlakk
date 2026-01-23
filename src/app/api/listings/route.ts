import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, type ListingType, type ListingStatus } from "@/db/schema";
import {
  createListingSchema,
  listingQuerySchema,
  type CreateListing,
} from "@/lib/validations";
import { slugify, calculatePricePerSqm } from "@/lib/utils";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { triggerListingDescription } from "@/lib/workflow-trigger";
import { triggerSeoGeneration } from "@/lib/seo-trigger";
import { log, captureError } from "@/lib/monitoring";
import { withAdmin } from "@/lib/api-auth";

const SORTABLE_COLUMNS = {
  createdAt: listings.createdAt,
  updatedAt: listings.updatedAt,
  price: listings.price,
  area: listings.area,
  title: listings.title,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = listingQuerySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json(
        {
          error: "Geçersiz sorgu parametreleri",
          details: query.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      type,
      status,
      transactionType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      isFeatured,
      search,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query.data;

    const conditions = [];

    if (type) conditions.push(eq(listings.type, type as ListingType));
    // Status filtresi sadece belirtilmişse uygula (admin tüm ilanları görebilmeli)
    if (status) conditions.push(eq(listings.status, status as ListingStatus));
    if (transactionType)
      conditions.push(
        eq(listings.transactionType, transactionType as "sale" | "rent"),
      );
    if (minPrice) conditions.push(gte(listings.price, minPrice.toString()));
    if (maxPrice) conditions.push(lte(listings.price, maxPrice.toString()));
    if (minArea) conditions.push(gte(listings.area, parseInt(minArea)));
    if (maxArea) conditions.push(lte(listings.area, parseInt(maxArea)));
    if (isFeatured !== undefined)
      conditions.push(eq(listings.isFeatured, isFeatured));
    if (search) {
      conditions.push(
        sql`(${listings.title} ILIKE ${`%${search}%`} OR ${
          listings.address
        } ILIKE ${`%${search}%`})`,
      );
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    const offset = (page - 1) * limit;
    const sortKey = sortBy as keyof typeof SORTABLE_COLUMNS;
    const orderColumn = SORTABLE_COLUMNS[sortKey] || listings.createdAt;
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const results = await db
      .select()
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + results.length < total,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      await captureError(error, { module: "listings-api", method: "GET" });
    }
    return NextResponse.json(
      { error: "İlanlar yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();

    const validation = createListingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.slug, slug))
        .limit(1);

      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const pricePerSqm = calculatePricePerSqm(
      data.price,
      data.area || 0,
    ).toString();

    const insertData = {
      title: data.title,
      description: data.description,
      type: data.type,
      transactionType: data.transactionType,
      price: data.price.toString(),
      area: data.area || 0,
      address: data.address || "",
      city: data.city,
      district: data.district,
      neighborhood: data.neighborhood,
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
      features: data.features || undefined,
      images: data.images,
      thumbnail: data.thumbnail,
      isFeatured: data.isFeatured,
      slug,
      pricePerSqm,
      status: data.status,
    };

    const [newListing] = await db
      .insert(listings)
      .values(insertData)
      .returning();

    if (!data.description || data.description.trim() === "") {
      triggerListingDescription(newListing.id);
    }

    triggerSeoGeneration({
      entityType: "listing",
      entityId: newListing.id,
      title: newListing.title,
      content: newListing.description || newListing.title,
      location: newListing.address || undefined,
      category: newListing.type,
      price: parseInt(newListing.price) || undefined,
      features: Object.values(newListing.features || {}).filter(
        (v): v is string => typeof v === "string",
      ),
    });

    log("info", "Ilan olusturuldu", {
      module: "listings-api",
      listingId: newListing.id,
    });

    return NextResponse.json(
      { data: newListing, message: "Ilan basariyla olusturuldu" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      await captureError(error, { module: "listings-api", method: "POST" });
    }
    return NextResponse.json(
      { error: "Ilan olusturulurken bir hata olustu" },
      { status: 500 },
    );
  }
});
