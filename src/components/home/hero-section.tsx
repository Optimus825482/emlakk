"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

// External URL'ler için unoptimized helper
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

interface HeroContent {
  badge?: string;
  badgeSecondary?: string;
  title?: string;
  titleHighlight?: string;
  titleAccent?: string;
  titleEnd?: string;
  description?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  founderName?: string;
  founderTitle?: string;
  founderQuote?: string;
  founderImage?: string;
  statsLabel?: string;
  statsValue?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
    color: string;
  }>;
}

const defaultContent: HeroContent = {
  badge: "Hendek'in Premium Gayrimenkulü",
  title: "Demir Gayrimenkul:",
  titleHighlight: "Akıllı",
  titleAccent: "Yatırım",
  titleEnd: "Demir Güven.",
  description:
    "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz. Hendek in her sokağını, her ağacını bilen bir hafıza, şimdi en ileri teknolojiyle analiz ediliyor.",
  ctaPrimary: "Hendek'i Keşfedin",
  ctaSecondary: "Mülk Değerleme Platformu",
  founderName: "Mustafa Demir",
  founderTitle: "Gayrimenkul Danışmanı | Yatırım & Proje Geliştirme  ",
  founderQuote: "Bence değil, Verilere göre yatırım...",
  founderImage: "", // Admin panelinden yüklenecek

  features: [
    {
      icon: "speed",
      title: "Hızlı Satış Analizi",
      description: "Saniyeler içinde AI destekli değerleme.",
      color: "terracotta",
    },
    {
      icon: "school",
      title: "Hendek Yatırım Rehberi",
      description: "Uzman eğitimsel içgörüler.",
      color: "forest",
    },
    {
      icon: "location_city",
      title: "Yaşam Alanı Keşfet",
      description: "Hayalinizdeki yaşam alanını bulun.",
      color: "slate",
    },
  ],
};

