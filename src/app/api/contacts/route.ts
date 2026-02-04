import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { createContactSchema, contactQuerySchema } from "@/lib/validations";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { notifyNewContact } from "@/lib/notification-helper";
import { withAdmin } from "@/lib/api-auth";

/**
 * GET /api/contacts
 * List all contact messages with filtering and pagination
 * Security: Admin only
 */
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = contactQuerySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json(
        {
          error: "Geçersiz sorgu parametreleri",
          details: query.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = query.data;

    // Build where conditions
    const conditions = [];

    if (status) conditions.push(eq(contacts.status, status));
    if (startDate)
      conditions.push(gte(contacts.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(contacts.createdAt, new Date(endDate)));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(contacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contacts.createdAt))
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
    console.error("Contacts GET error:", error);
    return NextResponse.json(
      { error: "Mesajlar yüklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

// Export GET with admin protection
export const GET = withAdmin(getHandler);

/**
 * POST /api/contacts
 * Create a new contact message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    const [newContact] = await db
      .insert(contacts)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        listingId: data.listingId,
        status: "new",
      })
      .returning();

    // Admin paneline bildirim gönder
    notifyNewContact(newContact.id, data.name, data.subject);

    return NextResponse.json(
      {
        data: newContact,
        message:
          "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json(
      { error: "Mesaj gönderilirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
