"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";

interface PageInfo {
  slug: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  apiEndpoint: string;
  sections: string[];
}

// Web sitesindeki sayfalar - mevcut API'lere bağlı
const pages: PageInfo[] = [
  {
    slug: "anasayfa",
    name: "Ana Sayfa",
    path: "/",
    icon: "home",
    description: "Hero, Manifesto ve Ana Sayfa bölümleri",
    apiEndpoint: "/api/hero",
    sections: ["Hero Bölümü", "Manifesto", "Rakamlarla Hendek"],
  },
  {
    slug: "hakkimizda",
    name: "Hakkımızda",
    path: "/hakkimizda",
    icon: "info",
    description: "Kurucu profili ve vizyon bilgileri",
    apiEndpoint: "/api/about",
    sections: ["Kurucu Profili", "Vizyon Sütunları", "Manifesto"],
  },
  {
    slug: "hendek",
    name: "Hendek Verileri",
    path: "/",
    icon: "analytics",
    description: "Nüfus, OSB ve istatistik verileri",
    apiEndpoint: "/api/hendek-stats",
    sections: ["Genel İstatistikler", "OSB Verileri", "Nüfus Geçmişi"],
  },
  {
    slug: "iletisim",
    name: "İletişim",
    path: "/iletisim",
    icon: "mail",
    description: "İletişim formu ve bilgileri",
    apiEndpoint: "/api/content/contact_page",
    sections: [
      "Hero Bölümü",
      "İletişim Bilgileri",
      "Bildirim Ayarları",
      "Alt Özellikler",
    ],
  },
  {
    slug: "degerleme",
    name: "AI Değerleme",
    path: "/degerleme",
    icon: "auto_awesome",
    description: "Yapay zeka değerleme sayfası",
    apiEndpoint: "/api/page-content",
    sections: ["Hero Bölümü", "Adımlar", "Sonuç Ekranı"],
  },
  {
    slug: "rehber",
    name: "Yatırım Rehberi",
    path: "/rehber",
    icon: "menu_book",
    description: "Hendek yatırım rehberi içerikleri",
    apiEndpoint: "/api/content/investment_guide_page",
    sections: ["Hero Bölümü", "Özellikler", "İlerleme Durumu"],
  },
  {
    slug: "randevu",
    name: "Randevu",
    path: "/randevu",
    icon: "calendar_month",
    description: "Randevu alma sayfası ayarları",
    apiEndpoint: "/api/content/appointment_page",
    sections: [
      "Hero Bölümü",
      "Randevu Tipleri",
      "Danışman Bilgileri",
      "Bildirim Ayarları",
    ],
  },
];

export default function SayfalarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Web Sitesi Sayfa Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Tüm sayfa içeriklerini tek yerden yönetin
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
        >
          <Icon name="open_in_new" />
          Siteyi Görüntüle
        </a>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/admin/sayfalar/${page.slug}`}
            className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                <Icon
                  name={page.icon}
                  className="text-2xl text-slate-400 group-hover:text-emerald-400 transition-colors"
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {page.path}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
              {page.name}
            </h3>
            <p className="text-slate-500 text-sm mb-4">{page.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Icon name="layers" className="text-slate-600 text-sm" />
                <span className="text-xs text-slate-500">
                  {page.sections.length} bölüm
                </span>
              </div>
              <Icon
                name="arrow_forward"
                className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="lightbulb" className="text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Nasıl Çalışır?</h4>
            <p className="text-slate-400 text-sm">
              Her sayfanın içeriğini düzenlemek için sayfaya tıklayın.
              Değişiklikler anında web sitesine yansır. Görsel yüklemek için
              sürükle-bırak kullanabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
