"use client";

import { useState, useEffect } from "react";
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
  features?: Record<string, unknown>;
  tarih?: string; // İlan tarihi (Sahibinden'den: "Bugün 14:30", "15 Ocak" vb.)
}

export function CategoryListings() {
  const [sanayiListings, setSanayiListings] = useState<Listing[]>([]);
  const [tarimListings, setTarimListings] = useState<Listing[]>([]);
  const [konutListings, setKonutListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const [sanayiRes, tarimRes, konutRes] = await Promise.all([
          fetch("/api/listings?type=sanayi&limit=4&status=active"),
          fetch("/api/listings?type=tarim&limit=4&status=active"),
          fetch("/api/listings?type=konut&limit=4&status=active"),
        ]);

        if (sanayiRes.ok) {
          const data = await sanayiRes.json();
          setSanayiListings(data.data || []);
        }
        if (tarimRes.ok) {
          const data = await tarimRes.json();
          setTarimListings(data.data || []);
        }
        if (konutRes.ok) {
          const data = await konutRes.json();
          setKonutListings(data.data || []);
        }
      } catch (error) {
        console.error("Kategoriler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Icon
          name="sync"
          className="text-4xl text-[var(--terracotta)] animate-spin"
        />
      </div>
    );
  }

  return (
    <>
      {/* SANAYİ FIRSATLARI */}
      {sanayiListings.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-[var(--demir-slate)] to-[var(--demir-charcoal)]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
            <SectionHeader
              icon="factory"
              iconBg="bg-blue-500/20"
              iconColor="text-blue-400"
              title="Sanayi Fırsatları"
              subtitle="Hendek OSB ve çevresindeki stratejik yatırımlar"
              linkHref="/ilanlar?type=sanayi"
              linkColor="text-white/70 hover:text-white"
            />
            <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
              {sanayiListings.map((listing) => (
                <SanayiCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TARIM ARAZİLERİ */}
      {tarimListings.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-[var(--forest)]/5 to-[var(--hazelnut)]/5">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
            <SectionHeader
              icon="park"
              iconBg="bg-[var(--forest)]/20"
              iconColor="text-[var(--forest)]"
              title="Tarım Arazileri"
              subtitle="Fındık bahçeleri ve verimli tarım arazileri"
              linkHref="/ilanlar?type=tarim"
              linkColor="text-[var(--forest)] hover:text-[var(--forest)]/80"
              dark={false}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tarimListings.map((listing) => (
                <TarimCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* KONUT PROJELERİ */}
      {konutListings.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
            <SectionHeader
              icon="home"
              iconBg="bg-[var(--terracotta)]/20"
              iconColor="text-[var(--terracotta)]"
              title="Konut Projeleri"
              subtitle="Villa, daire ve imarlı arsalar"
              linkHref="/ilanlar?type=konut"
              linkColor="text-[var(--terracotta)] hover:text-[var(--terracotta-light)]"
              dark={false}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {konutListings.map((listing) => (
                <KonutCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function SectionHeader({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  linkHref,
  linkColor,
  dark = true,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  linkHref: string;
  linkColor: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon name={icon} className={`${iconColor} text-2xl`} />
        </div>
        <div>
          <h3
            className={`text-2xl font-bold ${
              dark ? "text-white" : "text-[var(--demir-slate)]"
            }`}
          >
            {title}
          </h3>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {subtitle}
          </p>
        </div>
      </div>
      <Link
        href={linkHref}
        className={`hidden md:flex items-center gap-2 ${linkColor} transition-colors text-sm font-medium`}
      >
        Tümünü Gör <Icon name="arrow_forward" className="text-lg" />
      </Link>
    </div>
  );
}

function SanayiCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/ilanlar/${listing.slug}`}
      className="flex-shrink-0 w-[300px] bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={listing.images?.[0] || "/placeholder.jpg"}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Sanayi
          </span>
        </div>
        {listing.listingType === "kiralik" && (
          <div className="absolute top-3 right-3">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              Kiralık
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-white font-bold mb-1">{listing.title}</h4>
        <p className="text-gray-400 text-sm mb-1">
          {formatArea(listing.area)} • Sanayi İmarlı
        </p>
        {listing.tarih && (
          <p className="text-xs text-orange-400 font-medium mb-2">
            🕐 İlan Tarihi: {listing.tarih}
          </p>
        )}
        <p className="text-xl font-bold text-white">
          {formatPrice(listing.price)}
        </p>
      </div>
    </Link>
  );
}

function TarimCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/ilanlar/${listing.slug}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover-lift group"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={listing.images?.[0] || "/placeholder.jpg"}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-[var(--forest)] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Tarım
          </span>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-[var(--demir-slate)] font-bold mb-1 group-hover:text-[var(--forest)] transition-colors">
          {listing.title}
        </h4>
        <p className="text-gray-500 text-sm mb-3">
          {formatArea(listing.area)} • {listing.city}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-[var(--demir-slate)]">
            {formatPrice(listing.price)}
          </p>
          <span className="text-xs text-green-600 font-semibold">
            {formatPricePerSqm(listing.price, listing.area)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function KonutCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/ilanlar/${listing.slug}`}
      className="bg-[var(--cream)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover-lift group"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={listing.images?.[0] || "/placeholder.jpg"}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-[var(--terracotta)] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Konut
          </span>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-[var(--demir-slate)] font-bold mb-1 group-hover:text-[var(--terracotta)] transition-colors">
          {listing.title}
        </h4>
        <p className="text-gray-500 text-sm mb-1">
          {formatArea(listing.area)} • {listing.address}
        </p>
        {listing.tarih && (
          <p className="text-xs text-orange-500 font-medium mb-2">
            🕐 İlan Tarihi: {listing.tarih}
          </p>
        )}
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-[var(--demir-slate)]">
            {formatPrice(listing.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
