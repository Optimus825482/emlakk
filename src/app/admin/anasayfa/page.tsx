"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface HomepageSection {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isVisible: boolean;
  sortOrder: number;
}

const defaultSections: Omit<HomepageSection, "id">[] = [
  {
    key: "hero",
    name: "Giriş Bölümü",
    description:
      "Ana giriş bölümü - Mustafa Demir vizyonu ve aksiyon butonları",
    isVisible: true,
    sortOrder: 1,
  },
  {
    key: "manifesto",
    name: "Manifesto",
    description: "Şirket manifestosu - Vizyon beyanı",
    isVisible: true,
    sortOrder: 2,
  },
  {
    key: "investment_guide",
    name: "Rakamlarla Hendek",
    description: "Hendek istatistikleri - Nüfus, OSB, Üniversite verileri",
    isVisible: true,
    sortOrder: 3,
  },
  {
    key: "featured_listings",
    name: "Öne Çıkan İlanlar",
    description: "Seçili ilanların vitrin görünümü",
    isVisible: true,
    sortOrder: 4,
  },
  {
    key: "category_listings",
    name: "Kategori İlanları",
    description: "Sanayi, Tarım, Konut kategorileri",
    isVisible: true,
    sortOrder: 5,
  },
  {
    key: "ai_valuation_cta",
    name: "AI Değerleme CTA",
    description: "Yapay zeka değerleme çağrısı",
    isVisible: true,
    sortOrder: 6,
  },
];

export default function AdminAnasayfaPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const res = await fetch("/api/homepage-sections");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setSections(data);
      } else {
        // Varsayılan section'ları göster (henüz DB'de yoksa)
        setSections(defaultSections.map((s, i) => ({ ...s, id: `temp-${i}` })));
      }
    } catch (error) {
      console.error("Load error:", error);
      setSections(defaultSections.map((s, i) => ({ ...s, id: `temp-${i}` })));
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (section: HomepageSection) => {
    setSaving(section.key);
    const newVisibility = !section.isVisible;

    // Optimistic update
    setSections((prev) =>
      prev.map((s) =>
        s.key === section.key ? { ...s, isVisible: newVisibility } : s
      )
    );

    try {
      await fetch("/api/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: section.key, isVisible: newVisibility }),
      });
    } catch (error) {
      // Revert on error
      setSections((prev) =>
        prev.map((s) =>
          s.key === section.key ? { ...s, isVisible: !newVisibility } : s
        )
      );
      alert("Güncelleme hatası!");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const iconMap: Record<string, string> = {
    hero: "home",
    manifesto: "format_quote",
    investment_guide: "analytics",
    featured_listings: "star",
    category_listings: "category",
    ai_valuation_cta: "auto_awesome",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ana Sayfa Yönetimi</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ana sayfa bölümlerinin görünürlüğünü yönetin
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Icon name="info" className="text-blue-400" />
          <span className="text-sm text-blue-300">
            Giriş bölümü her zaman görünür
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-start gap-3">
          <Icon name="lightbulb" className="text-amber-400 text-xl mt-0.5" />
          <div>
            <p className="text-sm text-slate-300">
              Bu sayfadan ana sayfadaki bölümleri açıp kapatabilirsiniz. Her
              bölümün içeriği kendi yönetim sayfasından düzenlenir.
            </p>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Sayfa Bölümleri</h2>
        </div>

        <div className="divide-y divide-slate-700">
          {sections.map((section) => {
            const isHero = section.key === "hero";

            return (
              <div
                key={section.key}
                className={`flex items-center justify-between px-6 py-4 ${
                  !section.isVisible && !isHero ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      section.isVisible
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    <Icon
                      name={iconMap[section.key] || "widgets"}
                      className="text-2xl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{section.name}</h3>
                      {isHero && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 rounded">
                          Zorunlu
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-700 rounded">
                        {section.key}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort Order */}
                  <span className="text-xs text-slate-500 font-mono">
                    #{section.sortOrder}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => !isHero && toggleVisibility(section)}
                    disabled={isHero || saving === section.key}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isHero
                        ? "bg-blue-500/30 cursor-not-allowed"
                        : section.isVisible
                        ? "bg-emerald-500"
                        : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        section.isVisible ? "left-8" : "left-1"
                      }`}
                    />
                    {saving === section.key && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <QuickLink
          href="/admin/icerik"
          icon="article"
          title="Giriş İçeriği"
          description="Giriş bölümü metinleri"
        />
        <QuickLink
          href="/admin/hakkimizda"
          icon="format_quote"
          title="Manifesto"
          description="Vizyon beyanı düzenle"
        />
        <QuickLink
          href="/admin/hendek"
          icon="analytics"
          title="Hendek Verileri"
          description="İstatistikleri güncelle"
        />
        <QuickLink
          href="/admin/ilanlar"
          icon="real_estate_agent"
          title="İlanlar"
          description="Öne çıkan ilanları yönet"
        />
        <QuickLink
          href="/admin/icerik"
          icon="auto_awesome"
          title="AI Değerleme CTA"
          description="CTA içeriğini düzenle"
        />
        <QuickLink
          href="/"
          icon="visibility"
          title="Siteyi Görüntüle"
          description="Değişiklikleri önizle"
          external
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
  external,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  external?: boolean;
}) {
  const Component = external ? "a" : "a";
  return (
    <Component
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-700 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
        <Icon
          name={icon}
          className="text-slate-400 group-hover:text-emerald-400 transition-colors"
        />
      </div>
      <div>
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {external && (
        <Icon name="open_in_new" className="text-slate-600 ml-auto text-sm" />
      )}
    </Component>
  );
}
