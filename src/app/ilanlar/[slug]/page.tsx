import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { ImageGallery } from "@/components/ui/image-gallery";
import { ListingTracker } from "@/components/listing-tracker";
import { db } from "@/db";
import { listings, seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const typeLabels: Record<string, string> = {
  sanayi: "Sanayi",
  tarim: "Tarım",
  konut: "Konut",
  ticari: "Ticari",
  arsa: "Arsa",
};
const typeColors: Record<string, string> = {
  sanayi: "bg-blue-500",
  tarim: "bg-[var(--forest)]",
  konut: "bg-[var(--terracotta)]",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getListing(slug: string) {
  const result = await db
    .select()
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);

  return result[0] || null;
}

async function getSeoData(entityId: string) {
  try {
    const result = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, "listing"),
          eq(seoMetadata.entityId, entityId)
        )
      )
      .limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

// Dinamik SEO Metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    return {
      title: "İlan Bulunamadı | Demir Gayrimenkul",
    };
  }

  const seo = await getSeoData(listing.id);
  const price = parseInt(listing.price) || 0;
  const formattedPrice =
    price >= 1000000
      ? `${(price / 1000000).toFixed(1)}M TL`
      : `${price.toLocaleString("tr-TR")} TL`;

  const defaultTitle = `${listing.title} | ${formattedPrice} | Demir Gayrimenkul`;
  const defaultDescription =
    listing.description?.substring(0, 155) ||
    `${listing.title} - ${listing.area}m² ${
      typeLabels[listing.type] || listing.type
    } ${
      listing.transactionType === "rent" ? "kiralık" : "satılık"
    }. Hendek, Sakarya.`;

  return {
    title: seo?.metaTitle || defaultTitle,
    description: seo?.metaDescription || defaultDescription,
    keywords: (seo?.keywords as string[]) || [
      "Hendek emlak",
      listing.type,
      listing.transactionType === "rent" ? "kiralık" : "satılık",
      listing.district || "Hendek",
    ],
    openGraph: {
      title: seo?.ogTitle || listing.title,
      description: seo?.ogDescription || defaultDescription,
      type: "website",
      locale: "tr_TR",
      images: listing.thumbnail ? [{ url: listing.thumbnail }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || listing.title,
      description: seo?.twitterDescription || defaultDescription,
      images: listing.thumbnail ? [listing.thumbnail] : undefined,
    },
  };
}

