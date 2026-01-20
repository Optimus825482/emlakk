import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Sahibinden Kategorileri
export const collectedCategoryEnum = pgEnum("collected_category", [
  "konut",
  "isyeri",
  "arsa",
  "bina",
]);

// İşlem Türleri
export const collectedTransactionEnum = pgEnum("collected_transaction", [
  "satilik",
  "kiralik",
  "devren-satilik",
  "devren-kiralik",
  "kat-karsiligi",
]);

// İşlem Durumu
export const collectedStatusEnum = pgEnum("collected_status", [
  "pending", // Beklemede - henüz işlenmedi
  "approved", // Onaylandı - ana tabloya aktarıldı
  "rejected", // Reddedildi
  "duplicate", // Mükerrer kayıt
]);

// Toplanan İlanlar Tablosu
export const collectedListings = pgTable("collected_listings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Sahibinden bilgileri
  sourceId: varchar("source_id", { length: 50 }).notNull(), // Sahibinden ilan ID
  sourceUrl: text("source_url").notNull(),

  // Temel bilgiler
  title: varchar("title", { length: 500 }).notNull(),
  price: varchar("price", { length: 100 }), // "2.500.000 TL" formatında
  priceValue: decimal("price_value", { precision: 15, scale: 2 }), // Sayısal değer
  location: text("location"), // "Sakarya / Hendek / Merkez"
  date: varchar("date", { length: 50 }), // Sahibinden'deki tarih

  // Kategori ve işlem türü (eski - uyumluluk için)
  category: collectedCategoryEnum("category").notNull(),
  transactionType: collectedTransactionEnum("transaction_type").notNull(),

  // YENİ: Breadcrumb'dan gelen detaylı kategori bilgileri
  mainCategory: varchar("main_category", { length: 100 }), // Emlak, Vasıta, vb.
  subCategory: varchar("sub_category", { length: 100 }), // Konut, İş Yeri, Arsa, vb.
  propertyType: varchar("property_type", { length: 100 }), // Daire, Müstakil Ev, Villa, vb.

  // YENİ: Detaylı konum bilgileri (KRİTİK - Mahalle bazlı istatistik için)
  city: varchar("city", { length: 100 }), // Sakarya
  district: varchar("district", { length: 100 }), // Hendek
  neighborhood: varchar("neighborhood", { length: 200 }), // Yeni Mah., Merkez, vb. (ÖNEMLİ!)
  areaDetail: varchar("area_detail", { length: 200 }), // Beldeler, Köyler, vb.

  // YENİ: Tam breadcrumb JSON olarak
  breadcrumb: jsonb("breadcrumb").$type<string[]>(),

  // Durum
  status: collectedStatusEnum("status").notNull().default("pending"),

  // Medya
  thumbnail: text("thumbnail"),
  images: jsonb("images").$type<string[]>().default([]),

  // Detay bilgileri (crawl edilirse)
  description: text("description"),
  features: jsonb("features").$type<Record<string, string>>(),

  // Metrekare (özelliklerden çıkarılır)
  area: integer("area"),

  // Meta
  crawledAt: timestamp("crawled_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  approvedAt: timestamp("approved_at"),

  // Ana tabloya aktarıldıysa
  listingId: uuid("listing_id"), // listings tablosundaki ID

  // Notlar
  notes: text("notes"),

  // Duplicate detection
  duplicateOf: uuid("duplicate_of"), // Orijinal ilanın ID'si
  duplicateScore: decimal("duplicate_score", { precision: 5, scale: 2 }), // Benzerlik skoru
  duplicateReason: text("duplicate_reason"), // Tespit nedeni
});

// Types
export type CollectedListing = typeof collectedListings.$inferSelect;
export type NewCollectedListing = typeof collectedListings.$inferInsert;
export type CollectedCategory = "konut" | "isyeri" | "arsa" | "bina";
export type CollectedTransaction =
  | "satilik"
  | "kiralik"
  | "devren-satilik"
  | "devren-kiralik"
  | "kat-karsiligi";
export type CollectedStatus = "pending" | "approved" | "rejected" | "duplicate";

// Sahibinden URL mapping
export const SAHIBINDEN_CATEGORIES = {
  konut: {
    satilik: "https://www.sahibinden.com/satilik/sakarya-hendek",
    kiralik: "https://www.sahibinden.com/kiralik/sakarya-hendek",
  },
  isyeri: {
    satilik: "https://www.sahibinden.com/satilik-isyeri/sakarya-hendek",
    kiralik: "https://www.sahibinden.com/kiralik-isyeri/sakarya-hendek",
    "devren-satilik":
      "https://www.sahibinden.com/devren-satilik-isyeri/sakarya-hendek",
    "devren-kiralik":
      "https://www.sahibinden.com/devren-kiralik-isyeri/sakarya-hendek",
  },
  arsa: {
    satilik: "https://www.sahibinden.com/satilik-arsa/sakarya-hendek",
    kiralik: "https://www.sahibinden.com/kiralik-arsa/sakarya-hendek",
    "kat-karsiligi":
      "https://www.sahibinden.com/kat-karsiligi-arsa/sakarya-hendek",
  },
  bina: {
    satilik: "https://www.sahibinden.com/satilik-bina/sakarya-hendek",
    kiralik: "https://www.sahibinden.com/kiralik-bina/sakarya-hendek",
  },
} as const;