export function HeroSection() {
  const [content, setContent] = useState<HeroContent>(defaultContent);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch("/api/hero");
        if (response.ok) {
          const heroData = await response.json();

          // Admin'den gelen flat yapıyı frontend yapısına dönüştür
          // founderImage için özel kontrol: boş string de geçerli bir değer olabilir
          const mappedContent: HeroContent = {
            badge: heroData.badge || defaultContent.badge,
            title: heroData.title || defaultContent.title,
            titleHighlight:
              heroData.titleHighlight || defaultContent.titleHighlight,
            titleAccent: heroData.titleAccent || defaultContent.titleAccent,
            titleEnd: heroData.titleEnd || defaultContent.titleEnd,
            description: heroData.description || defaultContent.description,
            ctaPrimary: heroData.ctaPrimary || defaultContent.ctaPrimary,
            ctaSecondary: heroData.ctaSecondary || defaultContent.ctaSecondary,
            founderName: heroData.founderName || defaultContent.founderName,
            founderTitle: heroData.founderTitle || defaultContent.founderTitle,
            founderQuote: heroData.founderQuote || defaultContent.founderQuote,
            // founderImage: undefined/null ise default, aksi halde DB'den gelen değer
            founderImage:
              heroData.founderImage !== undefined &&
              heroData.founderImage !== null &&
              heroData.founderImage !== ""
                ? heroData.founderImage
                : defaultContent.founderImage,
            features: [
              {
                icon: heroData.feature1Icon || "speed",
                title: heroData.feature1Title || "Hızlı Satış Analizi",
                description:
                  heroData.feature1Desc ||
                  "Saniyeler içinde AI destekli değerleme.",
                color: "terracotta",
              },
              {
                icon: heroData.feature2Icon || "school",
                title: heroData.feature2Title || "Hendek Yatırım Rehberi",
                description:
                  heroData.feature2Desc || "Uzman eğitimsel içgörüler.",
                color: "forest",
              },
              {
                icon: heroData.feature3Icon || "location_city",
                title: heroData.feature3Title || "Yaşam Alanı Keşfet",
                description:
                  heroData.feature3Desc || "Hayalinizdeki yaşam alanını bulun.",
                color: "slate",
              },
            ],
          };

          setContent(mappedContent);
        }
      } catch (error) {
        console.error("Hero içeriği yüklenemedi:", error);
      }
    }
    fetchContent();
  }, []);

  return (
    <section className="relative min-h-[90vh] flex p-5 items-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#2f353b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-[var(--terracotta)]/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 left-20 w-72 h-72 bg-[var(--hazelnut)]/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-3s" }}
      />

      <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col gap-8 animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--terracotta)]/10 border border-[var(--terracotta)]/20">
                <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-pulse" />
                <span className="text-sm font-bold text-[var(--terracotta)] tracking-wider uppercase">
                  {content.badge}
                </span>
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[0.95] tracking-tight">
                <span className="text-[var(--demir-slate)]">
                  {content.title}
                </span>
                <br />
              </h1>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-[0.75] tracking-tight">
                <span className="gradient-text">{content.titleHighlight}</span>
                <span className="text-[var(--terracotta)] italic">
                  {" "}
                  {content.titleAccent}
                </span>
                <span className="text-[var(--demir-slate)]">
                  {" "}
                  {content.titleEnd}
                </span>
              </h3>
              <p className="text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed font-[var(--font-body)]">
                {content.description?.split("veri bilimi")[0]}
                <span className="text-[var(--terracotta)] font-semibold">
                  veri bilimi
                </span>
                {content.description?.split("veri bilimi")[1]}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link
                href="/ilanlar"
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-[var(--demir-slate)] text-white rounded-2xl font-bold text-base hover:bg-[var(--terracotta)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[var(--terracotta)]/20"
              >
                {content.ctaPrimary}
                <Icon
                  name="arrow_forward"
                  className="text-lg group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="/degerleme"
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-[var(--demir-slate)] rounded-2xl font-semibold text-base hover:border-[var(--terracotta)] hover:text-[var(--terracotta)] transition-all"
              >
                <Icon
                  name="auto_awesome"
                  className="text-[var(--terracotta)]"
                  filled
                />
                {content.ctaSecondary}
              </Link>
            </div>

            {/* Mini Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              {content.features?.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                />
              ))}
            </div>
          </div>

          {/* Right Content - Mustafa Demir Portrait */}
          <div className="lg:col-span-5 relative animate-fade-in">
            <div className="relative">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--demir-charcoal)]/90 via-[var(--demir-charcoal)]/20 to-transparent z-10" />
                {content.founderImage ? (
                  <Image
                    src={content.founderImage}
                    alt={`${content.founderName} - Demir Gayrimenkul Kurucusu`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    priority
                    unoptimized={isExternalUrl(content.founderImage)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--demir-slate)] to-[var(--terracotta)]/80 flex items-center justify-center">
                    <Icon
                      name="person"
                      className="text-white/30 text-[120px]"
                    />
                  </div>
                )}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="glass rounded-2xl p-5 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--terracotta)] uppercase tracking-wider mb-1">
                          {content.founderTitle}
                        </p>
                        <p className="text-xl font-bold text-[var(--demir-slate)]">
                          {content.founderName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 font-[var(--font-body)]">
                          &quot;{content.founderQuote}&quot;
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center">
                        <Icon
                          name="verified"
                          className="text-[var(--terracotta)] text-3xl"
                          filled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-[var(--terracotta)]/20 rounded-3xl -z-10" />
              <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-[var(--hazelnut)]/10 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; hover: string; text: string }> =
    {
      terracotta: {
        bg: "bg-[var(--terracotta)]/10",
        hover: "group-hover:bg-[var(--terracotta)]/20",
        text: "text-[var(--terracotta)]",
      },
      forest: {
        bg: "bg-[var(--forest)]/10",
        hover: "group-hover:bg-[var(--forest)]/20",
        text: "text-[var(--forest)]",
      },
      slate: {
        bg: "bg-[var(--demir-slate)]/10",
        hover: "group-hover:bg-[var(--demir-slate)]/20",
        text: "text-[var(--demir-slate)]",
      },
    };
  const colors = colorMap[color] || colorMap.terracotta;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[var(--terracotta)]/20 transition-all cursor-pointer group">
      <div
        className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3 ${colors.hover} transition-colors`}
      >
        <Icon name={icon} className={`${colors.text} text-xl`} />
      </div>
      <h4 className="font-bold text-[var(--demir-slate)] text-sm uppercase tracking-wide mb-1">
        {title}
      </h4>
      <p className="text-xs text-gray-500 font-[var(--font-body)]">
        {description}
      </p>
    </div>
  );
}