export default async function IlanDetayPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    notFound();
  }

  const price = parseInt(listing.price) || 0;
  const pricePerSqm = listing.area > 0 ? Math.round(price / listing.area) : 0;
  const features = (listing.features as Record<string, unknown>) || {};
  const mainImage =
    listing.thumbnail || listing.images?.[0] || "/placeholder-property.jpg";
  const allImages = listing.images || [];

  // Feature mapping for display
  const displayFeatures: Record<string, string> = {};

  if (features.rooms) displayFeatures["Oda Sayısı"] = String(features.rooms);
  if (features.bathrooms) displayFeatures["Banyo"] = String(features.bathrooms);
  if (features.floors) displayFeatures["Kat"] = String(features.floors);
  if (features.buildingAge)
    displayFeatures["Bina Yaşı"] = `${features.buildingAge} Yıl`;
  if (features.heating) displayFeatures["Isıtma"] = String(features.heating);
  if (features.parking) displayFeatures["Otopark"] = "Var";
  if (features.garden) displayFeatures["Bahçe"] = "Var";
  if (features.pool) displayFeatures["Havuz"] = "Var";
  if (features.elevator) displayFeatures["Asansör"] = "Var";
  if (features.security) displayFeatures["Güvenlik"] = "Var";
  if (features.infrastructure) displayFeatures["Altyapı"] = "Hazır";
  if (features.roadAccess)
    displayFeatures["Yol Erişimi"] = String(features.roadAccess);
  if (features.treeCount)
    displayFeatures["Ağaç Sayısı"] = `${features.treeCount} Adet`;
  if (features.irrigation) displayFeatures["Sulama"] = "Mevcut";
  if (features.organic) displayFeatures["Organik"] = "Sertifikalı";
  if (features.soilType)
    displayFeatures["Toprak Tipi"] = String(features.soilType);

  return (
    <>
      <Navbar />
      <ListingTracker listingId={listing.id} />
      <main className="min-h-screen bg-[var(--cream)]">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="text-gray-500 hover:text-[var(--terracotta)]"
              >
                Ana Sayfa
              </Link>
              <Icon name="chevron_right" className="text-gray-400 text-base" />
              <Link
                href="/ilanlar"
                className="text-gray-500 hover:text-[var(--terracotta)]"
              >
                İlanlar
              </Link>
              <Icon name="chevron_right" className="text-gray-400 text-base" />
              <span className="text-[var(--demir-slate)] font-medium">
                {listing.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery with Lightbox */}
              <div className="relative">
                <ImageGallery
                  images={allImages}
                  title={listing.title}
                  mainImage={mainImage}
                />
                {/* Type & Transaction badges */}
                <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
                  <span
                    className={`${
                      typeColors[listing.type] || "bg-gray-500"
                    } text-white text-sm font-bold px-4 py-2 rounded-xl uppercase`}
                  >
                    {typeLabels[listing.type] || listing.type}
                  </span>
                  {listing.transactionType === "rent" && (
                    <span className="bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl uppercase">
                      Kiralık
                    </span>
                  )}
                </div>
                {listing.isFeatured && (
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    <span className="bg-white/90 backdrop-blur text-[var(--demir-slate)] text-sm font-bold px-3 py-2 rounded-xl flex items-center gap-1">
                      <Icon name="star" className="text-amber-500" filled />
                      Öne Çıkan
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--demir-slate)] mb-4">
                  Açıklama
                </h2>
                <p className="text-gray-600 leading-relaxed font-[var(--font-body)] whitespace-pre-line">
                  {listing.description ||
                    "Bu ilan için henüz açıklama eklenmemiş."}
                </p>
              </div>

              {/* Features */}
              {Object.keys(displayFeatures).length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[var(--demir-slate)] mb-6">
                    Özellikler
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(displayFeatures).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                      >
                        <Icon
                          name="check_circle"
                          className="text-green-500"
                          filled
                        />
                        <div>
                          <p className="text-xs text-gray-500">{key}</p>
                          <p className="font-semibold text-[var(--demir-slate)]">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Info */}
              {(listing.district ||
                listing.neighborhood ||
                listing.address) && (
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[var(--demir-slate)] mb-4">
                    Konum Bilgileri
                  </h2>
                  <div className="space-y-3">
                    {listing.district && (
                      <div className="flex items-center gap-3">
                        <Icon
                          name="location_city"
                          className="text-[var(--terracotta)]"
                        />
                        <span className="text-gray-600">
                          İlçe: <strong>{listing.district}</strong>
                        </span>
                      </div>
                    )}
                    {listing.neighborhood && (
                      <div className="flex items-center gap-3">
                        <Icon
                          name="home_work"
                          className="text-[var(--terracotta)]"
                        />
                        <span className="text-gray-600">
                          Mahalle: <strong>{listing.neighborhood}</strong>
                        </span>
                      </div>
                    )}
                    {listing.address && (
                      <div className="flex items-center gap-3">
                        <Icon
                          name="pin_drop"
                          className="text-[var(--terracotta)]"
                        />
                        <span className="text-gray-600">{listing.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Price & Contact */}
            <div className="space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm sticky top-24">
                <h1 className="text-2xl font-bold text-[var(--demir-slate)] mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-gray-500 mb-6">
                  <Icon
                    name="location_on"
                    className="text-[var(--terracotta)]"
                  />
                  <span className="text-sm">
                    {[listing.neighborhood, listing.district, "Sakarya"]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-6 mb-6">
                  <p className="text-sm text-gray-500 mb-1">
                    {listing.transactionType === "rent"
                      ? "Kira Bedeli"
                      : "Satış Fiyatı"}
                  </p>
                  <p className="text-4xl font-bold text-[var(--demir-slate)]">
                    {price >= 1000000
                      ? `₺${(price / 1000000).toFixed(1)}M`
                      : `₺${price.toLocaleString("tr-TR")}`}
                    {listing.transactionType === "rent" && (
                      <span className="text-lg font-normal">/ay</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ₺{pricePerSqm.toLocaleString("tr-TR")}/m²
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Icon
                      name="square_foot"
                      className="text-[var(--terracotta)] text-2xl mb-1"
                    />
                    <p className="text-lg font-bold text-[var(--demir-slate)]">
                      {listing.area.toLocaleString("tr-TR")}m²
                    </p>
                    <p className="text-xs text-gray-500">Alan</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Icon
                      name="category"
                      className="text-blue-500 text-2xl mb-1"
                    />
                    <p className="text-lg font-bold text-[var(--demir-slate)]">
                      {typeLabels[listing.type] || listing.type}
                    </p>
                    <p className="text-xs text-gray-500">Kategori</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/randevu"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[var(--demir-slate)] text-white rounded-xl font-bold hover:bg-[var(--terracotta)] transition-all"
                  >
                    <Icon name="calendar_month" />
                    Randevu Al
                  </Link>
                  <a
                    href="tel:+902641234567"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 border-2 border-gray-200 text-[var(--demir-slate)] rounded-xl font-semibold hover:border-[var(--terracotta)] hover:text-[var(--terracotta)] transition-all"
                  >
                    <Icon name="call" />
                    Hemen Ara
                  </a>
                </div>

                {/* Agent Card */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center">
                      <Icon
                        name="person"
                        className="text-[var(--terracotta)] text-2xl"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--demir-slate)]">
                        Mustafa Demir
                      </p>
                      <p className="text-sm text-gray-500">
                        Gayrimenkul Danışmanı
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
