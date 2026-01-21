import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { formatPrice, formatPricePerSqm, formatArea } from "@/lib/format";

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
  searchParams: Promise<{ type?: string; search?: string }>;
}

async function getListings(type?: string) {
  const conditions = [eq(listings.status, "active")];

  if (type && ["sanayi", "tarim", "konut", "ticari", "arsa"].includes(type)) {
    // Note: "arsa" type requires database migration to add to enum
    conditions.push(
      eq(listings.type, type as (typeof listings.type.enumValues)[number]),
    );
  }

  const result = await db
    .select()
    .from(listings)
    .where(
      sql`${listings.status} = 'active'${
        type ? sql` AND ${listings.type} = ${type}` : sql``
      }`,
    )
    .orderBy(desc(listings.isFeatured), desc(listings.createdAt));

  return result;
}

export default async function IlanlarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const listingsData = await getListings(params.type);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)]">
        {/* Header */}
        <section className="bg-white border-b border-gray-200 py-12">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--demir-slate)]/5 text-[var(--demir-slate)] text-xs font-bold tracking-wider uppercase mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)]" />
                  Portföy
                </span>
                <h1 className="text-4xl lg:text-5xl font-bold text-[var(--demir-slate)] leading-tight mb-4">
                  {params.type ? typeLabels[params.type] : "Tüm"}{" "}
                  <span className="text-[var(--terracotta)]">İlanlar</span>
                </h1>
                <p className="text-lg text-gray-600 font-[var(--font-body)]">
                  Hendek bölgesindeki {listingsData.length} adet gayrimenkul
                  fırsatı
                </p>
              </div>
              <FilterButtons activeType={params.type} />
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="py-12">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
            <Suspense fallback={<ListingsGridSkeleton />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listingsData.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </Suspense>

            {listingsData.length === 0 && (
              <div className="text-center py-20">
                <Icon
                  name="search_off"
                  className="text-6xl text-gray-300 mb-4"
                />
                <h3 className="text-xl font-bold text-[var(--demir-slate)] mb-2">
                  İlan Bulunamadı
                </h3>
                <p className="text-gray-500">
                  Arama kriterlerinize uygun ilan bulunamadı.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FilterButtons({ activeType }: { activeType?: string }) {
  const filters = [
    { key: undefined, label: "Tümü" },
    { key: "sanayi", label: "Sanayi" },
    { key: "tarim", label: "Tarım" },
    { key: "konut", label: "Konut" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Link
          key={filter.label}
          href={filter.key ? `/ilanlar?type=${filter.key}` : "/ilanlar"}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeType === filter.key || (!activeType && !filter.key)
              ? "bg-[var(--demir-slate)] text-white font-semibold"
              : "bg-white border border-gray-200 text-[var(--demir-slate)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
          }`}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}

interface ListingData {
  id: string;
  slug: string;
  title: string;
  type: string;
  area: number;
  price: string;
  description: string | null;
  thumbnail: string | null;
  images: string[] | null;
  isFeatured: boolean;
  createdAt: Date;
}

function ListingCard({ listing }: { listing: ListingData }) {
  const price = parseInt(listing.price) || 0;
  const pricePerSqm = listing.area > 0 ? Math.round(price / listing.area) : 0;
  const isNew =
    new Date().getTime() - new Date(listing.createdAt).getTime() <
    7 * 24 * 60 * 60 * 1000;
  const imageUrl =
    listing.thumbnail || listing.images?.[0] || "/placeholder-property.jpg";

  return (
    <Link
      href={`/ilanlar/${listing.slug}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover-lift"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`${
              typeColors[listing.type] || "bg-gray-500"
            } text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase`}
          >
            {typeLabels[listing.type] || listing.type}
          </span>
          {isNew && (
            <span className="bg-[var(--hazelnut)] text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase flex items-center gap-1">
              <Icon name="bolt" className="text-sm" filled />
              Yeni
            </span>
          )}
        </div>
        {listing.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur text-[var(--demir-slate)] text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <Icon name="star" className="text-amber-500 text-sm" filled />
              Öne Çıkan
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-[var(--demir-slate)] mb-1 group-hover:text-[var(--terracotta)] transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 font-[var(--font-body)] line-clamp-1">
          {formatArea(listing.area)} •{" "}
          {listing.description?.slice(0, 50) || "Detaylar için tıklayın"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--demir-slate)]">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-gray-500">
            {formatPricePerSqm(price, listing.area)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse"
        >
          <div className="h-56 bg-gray-200" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
