import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/team
 * Get all team members
 */
export async function GET() {
  try {
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      .orderBy(asc(teamMembers.sortOrder));

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      { error: "Ekip üyeleri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team
 * Create new team member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [newMember] = await db
      .insert(teamMembers)
      .values({
        name: body.name,
        title: body.title,
        bio: body.bio,
        image: body.image,
        phone: body.phone,
        email: body.email,
        socialMedia: body.socialMedia,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder,
      })
      .returning();

    return NextResponse.json(
      { data: newMember, message: "Ekip üyesi eklendi" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team POST error:", error);
    return NextResponse.json(
      { error: "Ekip üyesi eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
