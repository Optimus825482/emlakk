import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema";
import { sql } from "drizzle-orm";

async function getSahibindenStats() {
  try {
    const [totalResult, lastUpdateResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(sahibindenListe),
      db
        .select({ lastUpdate: sql<string>`MAX(crawled_at)` })
        .from(sahibindenListe),
    ]);

    return {
      total: Number(totalResult[0]?.count || 0),
      lastUpdate: lastUpdateResult[0]?.lastUpdate || null,
    };
  } catch (error) {
    console.error("Sahibinden stats error:", error);
    return { total: 0, lastUpdate: null };
  }
}

export async function SahibindenStatsWidget() {
  const stats = await getSahibindenStats();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Bilinmiyor";
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link
      href="/admin/sahibinden-ilanlar"
      className="group relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/30 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Icon
                name="real_estate_agent"
                className="text-2xl text-blue-400"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Sahibinden.com</h3>
              <p className="text-slate-400 text-xs">Hendek İlanları</p>
            </div>
          </div>
          <Icon
            name="arrow_forward"
            className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
              {stats.total.toLocaleString("tr-TR")}
            </span>
            <span className="text-slate-400 text-sm">toplam ilan</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Icon name="schedule" className="text-slate-500 text-base" />
            <span className="text-slate-400">Son güncelleme:</span>
            <span className="text-slate-300 font-medium">
              {formatDate(stats.lastUpdate)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
              <Icon name="visibility" className="text-base" />
              <span>Detaylı listele ve filtrele</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
