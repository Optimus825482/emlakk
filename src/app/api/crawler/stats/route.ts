import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Toplam istatistikler
    const [totalStats] = await db.execute(sql`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN category = 'konut' AND transaction = 'satilik' THEN 1 END) as konut_satilik,
        COUNT(CASE WHEN category = 'konut' AND transaction = 'kiralik' THEN 1 END) as konut_kiralik,
        COUNT(CASE WHEN category = 'arsa' AND transaction = 'satilik' THEN 1 END) as arsa_satilik,
        COUNT(CASE WHEN category = 'isyeri' AND transaction = 'satilik' THEN 1 END) as isyeri_satilik,
        COUNT(CASE WHEN category = 'isyeri' AND transaction = 'kiralik' THEN 1 END) as isyeri_kiralik,
        MAX(tarih) as last_crawl_date
      FROM sahibinden_liste
    `);

    // Yeni ilanlar (bugün/dün)
    const [newListings] = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM new_listings
      WHERE first_seen_at >= NOW() - INTERVAL '2 days'
    `);

    // Kaldırılan ilanlar (son 7 gün)
    const [removedListings] = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM removed_listings
      WHERE removed_at >= NOW() - INTERVAL '7 days'
    `);

    // Kategori bazlı stats
    const categoryStats = await db.execute(sql`
      SELECT 
        category,
        transaction,
        COUNT(*) as count,
        AVG(CAST(REPLACE(REPLACE(fiyat, '.', ''), ' TL', '') AS NUMERIC)) as avg_price
      FROM sahibinden_liste
      WHERE fiyat IS NOT NULL AND fiyat != ''
      GROUP BY category, transaction
      ORDER BY category, transaction
    `);

    return NextResponse.json({
      success: true,
      data: {
        total: totalStats,
        newListings: newListings?.count || 0,
        removedListings: removedListings?.count || 0,
        categoryStats: categoryStats,
      },
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
