import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { db } from "@/db";
import { listings, appointments, contacts, valuations } from "@/db/schema";
import { eq, sql, or, isNull, desc, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { AdminDashboardWidgets } from "@/components/admin/admin-dashboard-widgets";

// Dashboard istatistikleri
async function getDashboardStats() {
  try {
    const [
      totalListingsResult,
      activeListingsResult,
      pendingAppointmentsResult,
      newMessagesResult,
      pendingValuationsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(listings),
      db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.status, "active")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          or(
            eq(appointments.status, "pending"),
            eq(appointments.status, "confirmed"),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(eq(contacts.status, "new")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(valuations)
        .where(isNull(valuations.estimatedValue)),
    ]);

    const totalListings = totalListingsResult[0];
    const activeListings = activeListingsResult[0];
    const pendingAppointments = pendingAppointmentsResult[0];
    const newMessages = newMessagesResult[0];
    const pendingValuations = pendingValuationsResult[0];

    return {
      totalListings: Number(totalListings?.count || 0),
      activeListings: Number(activeListings?.count || 0),
      pendingAppointments: Number(pendingAppointments?.count || 0),
      newMessages: Number(newMessages?.count || 0),
      pendingValuations: Number(pendingValuations?.count || 0),
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return {
      totalListings: 0,
      activeListings: 0,
      pendingAppointments: 0,
      newMessages: 0,
      pendingValuations: 0,
    };
  }
}

// Son mesajlar
async function getRecentMessages() {
  try {
    return await db
      .select({
        id: contacts.id,
        name: contacts.name,
        subject: contacts.subject,
        message: contacts.message,
        status: contacts.status,
        createdAt: contacts.createdAt,
      })
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

// Yaklaşan randevular
async function getUpcomingAppointments() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db
      .select({
        id: appointments.id,
        name: appointments.name,
        type: appointments.type,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
      })
      .from(appointments)
      .where(gte(appointments.date, today.toISOString().split("T")[0]))
      .orderBy(appointments.date)
      .limit(5);
  } catch {
    return [];
  }
}

// Son eklenen ilanlar (listingAnalytics tablosu olmadığı için basit sorgu)
async function getRecentListings() {
  try {
    return await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        type: listings.type,
        price: listings.price,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

// Tür etiketleri
const typeLabels: Record<string, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
  arsa: "Arsa",
};

const typeColors: Record<string, string> = {
  sanayi: "bg-blue-500",
  tarim: "bg-emerald-500",
  konut: "bg-orange-500",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

const appointmentTypeLabels: Record<string, string> = {
  kahve: "Kahve",
  property_visit: "Mülk Gezisi",
  valuation: "Değerleme",
  consultation: "Danışmanlık",
};

export default async function AdminDashboardPage() {
  const sessionPromise = auth();
  const statsPromise = getDashboardStats();
  const recentMessagesPromise = getRecentMessages();
  const upcomingAppointmentsPromise = getUpcomingAppointments();
  const recentListingsPromise = getRecentListings();

  const [session, stats, recentMessages, upcomingAppointments, recentListings] =
    await Promise.all([
      sessionPromise,
      statsPromise,
      recentMessagesPromise,
      upcomingAppointmentsPromise,
      recentListingsPromise,
    ]);

  // Bugünün tarihi
  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Aksiyon gerektiren toplam
  const actionRequired =
    stats.newMessages + stats.pendingAppointments + stats.pendingValuations;

  const statsData = [
    {
      label: "Aktif İlan",
      value: stats.activeListings,
      total: stats.totalListings,
      icon: "real_estate_agent",
      color: "emerald",
      href: "/admin/ilanlar",
    },
    {
      label: "Bekleyen Randevu",
      value: stats.pendingAppointments,
      icon: "calendar_month",
      color: "yellow",
      href: "/admin/randevular",
    },
    {
      label: "Yeni Mesaj",
      value: stats.newMessages,
      icon: "mail",
      color: "blue",
      href: "/admin/mesajlar",
    },
    {
      label: "Değerleme Talebi",
      value: stats.pendingValuations,
      icon: "calculate",
      color: "purple",
      href: "/admin/degerlemeler",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/30 border border-slate-700 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="size-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                Sistem Aktif
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Hoş Geldin,{" "}
              <span className="text-emerald-400">
                {session?.user?.name || "Admin"}
              </span>
            </h1>
            <p className="text-slate-400 mt-1">{dateStr}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {actionRequired > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
                <Icon
                  name="notification_important"
                  className="text-amber-400"
                />
                <span className="text-amber-400 text-sm font-medium">
                  {actionRequired} aksiyon bekliyor
                </span>
              </div>
            )}
            <Link
              href="/admin"
              className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600"
            >
              <Icon name="refresh" className="text-emerald-400" />
              Yenile
            </Link>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-transparent to-slate-700/50 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[stat.color]}`}
                >
                  <Icon name={stat.icon} className="text-lg" />
                </div>
                {stat.value > 0 && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[stat.color]}`}
                  >
                    +{stat.value}
                  </span>
                )}
              </div>
              <p className="text-3xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-lg text-slate-500">/{stat.total}</span>
                )}
              </p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Sahibinden.com Stats Widget & Analytics Row */}
      <AdminDashboardWidgets />

      {/* Middle Section - 3 Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Icon name="mail" className="text-blue-400" />
              <h3 className="font-bold text-white">Son Mesajlar</h3>
            </div>
            <Link
              href="/admin/mesajlar"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="inbox" className="text-3xl text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">Mesaj yok</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href="/admin/mesajlar"
                  className="flex items-start gap-3 p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      msg.status === "new" ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-medium truncate">
                        {msg.name}
                      </p>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs truncate mt-0.5">
                      {msg.subject || msg.message?.substring(0, 50)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Icon name="calendar_month" className="text-yellow-400" />
              <h3 className="font-bold text-white">Yaklaşan Randevular</h3>
            </div>
            <Link
              href="/admin/randevular"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Icon
                  name="event_busy"
                  className="text-3xl text-slate-600 mb-2"
                />
                <p className="text-slate-500 text-sm">Randevu yok</p>
              </div>
            ) : (
              upcomingAppointments.map((apt) => (
                <Link
                  key={apt.id}
                  href="/admin/randevular"
                  className="flex items-start gap-3 p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {new Date(apt.date).toLocaleDateString("tr-TR", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {new Date(apt.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {apt.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{apt.time}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          apt.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {appointmentTypeLabels[apt.type] || apt.type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Son Eklenen İlanlar */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Icon name="add_home_work" className="text-orange-400" />
              <h3 className="font-bold text-white">Son Eklenen İlanlar</h3>
            </div>
            <Link
              href="/admin/ilanlar"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Tümü →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {recentListings.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="inbox" className="text-3xl text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">Henüz ilan yok</p>
              </div>
            ) : (
              recentListings.map((listing, i) => (
                <Link
                  key={listing.id}
                  href={`/admin/ilanlar/${listing.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {listing.type && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                            typeColors[listing.type] || "bg-slate-600"
                          }`}
                        >
                          {typeLabels[listing.type] || listing.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono text-sm font-bold">
                      {listing.price
                        ? `₺${(Number(listing.price) / 1000000).toFixed(1)}M`
                        : "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(listing.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          {
            href: "/admin/ilanlar/yeni",
            icon: "add_home_work",
            label: "Yeni İlan",
            color: "emerald",
          },
          {
            href: "/admin/randevular",
            icon: "event_note",
            label: "Randevular",
            color: "blue",
          },
          {
            href: "/admin/degerlemeler",
            icon: "auto_awesome",
            label: "AI Değerleme",
            color: "purple",
          },
          {
            href: "/admin/sosyal-medya",
            icon: "share",
            label: "Sosyal Medya",
            color: "pink",
          },
          {
            href: "/admin/seo",
            icon: "travel_explore",
            label: "SEO",
            color: "amber",
          },
          {
            href: "/admin/ayarlar",
            icon: "settings",
            label: "Ayarlar",
            color: "slate",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center justify-center bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-slate-700/50 transition-all"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                action.color === "emerald"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : action.color === "blue"
                    ? "bg-blue-500/10 text-blue-400"
                    : action.color === "purple"
                      ? "bg-purple-500/10 text-purple-400"
                      : action.color === "pink"
                        ? "bg-pink-500/10 text-pink-400"
                        : action.color === "amber"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-slate-700 text-slate-400"
              }`}
            >
              <Icon name={action.icon} className="text-2xl" />
            </div>
            <p className="text-white text-sm font-medium text-center">
              {action.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
