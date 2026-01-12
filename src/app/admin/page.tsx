import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { db } from "@/db";
import { listings, appointments, contacts, valuations } from "@/db/schema";
import { eq, sql, or, isNull } from "drizzle-orm";
import { AnalyticsWidget } from "@/components/admin/analytics-widget";
import { ListingAnalyticsWidget } from "@/components/admin/listing-analytics-widget";

async function getDashboardStats() {
  const [totalListings] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings);

  const [activeListings] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings)
    .where(eq(listings.status, "active"));

  const [pendingAppointments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      or(
        eq(appointments.status, "pending"),
        eq(appointments.status, "confirmed")
      )
    );

  const [newMessages] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.status, "new"));

  const [pendingValuations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(valuations)
    .where(isNull(valuations.estimatedValue));

  return {
    totalListings: Number(totalListings?.count || 0),
    activeListings: Number(activeListings?.count || 0),
    pendingAppointments: Number(pendingAppointments?.count || 0),
    newMessages: Number(newMessages?.count || 0),
    pendingValuations: Number(pendingValuations?.count || 0),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statsData = [
    {
      label: "Aktif İlan",
      value: stats.activeListings.toString(),
      icon: "real_estate_agent",
      color: "text-emerald-400",
      href: "/admin/ilanlar",
    },
    {
      label: "Bekleyen Randevu",
      value: stats.pendingAppointments.toString(),
      icon: "calendar_month",
      color: "text-yellow-400",
      href: "/admin/randevular",
    },
    {
      label: "Yeni Mesaj",
      value: stats.newMessages.toString(),
      icon: "mail",
      color: "text-blue-400",
      href: "/admin/mesajlar",
    },
    {
      label: "Değerleme Talebi",
      value: stats.pendingValuations.toString(),
      icon: "calculate",
      color: "text-purple-400",
      href: "/admin/degerlemeler",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight uppercase">
            Genel Bakış
          </h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Canlı İzleme Aktif
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-slate-500"
          >
            Yenile
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-slate-800 border border-slate-700 p-4 rounded-lg hover:border-emerald-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">
                {stat.label}
              </p>
              <Icon name={stat.icon} className={`${stat.color} text-lg`} />
            </div>
            <p className="text-2xl font-mono text-white group-hover:text-emerald-400 transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget />
        <ListingAnalyticsWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/ilanlar/yeni"
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all group"
        >
          <Icon
            name="add_circle"
            className="text-emerald-400 text-2xl mb-2 group-hover:scale-110 transition-transform"
          />
          <p className="text-white font-medium text-sm">Yeni İlan Ekle</p>
          <p className="text-slate-500 text-xs">Hızlı ilan oluştur</p>
        </Link>
        <Link
          href="/admin/randevular"
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all group"
        >
          <Icon
            name="event"
            className="text-blue-400 text-2xl mb-2 group-hover:scale-110 transition-transform"
          />
          <p className="text-white font-medium text-sm">Randevu Takvimi</p>
          <p className="text-slate-500 text-xs">Tüm randevuları gör</p>
        </Link>
        <Link
          href="/admin/degerlemeler"
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all group"
        >
          <Icon
            name="auto_awesome"
            className="text-purple-400 text-2xl mb-2 group-hover:scale-110 transition-transform"
          />
          <p className="text-white font-medium text-sm">AI Değerleme</p>
          <p className="text-slate-500 text-xs">Talepleri yönet</p>
        </Link>
        <Link
          href="/admin/ilan-analitik"
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all group"
        >
          <Icon
            name="insights"
            className="text-orange-400 text-2xl mb-2 group-hover:scale-110 transition-transform"
          />
          <p className="text-white font-medium text-sm">İlan Analitikleri</p>
          <p className="text-slate-500 text-xs">Detaylı performans</p>
        </Link>
      </div>
    </div>
  );
}
