"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface District {
  value: string;
  label: string;
  count: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

interface Stats {
  categories: Category[];
  total: number;
  lastUpdate: string | null;
  district: string;
}

const colorClasses: Record<
  string,
  { bg: string; border: string; text: string; hover: string }
> = {
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    hover: "hover:border-blue-500/50",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    hover: "hover:border-cyan-500/50",
  },
  green: {
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    text: "text-green-400",
    hover: "hover:border-green-500/50",
  },
  purple: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    text: "text-purple-400",
    hover: "hover:border-purple-500/50",
  },
  orange: {
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
    hover: "hover:border-orange-500/50",
  },
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
    hover: "hover:border-red-500/50",
  },
};

export function SahibindenStatsClient() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [stats, setStats] = useState<Stats>({
    categories: [],
    total: 0,
    lastUpdate: null,
    district: "all",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistricts();
    fetchStats("all");
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/sahibinden/districts");
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error("Districts fetch error:", error);
    }
  };

  const fetchStats = async (district: string) => {
    try {
      setLoading(true);
      const url =
        district === "all"
          ? "/api/sahibinden/category-stats"
          : `/api/sahibinden/category-stats?district=${district}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setStats({
          categories: data.data.categories || [],
          total: data.data.total || 0,
          lastUpdate: data.data.lastUpdate || null,
          district,
        });
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    fetchStats(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Bilinmiyor";
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Kategori ID'sinden category ve transaction'ı parse et
  const parseCategoryId = (id: string) => {
    const [category, transaction] = id.split("_");
    return { category, transaction };
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/30 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Icon
                name="real_estate_agent"
                className="text-2xl text-blue-400"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                Sahibinden.com Takip
              </h3>
              <p className="text-slate-400 text-xs">
                Kategori bazlı ilan sayıları ve istatistikler
              </p>
            </div>
          </div>
          <Link
            href={`/admin/sahibinden-ilanlar${selectedDistrict !== "all" ? `?district=${selectedDistrict}` : ""}`}
            className="text-slate-500 hover:text-blue-400 hover:translate-x-1 transition-all"
          >
            <Icon name="arrow_forward" />
          </Link>
        </div>

        {/* İlçe Seçimi */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs font-medium">İlçe</label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white hover:border-blue-500/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm İlçeler</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.value} value={district.label}>
                  {district.label} ({district.count.toLocaleString("tr-TR")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toplam İlan Sayısı */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            ) : (
              <>
                <span className="text-4xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                  {stats.total.toLocaleString("tr-TR")}
                </span>
                <span className="text-slate-400 text-sm">toplam ilan</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Icon name="schedule" className="text-slate-500 text-base" />
            <span className="text-slate-400">Son güncelleme:</span>
            <span className="text-slate-300 font-medium">
              {formatDate(stats.lastUpdate)}
            </span>
          </div>
        </div>

        {/* Kategori Kartları */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.categories.map((category) => {
              const colors = colorClasses[category.color] || colorClasses.blue;
              const { category: cat, transaction: trans } = parseCategoryId(
                category.id,
              );
              const queryParams = new URLSearchParams({
                category: cat,
                transaction: trans,
              });
              if (selectedDistrict !== "all") {
                queryParams.set("district", selectedDistrict);
              }

              return (
                <Link
                  key={category.id}
                  href={`/admin/sahibinden-ilanlar?${queryParams.toString()}`}
                  className={`group/card relative overflow-hidden bg-slate-900/50 border ${colors.border} ${colors.hover} rounded-lg p-4 transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}
                      >
                        <Icon
                          name={category.icon}
                          className={`text-xl ${colors.text}`}
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm">
                          {category.label}
                        </h4>
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Icon name="trending_up" className="text-xs" />
                          Aktif ilan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {category.count.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-700/50">
          <Link
            href={`/admin/sahibinden-ilanlar${selectedDistrict !== "all" ? `?district=${selectedDistrict}` : ""}`}
            className="flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
          >
            <Icon name="visibility" className="text-base" />
            <span>Tüm ilanları detaylı listele ve filtrele</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
