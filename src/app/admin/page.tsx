import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { db } from "@/db";
import { listings, appointments, contacts, valuations } from "@/db/schema";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

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

  return {
    totalListings: Number(totalListings?.count || 0),
    activeListings: Number(activeListings?.count || 0),
    pendingAppointments: Number(pendingAppointments?.count || 0),
    newMessages: Number(newMessages?.count || 0),
  };
}

async function getRecentAppointments() {
  return await db
    .select()
    .from(appointments)
    .where(
      or(
        eq(appointments.status, "pending"),
        eq(appointments.status, "confirmed")
      )
    )
    .orderBy(desc(appointments.date), desc(appointments.time))
    .limit(3);
}

async function getRecentMessages() {
  return await db
    .select()
    .from(contacts)
    .where(eq(contacts.isSpam, false))
    .orderBy(desc(contacts.createdAt))
    .limit(3);
}

async function getRecentValuations() {
  return await db
    .select()
    .from(valuations)
    .orderBy(desc(valuations.createdAt))
    .limit(3);
}

function formatAppointmentDate(date: string, time: string): string {
  const appointmentDate = new Date(`${date}T${time}`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const aptDate = new Date(date);

  if (aptDate.getTime() === today.getTime()) {
    return `Bugün ${time.slice(0, 5)}`;
  } else if (aptDate.getTime() === tomorrow.getTime()) {
    return `Yarın ${time.slice(0, 5)}`;
  } else {
    return `${aptDate.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    })} ${time.slice(0, 5)}`;
  }
}

function getAppointmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    kahve: "Kahve Sohbeti",
    property_visit: "Mülk Gezisi",
    valuation: "Değerleme",
    consultation: "Danışmanlık",
  };
  return labels[type] || type;
}

function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sanayi: "Sanayi",
    tarim: "Tarım",
    konut: "Konut",
    ticari: "Ticari",
    arsa: "Arsa",
  };
  return labels[type] || type;
}

export default async function AdminDashboardPage() {
  const [stats, recentAppointments, recentMessages, recentValuations] =
    await Promise.all([
      getDashboardStats(),
      getRecentAppointments(),
      getRecentMessages(),
      getRecentValuations(),
    ]);

  const statsData = [
    {
      label: "Toplam İlan",
      value: stats.totalListings.toString(),
      icon: "real_estate_agent",
      color: "text-white",
    },
    {
      label: "Aktif İlan",
      value: stats.activeListings.toString(),
      icon: "check_circle",
      color: "text-emerald-400",
    },
    {
      label: "Bekleyen Randevu",
      value: stats.pendingAppointments.toString(),
      icon: "calendar_month",
      color: "text-yellow-400",
    },
    {
      label: "Yeni Mesaj",
      value: stats.newMessages.toString(),
      icon: "mail",
      color: "text-blue-400",
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
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20">
            Rapor Oluştur
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 border border-slate-700 p-4 rounded-lg hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider">
                {stat.label}
              </p>
              <Icon name={stat.icon} className={`${stat.color} text-lg`} />
            </div>
            <p className="text-2xl font-mono text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="calendar_month" className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                Randevular
              </h3>
            </div>
            <Link
              href="/admin/randevular"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="space-y-3">
            {recentAppointments.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Bekleyen randevu yok
              </p>
            ) : (
              recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded bg-slate-900/50 border border-slate-700/50"
                >
                  <div>
                    <p className="text-sm text-white font-medium">{apt.name}</p>
                    <p className="text-xs text-slate-400">
                      {getAppointmentTypeLabel(apt.type)} •{" "}
                      {formatAppointmentDate(apt.date, apt.time)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded ${
                      apt.status === "confirmed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {apt.status === "confirmed" ? "Onaylı" : "Bekliyor"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="mail" className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                Mesajlar
              </h3>
            </div>
            <Link
              href="/admin/mesajlar"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="space-y-3">
            {recentMessages.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Henüz mesaj yok
              </p>
            ) : (
              recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-center justify-between p-3 rounded border ${
                    msg.status === "new"
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-slate-900/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {msg.status === "new" && (
                      <span className="size-2 rounded-full bg-emerald-400" />
                    )}
                    <div>
                      <p className="text-sm text-white font-medium">
                        {msg.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {msg.subject || "Konu belirtilmemiş"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Valuation Requests */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="calculate" className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                Değerlemeler
              </h3>
            </div>
            <Link
              href="/admin/degerlemeler"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="space-y-3">
            {recentValuations.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Değerleme talebi yok
              </p>
            ) : (
              recentValuations.map((val) => (
                <div
                  key={val.id}
                  className="flex items-center justify-between p-3 rounded bg-slate-900/50 border border-slate-700/50"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {getPropertyTypeLabel(val.propertyType)} - {val.area}m²
                    </p>
                    <p className="text-xs text-slate-400">{val.address}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded ${
                      val.estimatedValue
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {val.estimatedValue ? "Tamamlandı" : "Bekliyor"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
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
          href="/admin/analitik"
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all group"
        >
          <Icon
            name="analytics"
            className="text-orange-400 text-2xl mb-2 group-hover:scale-110 transition-transform"
          />
          <p className="text-white font-medium text-sm">Analitik</p>
          <p className="text-slate-500 text-xs">Performans raporları</p>
        </Link>
      </div>
    </div>
  );
}
