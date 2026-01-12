import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { createListingSchema, listingQuerySchema } from "@/lib/validations";
import { slugify, calculatePricePerSqm } from "@/lib/utils";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";

/**
 * GET /api/listings
 * List all listings with filtering, pagination, and sorting
 */
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
        { status: 400 }
      );
    }

    const {
      type,
      status = "active",
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

    // Build where conditions
    const conditions = [];

    if (type) conditions.push(eq(listings.type, type));
    if (status) conditions.push(eq(listings.status, status));
    if (transactionType)
      conditions.push(eq(listings.transactionType, transactionType));
    if (minPrice) conditions.push(gte(listings.price, minPrice));
    if (maxPrice) conditions.push(lte(listings.price, maxPrice));
    if (minArea) conditions.push(gte(listings.area, parseInt(minArea)));
    if (maxArea) conditions.push(lte(listings.area, parseInt(maxArea)));
    if (isFeatured !== undefined)
      conditions.push(eq(listings.isFeatured, isFeatured));
    if (search) {
      conditions.push(
        sql`(${listings.title} ILIKE ${`%${search}%`} OR ${
          listings.address
        } ILIKE ${`%${search}%`})`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * limit;
    const orderColumn =
      listings[sortBy as keyof typeof listings] || listings.createdAt;
    const orderDirection = sortOrder === "asc" ? asc : desc;

    const results = await db
      .select()
      .from(listings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orderColumn as any))
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
    console.error("Listings GET error:", error);
    return NextResponse.json(
      { error: "İlanlar yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings
 * Create a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createListingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate slug from title
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
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

    // Calculate price per sqm
    const pricePerSqm = calculatePricePerSqm(data.price, data.area).toString();

    const [newListing] = await db
      .insert(listings)
      .values({
        ...data,
        slug,
        pricePerSqm,
        status: "draft",
      })
      .returning();

    return NextResponse.json(
      { data: newListing, message: "İlan başarıyla oluşturuldu" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Listings POST error:", error);
    return NextResponse.json(
      { error: "İlan oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
