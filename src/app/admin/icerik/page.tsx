"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ContentCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: "emerald" | "blue" | "amber" | "purple";
  badge?: string;
  aiStatus?: string;
}

const contentCards: ContentCard[] = [
  {
    title: "Ana Sayfa Hero",
    description: "Giriş bölümü, başlıklar, butonlar ve kurucu fotoğrafı",
    icon: "web",
    href: "/admin/icerik/hero",
    color: "emerald",
    badge: "Önemli",
    aiStatus: "Optimize Edildi",
  },
  {
    title: "Hakkımızda",
    description: "Kurucu profili, manifesto ve şirket değerleri",
    icon: "info",
    href: "/admin/hakkimizda",
    color: "blue",
    aiStatus: "Güncelleme Gerekli",
  },
  {
    title: "Hendek Verileri",
    description: "Nüfus, OSB ve yatırım istatistikleri",
    icon: "analytics",
    href: "/admin/hendek",
    color: "amber",
    badge: "Dinamik",
  },
  {
    title: "Ekip Üyeleri",
    description: "Çalışan profilleri ve iletişim bilgileri",
    icon: "groups",
    href: "/admin/ekip",
    color: "purple",
  },
];

const colorClasses = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    icon: "bg-emerald-500/20 text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    icon: "bg-blue-500/20 text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    icon: "bg-amber-500/20 text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    icon: "bg-purple-500/20 text-purple-400",
    badge: "bg-purple-500/20 text-purple-400",
  },
};

export default function IcerikYonetimiPage() {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAiAudit = () => {
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header with AI Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            İçerik Yönetimi
          </h1>
          <p className="text-slate-400 mt-1 max-w-xl">
            Web sitesi içeriklerini yönetin ve Gemini AI ile etkileşim
            oranlarını artırmak için optimize edin.
          </p>
        </div>
        <button
          onClick={handleAiAudit}
          disabled={analyzing}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-xl shadow-emerald-500/10",
            analyzing
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white hover:-translate-y-0.5",
          )}
        >
          <Icon
            name={analyzing ? "sync" : "auto_fix_high"}
            className={cn("text-lg", analyzing && "animate-spin")}
          />
          {analyzing ? "Analiz Ediliyor..." : "AI İçerik Denetimi Yap"}
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Icon name="visibility" className="text-xl" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Görüntülenme
            </p>
            <p className="text-xl font-bold text-white">12.4K</p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Icon name="psychology" className="text-xl" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              AI Skor
            </p>
            <p className="text-xl font-bold text-white">88/100</p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Icon name="pending_actions" className="text-xl" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Bekleyen İş
            </p>
            <p className="text-xl font-bold text-white">3 Bölüm</p>
          </div>
        </div>
      </div>

      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contentCards.map((card) => {
          const colors = colorClasses[card.color];
          return (
            <Link
              key={card.href}
              href={card.href}
              className={cn(
                "group relative flex flex-col p-8 rounded-3xl border transition-all duration-500",
                colors.border,
                colors.bg,
                "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20",
              )}
            >
              {/* Badge & AI Status */}
              <div className="absolute top-6 right-6 flex gap-2">
                {card.aiStatus && (
                  <span
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1",
                      card.aiStatus.includes("Optimize")
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400",
                    )}
                  >
                    <Icon
                      name={
                        card.aiStatus.includes("Optimize")
                          ? "verified"
                          : "error"
                      }
                      className="text-xs"
                    />
                    {card.aiStatus}
                  </span>
                )}
                {card.badge && (
                  <span
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg",
                      colors.badge,
                    )}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              {/* Icon Container with Glassmorphism */}
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                  colors.icon,
                )}
              >
                <Icon name={card.icon} className="text-3xl" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-[90%]">
                  {card.description}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-emerald-400 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Yönet
                  </span>
                  <Icon
                    name="arrow_forward"
                    className="text-lg group-hover:translate-x-1 transition-transform"
                  />
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold overflow-hidden"
                    >
                      <img
                        src={`https://i.pravatar.cc/100?u=user${i + card.color}`}
                        alt="U"
                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* AI Suggestion Box */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 -translate-y-1/2 translate-x-1/4">
          <Icon name="auto_fix_high" className="text-[200px] text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Icon name="lightbulb" className="text-4xl text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-white mb-2">
              AI Proaktif Öneri
            </h4>
            <p className="text-slate-300 text-lg leading-relaxed">
              "Hendek OSB'deki son genişleme verileri güncellendi.{" "}
              <span className="text-emerald-400 font-bold">
                'Hendek Verileri'
              </span>{" "}
              sayfasındaki yatırım istatistiklerini bu verilerle
              zenginleştirmek, Google aramalarında %15 daha fazla görünürlük
              sağlayabilir."
            </p>
            <div className="flex gap-4 mt-6">
              <button className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
                Şimdi Uygula
              </button>
              <button className="px-5 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                Detayları Gör
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
