"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface HendekStat {
  id: string;
  key: string;
  label: string;
  value: string;
  numericValue?: number;
  unit?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface PopulationData {
  year: number;
  totalPopulation: number;
  growthRate?: string;
}

// Varsayılan veriler (API'den veri gelmezse)
const defaultStats: HendekStat[] = [
  {
    id: "1",
    key: "population",
    label: "Nüfus (2024)",
    value: "92.729",
    icon: "groups",
    color: "terracotta",
    description: "Yıllık %1.4 büyüme",
  },
  {
    id: "2",
    key: "osb_employment",
    label: "OSB İstihdam",
    value: "10.500",
    icon: "factory",
    color: "blue",
    description: "Hedef: 20.000 kişi",
  },
  {
    id: "3",
    key: "osb_area",
    label: "OSB Alanı",
    value: "352",
    unit: "Hektar",
    icon: "domain",
    color: "forest",
    description: "96 sanayi parseli",
  },
  {
    id: "4",
    key: "university",
    label: "Üniversite",
    value: "SAÜ",
    icon: "school",
    color: "purple",
    description: "Eğitim Fakültesi & MYO",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  terracotta: {
    bg: "bg-[var(--terracotta)]/10",
    text: "text-[var(--terracotta)]",
    border: "border-[var(--terracotta)]/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
  },
  forest: {
    bg: "bg-[var(--forest)]/10",
    text: "text-[var(--forest)]",
    border: "border-[var(--forest)]/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
    border: "border-purple-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
  },
};

export function InvestmentGuideHero() {
  const [stats, setStats] = useState<HendekStat[]>(defaultStats);
  const [populationHistory, setPopulationHistory] = useState<PopulationData[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API kaldırıldığı için varsayılan verileri kullanıyoruz
    setIsLoading(false);
  }, []);

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="mb-4 inline-flex items-center rounded-full border border-[var(--warm-green)]/20 bg-[var(--warm-green)]/20 px-3 py-1 text-xs font-semibold text-[var(--terracotta)]">
            <span className="mr-2 h-2 w-2 rounded-full bg-[var(--warm-green)] animate-pulse" />
            Güncel Veri Akışı
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-[var(--demir-slate)] sm:text-5xl">
            Rakamlarla Hendek
          </h2>
          <p className="mt-4 text-lg text-gray-600 font-[var(--font-body)]">
            Sakarya'nın en hızlı büyüyen ilçesi. OSB, üniversite ve stratejik
            konumuyla yatırımcılar için cazibe merkezi.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {stats.map((stat) => {
            const colors = colorMap[stat.color || "terracotta"];
            return (
              <div
                key={stat.id}
                className={`relative p-6 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-lg transition-all group`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
                >
                  <Icon
                    name={stat.icon || "analytics"}
                    className={`${colors.text} text-2xl`}
                  />
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl lg:text-4xl font-black text-[var(--demir-slate)]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm font-medium text-gray-500">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--demir-slate)] mb-1">
                  {stat.label}
                </p>
                {stat.description && (
                  <p className="text-xs text-gray-500">{stat.description}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OSB Bilgisi */}
          <div className="bg-[var(--demir-charcoal)] rounded-2xl p-6 lg:p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Icon name="factory" className="text-blue-400 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sakarya 2. OSB</h3>
                <p className="text-gray-400 text-sm">Organize Sanayi Bölgesi</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">352</p>
                <p className="text-xs text-gray-400">Hektar Alan</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">96</p>
                <p className="text-xs text-gray-400">Sanayi Parseli</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-400">80</p>
                <p className="text-xs text-gray-400">Aktif Firma</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-400">10.500</p>
                <p className="text-xs text-gray-400">Mevcut İstihdam</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="trending_up" className="text-green-400" />
              <span className="text-gray-300">
                Tam kapasite hedefi:{" "}
                <span className="text-white font-bold">20.000</span> istihdam
              </span>
            </div>
          </div>

          {/* Nüfus Trendi */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--terracotta)]/10 flex items-center justify-center">
                  <Icon
                    name="trending_up"
                    className="text-[var(--terracotta)] text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--demir-slate)]">
                    Nüfus Artışı
                  </h3>
                  <p className="text-gray-500 text-sm">Son 5 yıllık trend</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[var(--demir-slate)]">
                  92.729
                </p>
                <p className="text-xs text-green-600 font-semibold">
                  +%25 (2007'den beri)
                </p>
              </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="space-y-3">
              {[
                { year: 2024, pop: 92729, growth: 1.4 },
                { year: 2023, pop: 91486, growth: 1.5 },
                { year: 2022, pop: 90153, growth: 2.3 },
                { year: 2021, pop: 88105, growth: 1.7 },
                { year: 2020, pop: 86612, growth: 1.2 },
              ].map((item, idx) => (
                <div key={item.year} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 w-10">
                    {item.year}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--terracotta)] to-[var(--hazelnut)] rounded-full transition-all duration-500"
                      style={{ width: `${(item.pop / 100000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--demir-slate)] w-16 text-right">
                    {item.pop.toLocaleString("tr-TR")}
                  </span>
                  <span
                    className={`text-xs font-semibold w-12 text-right ${
                      item.growth > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    +%{item.growth}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Icon name="school" className="text-purple-500" />
            <span>Sakarya Üniversitesi Eğitim Fakültesi & MYO</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="route" className="text-blue-500" />
            <span>D-100 & TEM Otoyolu Erişimi</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="location_city" className="text-[var(--terracotta)]" />
            <span>İstanbul'a 150 km</span>
          </div>
        </div>
      </div>
    </section>
  );
}
