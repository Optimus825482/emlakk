import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ilce = searchParams.get("ilce");

    // Base SQL query
    let query = sql`
      SELECT
        n.district,
        n.name as neighborhood,
        COUNT(CASE WHEN l.category = 'konut' AND l.transaction = 'satilik' THEN 1 END)::int as konut_satilik,
        COUNT(CASE WHEN l.category = 'konut' AND l.transaction = 'kiralik' THEN 1 END)::int as konut_kiralik,
        COUNT(CASE WHEN l.category = 'arsa' AND l.transaction = 'satilik' THEN 1 END)::int as arsa_satilik,
        COUNT(CASE WHEN l.category = 'isyeri' AND l.transaction = 'satilik' THEN 1 END)::int as isyeri_satilik,
        COUNT(CASE WHEN l.category = 'isyeri' AND l.transaction = 'kiralik' THEN 1 END)::int as isyeri_kiralik,
        COUNT(CASE WHEN l.category = 'bina' AND l.transaction = 'satilik' THEN 1 END)::int as bina_satilik,
        COUNT(l.id)::int as total
      FROM public.neighborhoods n
      LEFT JOIN public.sahibinden_liste l 
        ON l.konum ILIKE '%' || n.district || '%' 
        AND l.konum ILIKE '%' || n.name || '%'
    `;

    // Add district filter if present
    if (ilce && ilce !== "all") {
      query = sql`${query} WHERE n.district = ${ilce}`;
    }

    // Group and Order
    query = sql`${query} 
      GROUP BY n.district, n.name
      ORDER BY n.district, n.name ASC
    `;

    const data = await db.execute(query);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Neighborhood stats error:", error);
    return NextResponse.json(
      { success: false, error: "Mahalle raporu alınamadı" },
      { status: 500 },
    );
  }
}
