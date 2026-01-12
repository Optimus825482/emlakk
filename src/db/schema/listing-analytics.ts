import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { listings } from "./listings";

/**
 * İlan Görüntüleme Kayıtları
 * Her ilan görüntülemesi için detaylı veri
 */
export const listingViews = pgTable(
  "listing_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),

    // Ziyaretçi bilgileri
    visitorId: varchar("visitor_id", { length: 64 }), // Anonim cookie ID
    sessionId: varchar("session_id", { length: 64 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    // Cihaz & Tarayıcı
    deviceType: varchar("device_type", { length: 20 }), // mobile, tablet, desktop
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    screenResolution: varchar("screen_resolution", { length: 20 }),

    // Konum (IP tabanlı)
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    region: varchar("region", { length: 100 }),

    // Trafik kaynağı
    referrer: text("referrer"),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),

    // Etkileşim metrikleri
    duration: integer("duration"), // Saniye cinsinden sayfa süresi
    scrollDepth: integer("scroll_depth"), // Yüzde olarak scroll derinliği

    // Kullanıcı aksiyonları
    clickedPhone: boolean("clicked_phone").default(false),
    clickedWhatsapp: boolean("clicked_whatsapp").default(false),
    clickedEmail: boolean("clicked_email").default(false),
    clickedMap: boolean("clicked_map").default(false),
    clickedGallery: boolean("clicked_gallery").default(false),
    clickedShare: boolean("clicked_share").default(false),
    addedToFavorites: boolean("added_to_favorites").default(false),
    requestedAppointment: boolean("requested_appointment").default(false),

    // Zaman
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (table) => [
    index("listing_views_listing_id_idx").on(table.listingId),
    index("listing_views_visitor_id_idx").on(table.visitorId),
    index("listing_views_viewed_at_idx").on(table.viewedAt),
  ]
);

/**
 * İlan Günlük İstatistikleri (Aggregated)
 * Performans için günlük özet veriler
 */
export const listingDailyStats = pgTable(
  "listing_daily_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD

    // Temel metrikler
    views: integer("views").default(0),
    uniqueVisitors: integer("unique_visitors").default(0),
    avgDuration: integer("avg_duration").default(0),
    avgScrollDepth: integer("avg_scroll_depth").default(0),

    // Cihaz dağılımı
    mobileViews: integer("mobile_views").default(0),
    desktopViews: integer("desktop_views").default(0),
    tabletViews: integer("tablet_views").default(0),

    // Aksiyonlar
    phoneClicks: integer("phone_clicks").default(0),
    whatsappClicks: integer("whatsapp_clicks").default(0),
    emailClicks: integer("email_clicks").default(0),
    mapClicks: integer("map_clicks").default(0),
    galleryClicks: integer("gallery_clicks").default(0),
    shareClicks: integer("share_clicks").default(0),
    favoriteAdds: integer("favorite_adds").default(0),
    appointmentRequests: integer("appointment_requests").default(0),

    // Trafik kaynakları (JSON)
    trafficSources: jsonb("traffic_sources").$type<Record<string, number>>(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("listing_daily_stats_listing_date_idx").on(
      table.listingId,
      table.date
    ),
  ]
);

// Types
export type ListingView = typeof listingViews.$inferSelect;
export type NewListingView = typeof listingViews.$inferInsert;
export type ListingDailyStat = typeof listingDailyStats.$inferSelect;
export type NewListingDailyStat = typeof listingDailyStats.$inferInsert;
