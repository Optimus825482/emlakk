import { MetadataRoute } from "next";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://demirgayrimenkul.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statik sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/ilanlar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/hendek`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/rehber`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/iletisim`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/randevu`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dinamik ilan sayfaları
  let listingPages: MetadataRoute.Sitemap = [];

  try {
    const activeListings = await db
      .select({
        slug: listings.slug,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"));

    listingPages = activeListings.map((listing) => ({
      url: `${BASE_URL}/ilanlar/${listing.slug}`,
      lastModified: listing.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap listing error:", error);
  }

  return [...staticPages, ...listingPages];
}
