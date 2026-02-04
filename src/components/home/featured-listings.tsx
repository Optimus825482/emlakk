"use client";

import { useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatPrice, formatPricePerSqm, formatArea } from "@/lib/format";

interface Listing {
  id: string;
  slug: string;
  title: string;
  propertyType: string;
  listingType: string;
  price: string;
  area: number;
  address: string;
  city: string;
  images: string[];
  isFeatured: boolean;
  aiInsight?: string;
  createdAt: string;
}

export function FeaturedListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchListings() {
      try {
        const params = new URLSearchParams({
          isFeatured: "true",
          limit: "6",
          status: "active",
        });
        if (filter !== "all") params.set("type", filter);

        const response = await fetch(`/api/listings?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        }
      } catch (error) {
        console.error("İlanlar yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [filter]);

  const mainListing = listings[0];
  const sideListings = listings.slice(1, 3);

  return (
    <section id="ilanlar" className="py-20 bg-[var(--cream)] relative">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--demir-slate)]/5 text-[var(--demir-slate)] text-xs font-bold tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)]" />
              Portföy
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-[var(--demir-slate)] leading-tight mb-4">
              Hendek&apos;in{" "}
              <span className="text-[var(--terracotta)]">Gelecek</span> Portföyü
            </h2>
            <p className="text-lg text-gray-600 font-[var(--font-body)]">
              Yapay zeka yatırım zekası ile küratörlüğü yapılmış{" "}
              <span className="text-[var(--demir-slate)] font-semibold">
                premium gayrimenkul fırsatları
              </span>
              .
            </p>
          </div>
          <FilterButtons filter={filter} setFilter={setFilter} />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Icon
              name="sync"
              className="text-4xl text-[var(--terracotta)] animate-spin"
            />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Icon
              name="real_estate_agent"
              className="text-6xl text-gray-300 mb-4"
            />
            <p className="text-gray-500 text-lg">
              Henüz öne çıkan ilan bulunmuyor
            </p>
          </div>
        ) : (
          <>
            {/* Listings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Featured Large Card */}
              {mainListing && (
                <div className="lg:col-span-8 group">
                  <Link
                    href={`/ilanlar/${mainListing.slug}`}
                    className="block relative h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="relative h-[400px] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                      <Image
                        src={mainListing.images?.[0] || "/placeholder.jpg"}
                        alt={mainListing.title}
                        fill
                        priority={true}
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <span className="bg-white/90 backdrop-blur text-[var(--demir-slate)] text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                          {getTypeLabel(mainListing.propertyType)}
                        </span>
                        <span className="bg-[var(--hazelnut)] text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Icon name="bolt" className="text-sm" filled />
                          Öne Çıkan
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-3xl font-bold mb-2">
                              {mainListing.title}
                            </h3>
                            <p className="text-gray-200 text-lg font-[var(--font-body)]">
                              {formatArea(mainListing.area)} •{" "}
                              {mainListing.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold">
                              {formatPrice(mainListing.price)}
                            </p>
                            <p className="text-sm text-gray-300">
                              {formatPricePerSqm(
                                mainListing.price,
                                mainListing.area,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {mainListing.aiInsight && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
                        <div className="flex gap-4 items-start">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white shrink-0">
                            <Icon name="smart_toy" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                              Yapay Zeka Öngörüsü
                            </p>
                            <p className="text-[var(--demir-slate)] text-sm leading-relaxed font-[var(--font-body)]">
                              {mainListing.aiInsight}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
              )}

              {/* Side Cards */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {sideListings.map((listing) => (
                  <SideListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>

            {/* View All Button */}
            <div className="flex justify-center mt-12">
              <Link
                href="/ilanlar"
                className="group flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 rounded-2xl text-[var(--demir-slate)] font-semibold hover:border-[var(--terracotta)] hover:text-[var(--terracotta)] transition-all"
              >
                Tüm İlanları Görüntüle
                <Icon
                  name="arrow_forward"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FilterButtons({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (f: string) => void;
}) {
  const filters = [
    { key: "all", label: "Tümü" },
    { key: "sanayi", label: "Sanayi" },
    { key: "tarim", label: "Tarım" },
    { key: "konut", label: "Konut" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            filter === f.key
              ? "bg-[var(--demir-slate)] text-white font-semibold"
              : "bg-white border border-gray-200 text-[var(--demir-slate)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

const SideListingCard = memo(({ listing }: { listing: Listing }) => {
  const typeColors: Record<string, string> = {
    tarim: "bg-[var(--forest)]",
    konut: "bg-[var(--terracotta)]",
    sanayi: "bg-blue-500",
    ticari: "bg-purple-500",
  };

  return (
    <Link
      href={`/ilanlar/${listing.slug}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover-lift"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={listing.images?.[0] || "/placeholder.jpg"}
          alt={listing.title}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`${
              typeColors[listing.propertyType] || "bg-gray-500"
            } text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase`}
          >
            {getTypeLabel(listing.propertyType)}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-[var(--demir-slate)] mb-1 group-hover:text-[var(--terracotta)] transition-colors">
          {listing.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 font-[var(--font-body)]">
          {formatArea(listing.area)} • {listing.city}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--demir-slate)]">
            {formatPrice(listing.price)}
          </span>
        </div>
      </div>
    </Link>
  );
});

SideListingCard.displayName = "SideListingCard";

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sanayi: "Sanayi",
    tarim: "Tarım",
    konut: "Konut",
    ticari: "Ticari",
  };
  return labels[type] || type;
}
