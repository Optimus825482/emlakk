import { NextResponse } from "next/server";
import { db } from "@/db";
import { neighborhoods } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ilce = searchParams.get("ilce");

    if (!ilce || ilce === "all") {
      return NextResponse.json(
        { success: false, error: "İlçe seçilmedi" },
        { status: 400 },
      );
    }

    const data = await db
      .select({
        id: neighborhoods.id,
        name: neighborhoods.name,
      })
      .from(neighborhoods)
      .where(eq(neighborhoods.district, ilce))
      .orderBy(asc(neighborhoods.name));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Neighborhoods fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Mahalleler alınamadı" },
      { status: 500 },
    );
  }
}
