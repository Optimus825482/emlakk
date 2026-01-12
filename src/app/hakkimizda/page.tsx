"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Navbar, Footer } from "@/components/layout";
import Image from "next/image";

// External URL'ler için unoptimized helper
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

interface FounderProfile {
  id: string;
  name: string;
  title: string;
  image: string | null;
  badgeText: string | null;
  heroTitle: string | null;
  heroTitleHighlight: string | null;
  narrativeTitle: string | null;
  narrativeParagraph1: string | null;
  narrativeParagraph2: string | null;
  narrativeDividerText: string | null;
  heritageTitle: string | null;
  heritageText: string | null;
  visionTitle: string | null;
  visionText: string | null;
}

interface VisionPillar {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface CompanyPrinciple {
  id: string;
  icon: string;
  title: string;
}

interface Manifesto {
  id: string;
  fullTitle: string | null;
  fullText: string | null;
  signature: string | null;
}

interface AboutData {
  founder: FounderProfile | null;
  pillars: VisionPillar[];
  principles: CompanyPrinciple[];
  manifesto: Manifesto | null;
}

export default function HakkimizdaPage() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/about")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--demir-cream)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--terracotta)]" />
        </div>
        <Footer />
      </>
    );
  }

  const founder = data?.founder;
  const pillars = data?.pillars || [];
  const principles = data?.principles || [];
  const manifesto = data?.manifesto;

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center bg-[var(--demir-cream)]">
        {/* Hero / Editorial Header */}
        <section className="relative w-full max-w-[1200px] px-6 ">
          {/* Background decorations */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-[var(--terracotta)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-[var(--hazelnut)]/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col gap-12 md:gap-16">
            {/* Editorial Layout: Portrait & Intro */}
            <div className="grid gap-12 md:grid-cols-12 md:gap-8 items-start">
              {/* Portrait Image */}
              <div className="md:col-span-5 lg:col-span-5 pt-8">
                <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--demir-charcoal)]/80 via-transparent to-transparent z-10" />
                  {founder?.image ? (
                    <Image
                      src={founder.image}
                      alt={founder.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover object-top grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      unoptimized={isExternalUrl(founder.image)}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Icon name="person" className="text-gray-400 text-8xl" />
                    </div>
                  )}
                  {/* Decorative border */}
                  <div className="absolute -top-3 -right-3 w-full h-full border-2 border-[var(--terracotta)]/20 rounded-3xl -z-10" />
                  <div className="absolute -bottom-3 -left-3 w-full h-full border-2 border-[var(--hazelnut)]/10 rounded-3xl -z-10" />

                  {/* Name overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="glass rounded-2xl p-4 border border-white/20">
                      <p className="text-lg font-bold text-[var(--demir-slate)]">
                        {founder?.name || "Mustafa Demir"}
                      </p>
                      <p className="text-sm font-medium text-[var(--terracotta)]">
                        {founder?.title || "Kurucu & Genel Müdür"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative Text */}
              <div className="flex flex-col justify-center gap-8 md:col-span-7 lg:col-span-6 lg:col-start-7 md:pt-12">
                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-[var(--demir-slate)]">
                  {founder?.narrativeTitle || '"Amatör Ruh & Profesyonel Veri"'}
                </h2>
                <div className="space-y-6 text-lg leading-relaxed text-gray-600">
                  <p>
                    {founder?.narrativeParagraph1 ||
                      "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz. Hendek'in her sokağını, her ağacını bilen bir hafıza, şimdi en ileri teknolojiyle analiz ediliyor."}
                  </p>
                  <p>
                    {founder?.narrativeParagraph2 ||
                      "Bizim için emlak danışmanlığı sadece mülk satışı değildir; bir ailenin geleceğini inşa etmek, bir yatırımcının hayallerini doğru zemine oturtmaktır. Geleneksel güveni, yapay zeka destekli öngörülerle birleştirerek hata payını sıfıra indirmeyi hedefliyoruz."}
                  </p>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-12 bg-[var(--terracotta)]/30" />
                    <span className="text-sm font-bold uppercase tracking-widest text-[var(--terracotta)]">
                      {founder?.narrativeDividerText || "Hendek?"}
                    </span>
                  </div>
                </div>

                {/* Mirasımız & Vizyonumuz Kartları */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mt-1">
                  {/* Mirasımız Kartı */}
                  <div className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[var(--terracotta)]/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--terracotta)]/10">
                        <Icon
                          name="history"
                          className="text-[var(--terracotta)] text-3xl"
                        />
                      </div>
                      <h4 className="text-xl font-bold text-[var(--demir-slate)]">
                        {founder?.heritageTitle || "Mirasımız"}
                      </h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-base">
                      {founder?.heritageText ||
                        "Demir Gayrimenkul'ün kurucusu ve sahibi olarak, proje geliştirme ve emlak sektöründeki yılların tecrübesini masaya koyuyoruz. Bölgenin toprağını, insanını ve dinamiklerini tanıyoruz."}
                    </p>
                  </div>

                  {/* Vizyonumuz Kartı */}
                  <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[var(--forest)]/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--forest)]/10">
                        <Icon
                          name="visibility"
                          className="text-[var(--forest)] text-3xl"
                        />
                      </div>
                      <h4 className="text-xl font-bold text-[var(--demir-slate)]">
                        {founder?.visionTitle || "Vizyonumuz"}
                      </h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-base">
                      {founder?.visionText ||
                        "Geleneksel emlakçılık anlayışını, günümüz modern teknolojileri ile birleştiriyoruz. Amacımız sadece mülk satmak değil, bölgenin gelişimine modern araçlarla liderlik etmektir."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full max-w-[1200px] px-6">
          <hr className="border-[var(--hazelnut)]/20" />
        </div>

        {/* Manifesto Section - Ana sayfayla aynı tema */}
        {manifesto && (
          <section className="relative w-full py-16 md:py-20 bg-[var(--demir-slate)] overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[var(--terracotta)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-[var(--forest)]/10 rounded-full blur-3xl" />

            <div className="relative max-w-4xl mx-auto px-6">
              <div className="text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Icon
                    name="auto_awesome"
                    className="text-[var(--terracotta)] text-lg"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {manifesto.fullTitle || "Manifesto"}
                  </span>
                </div>

                {/* Quote */}
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[100px] text-white/5 font-serif leading-none select-none">
                    "
                  </div>
                  <blockquote className="relative z-10 text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-white/90 max-w-3xl mx-auto">
                    {manifesto.fullText ||
                      "Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz. Hendek'in toprağını biliyoruz, şimdi bu toprağa dijital geleceği getiriyoruz."}
                  </blockquote>
                </div>

                {/* Divider & Signature */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
                  <Icon
                    name="domain"
                    className="text-[var(--terracotta)] text-xl"
                  />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
                </div>

                {manifesto.signature && (
                  <p className="mt-6 text-base font-medium text-[var(--terracotta)]">
                    {manifesto.signature}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* The 3 Pillars / Feature Section */}
        {pillars.length > 0 && (
          <section className="w-full max-w-[1200px] px-6 py-20 md:py-28">
            <div className="mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--forest)]/10 border border-[var(--forest)]/20 mb-6">
                <Icon
                  name="foundation"
                  className="text-[var(--forest)] text-lg"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--forest)]">
                  Temel Değerler
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-[var(--demir-slate)] md:text-4xl">
                Vizyonumuzun Temelleri
              </h3>
              <p className="mt-4 max-w-2xl text-lg text-gray-600">
                Geleneksel emlakçılığın ötesinde, değer üreten ana saç
                ayaklarımız.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar, index) => {
                const colors = [
                  {
                    bg: "bg-[var(--terracotta)]/10",
                    hover: "hover:border-[var(--terracotta)]/30",
                    icon: "text-[var(--terracotta)]",
                  },
                  {
                    bg: "bg-[var(--forest)]/10",
                    hover: "hover:border-[var(--forest)]/30",
                    icon: "text-[var(--forest)]",
                  },
                  {
                    bg: "bg-[var(--hazelnut)]/20",
                    hover: "hover:border-[var(--hazelnut)]/50",
                    icon: "text-[var(--demir-slate)]",
                  },
                ][index % 3];

                return (
                  <div
                    key={pillar.id}
                    className={`group flex flex-col gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm ${colors.hover} transition-all duration-300 hover:shadow-lg`}
                  >
                    <div
                      className={`flex size-14 items-center justify-center rounded-2xl ${colors.bg} transition-colors`}
                    >
                      <Icon
                        name={pillar.icon}
                        className={`text-[28px] ${colors.icon}`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-xl font-bold text-[var(--demir-slate)]">
                        {pillar.title}
                      </h4>
                      <p className="text-base leading-relaxed text-gray-600">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Principles Footer */}
        {principles.length > 0 && (
          <section className="w-full bg-[var(--hazelnut)]/10 py-16">
            <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 text-center">
              <h5 className="text-sm font-bold uppercase tracking-widest text-[var(--demir-slate)]/60">
                Demir Gayrimenkul İlkeleri
              </h5>
              <div className="flex w-full flex-wrap justify-center gap-12 md:gap-24">
                {principles.map((principle) => (
                  <div
                    key={principle.id}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="flex size-16 items-center justify-center rounded-full bg-white border-2 border-[var(--hazelnut)]/30 text-[var(--demir-slate)] shadow-sm group-hover:border-[var(--terracotta)]/50 group-hover:shadow-md transition-all duration-300">
                      <Icon name={principle.icon} className="text-[32px]" />
                    </div>
                    <span className="text-sm font-bold text-[var(--demir-slate)]">
                      {principle.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
