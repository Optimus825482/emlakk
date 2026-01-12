"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface ContentCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: "emerald" | "blue" | "amber" | "purple";
  badge?: string;
}

const contentCards: ContentCard[] = [
  {
    title: "Ana Sayfa Hero",
    description: "Giriş bölümü, başlıklar, butonlar ve kurucu fotoğrafı",
    icon: "web",
    href: "/admin/icerik/hero",
    color: "emerald",
    badge: "Önemli",
  },
  {
    title: "Hakkımızda",
    description: "Kurucu profili, manifesto ve şirket değerleri",
    icon: "info",
    href: "/admin/hakkimizda",
    color: "blue",
  },
  {
    title: "Hendek Verileri",
    description: "Nüfus, OSB ve yatırım istatistikleri",
    icon: "analytics",
    href: "/admin/hendek",
    color: "amber",
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
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">İçerik Yönetimi</h1>
        <p className="text-slate-400 mt-1">
          Web sitesi içeriklerini buradan yönetebilirsiniz
        </p>
      </div>

      {/* Content Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentCards.map((card) => {
          const colors = colorClasses[card.color];
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative flex flex-col p-6 rounded-2xl border ${colors.border} ${colors.bg} transition-all duration-300 hover:shadow-lg`}
            >
              {/* Badge */}
              {card.badge && (
                <span
                  className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded ${colors.badge}`}
                >
                  {card.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}
              >
                <Icon name={card.icon} className="text-2xl" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-slate-400 text-sm flex-1">
                {card.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center gap-2 mt-4 text-slate-500 group-hover:text-emerald-400 transition-colors">
                <span className="text-sm font-medium">Düzenle</span>
                <Icon
                  name="arrow_forward"
                  className="text-lg group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="lightbulb" className="text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">İpucu</h4>
            <p className="text-slate-400 text-sm">
              Tüm içerik değişiklikleri anında web sitesine yansır. Değişiklik
              yaptıktan sonra ana sayfayı yenileyerek kontrol edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
