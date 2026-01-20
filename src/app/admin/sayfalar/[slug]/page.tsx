"use client";

import { useState, useEffect, use } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { ImageUpload } from "@/components/ui/image-upload";

// Sayfa konfigürasyonları - mevcut API'lere bağlı
const pageConfigs: Record<
  string,
  { name: string; icon: string; path: string }
> = {
  anasayfa: { name: "Ana Sayfa", icon: "home", path: "/" },
  hakkimizda: { name: "Hakkımızda", icon: "info", path: "/hakkimizda" },
  hendek: { name: "Hendek Verileri", icon: "analytics", path: "/" },
  iletisim: { name: "İletişim", icon: "mail", path: "/iletisim" },
  degerleme: { name: "AI Değerleme", icon: "auto_awesome", path: "/degerleme" },
  rehber: { name: "Yatırım Rehberi", icon: "menu_book", path: "/rehber" },
  randevu: { name: "Randevu", icon: "calendar_month", path: "/randevu" },
};

export default function SayfaDuzenleyiciPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const pageConfig = pageConfigs[slug];

  if (!pageConfig) {
    return (
      <div className="text-center py-12">
        <Icon name="error" className="text-5xl text-red-400 mb-4" />
        <p className="text-slate-400">Sayfa bulunamadı</p>
        <Link
          href="/admin/sayfalar"
          className="text-emerald-400 hover:underline mt-4 inline-block"
        >
          ← Geri Dön
        </Link>
      </div>
    );
  }

  // Sayfa tipine göre uygun editörü render et
  switch (slug) {
    case "anasayfa":
      return <AnasayfaEditor config={pageConfig} />;
    case "hakkimizda":
      return <HakkimizdaEditor config={pageConfig} />;
    case "hendek":
      return <HendekEditor config={pageConfig} />;
    case "rehber":
      return <RehberEditor config={pageConfig} />;
    case "iletisim":
      return <IletisimEditor config={pageConfig} />;
    case "randevu":
      return <RandevuEditor config={pageConfig} />;
    default:
      return <GenericPageEditor slug={slug} config={pageConfig} />;
  }
}

// ============ ANA SAYFA EDİTÖRÜ ============
function AnasayfaEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [heroData, setHeroData] = useState<Record<string, string>>({});
  const [manifestoData, setManifestoData] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [heroRes, manifestoRes] = await Promise.all([
        fetch("/api/hero"),
        fetch("/api/manifesto"),
      ]);
      const hero = await heroRes.json();
      const manifesto = await manifestoRes.json();
      setHeroData(hero || {});
      setManifestoData(manifesto || {});
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveHero() {
    setSaving("hero");
    try {
      await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroData),
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(null);
    }
  }

  async function saveManifesto() {
    setSaving("manifesto");
    try {
      await fetch("/api/manifesto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifestoData),
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: "hero", label: "Hero Bölümü", icon: "view_carousel" },
          { key: "manifesto", label: "Manifesto", icon: "article" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {activeTab === "hero" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Hero Bölümü</h3>
            <SaveButton onClick={saveHero} saving={saving === "hero"} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Badge"
              value={heroData.badge || ""}
              onChange={(v) => setHeroData({ ...heroData, badge: v })}
            />
            <InputField
              label="Başlık"
              value={heroData.title || ""}
              onChange={(v) => setHeroData({ ...heroData, title: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField
              label="Vurgulu Kelime"
              value={heroData.titleHighlight || ""}
              onChange={(v) => setHeroData({ ...heroData, titleHighlight: v })}
            />
            <InputField
              label="Aksan Kelime"
              value={heroData.titleAccent || ""}
              onChange={(v) => setHeroData({ ...heroData, titleAccent: v })}
            />
            <InputField
              label="Bitiş"
              value={heroData.titleEnd || ""}
              onChange={(v) => setHeroData({ ...heroData, titleEnd: v })}
            />
          </div>
          <TextareaField
            label="Açıklama"
            value={heroData.description || ""}
            onChange={(v) => setHeroData({ ...heroData, description: v })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="CTA Birincil"
              value={heroData.ctaPrimary || ""}
              onChange={(v) => setHeroData({ ...heroData, ctaPrimary: v })}
            />
            <InputField
              label="CTA İkincil"
              value={heroData.ctaSecondary || ""}
              onChange={(v) => setHeroData({ ...heroData, ctaSecondary: v })}
            />
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-4">
              Kurucu Bilgileri
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="İsim"
                value={heroData.founderName || ""}
                onChange={(v) => setHeroData({ ...heroData, founderName: v })}
              />
              <InputField
                label="Ünvan"
                value={heroData.founderTitle || ""}
                onChange={(v) => setHeroData({ ...heroData, founderTitle: v })}
              />
            </div>
            <div className="mt-4">
              <InputField
                label="Alıntı"
                value={heroData.founderQuote || ""}
                onChange={(v) => setHeroData({ ...heroData, founderQuote: v })}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Kurucu Görseli
              </label>
              <ImageUpload
                value={heroData.founderImage || ""}
                onChange={(url) =>
                  setHeroData({ ...heroData, founderImage: url })
                }
                folder="hero"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-4">
              Özellikler
            </h4>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-4 mb-4">
                <InputField
                  label={`Özellik ${i} İkon`}
                  value={heroData[`feature${i}Icon`] || ""}
                  onChange={(v) =>
                    setHeroData({ ...heroData, [`feature${i}Icon`]: v })
                  }
                />
                <InputField
                  label={`Özellik ${i} Başlık`}
                  value={heroData[`feature${i}Title`] || ""}
                  onChange={(v) =>
                    setHeroData({ ...heroData, [`feature${i}Title`]: v })
                  }
                />
                <InputField
                  label={`Özellik ${i} Açıklama`}
                  value={heroData[`feature${i}Desc`] || ""}
                  onChange={(v) =>
                    setHeroData({ ...heroData, [`feature${i}Desc`]: v })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manifesto Tab */}
      {activeTab === "manifesto" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Manifesto</h3>
            <SaveButton
              onClick={saveManifesto}
              saving={saving === "manifesto"}
            />
          </div>
          <InputField
            label="Kısa Başlık"
            value={manifestoData.shortTitle || ""}
            onChange={(v) =>
              setManifestoData({ ...manifestoData, shortTitle: v })
            }
          />
          <TextareaField
            label="Kısa Metin"
            value={manifestoData.shortText || ""}
            onChange={(v) =>
              setManifestoData({ ...manifestoData, shortText: v })
            }
            rows={3}
          />
          <InputField
            label="Tam Başlık"
            value={manifestoData.fullTitle || ""}
            onChange={(v) =>
              setManifestoData({ ...manifestoData, fullTitle: v })
            }
          />
          <TextareaField
            label="Tam Metin"
            value={manifestoData.fullText || ""}
            onChange={(v) =>
              setManifestoData({ ...manifestoData, fullText: v })
            }
            rows={6}
          />
          <InputField
            label="İmza"
            value={manifestoData.signature || ""}
            onChange={(v) =>
              setManifestoData({ ...manifestoData, signature: v })
            }
          />
        </div>
      )}
    </div>
  );
}

// ============ HAKKIMIZDA EDİTÖRÜ ============
function HakkimizdaEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [founder, setFounder] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/about");
      const data = await res.json();
      setFounder(data.founder || {});
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founder }),
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Kurucu Profili</h3>
          <SaveButton onClick={save} saving={saving} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="İsim"
            value={founder.name || ""}
            onChange={(v) => setFounder({ ...founder, name: v })}
          />
          <InputField
            label="Ünvan"
            value={founder.title || ""}
            onChange={(v) => setFounder({ ...founder, title: v })}
          />
        </div>
        <InputField
          label="Badge Metni"
          value={founder.badgeText || ""}
          onChange={(v) => setFounder({ ...founder, badgeText: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Hero Başlık"
            value={founder.heroTitle || ""}
            onChange={(v) => setFounder({ ...founder, heroTitle: v })}
          />
          <InputField
            label="Hero Vurgu"
            value={founder.heroTitleHighlight || ""}
            onChange={(v) => setFounder({ ...founder, heroTitleHighlight: v })}
          />
        </div>
        <InputField
          label="Anlatı Başlığı"
          value={founder.narrativeTitle || ""}
          onChange={(v) => setFounder({ ...founder, narrativeTitle: v })}
        />
        <TextareaField
          label="Anlatı Paragraf 1"
          value={founder.narrativeParagraph1 || ""}
          onChange={(v) => setFounder({ ...founder, narrativeParagraph1: v })}
          rows={4}
        />
        <TextareaField
          label="Anlatı Paragraf 2"
          value={founder.narrativeParagraph2 || ""}
          onChange={(v) => setFounder({ ...founder, narrativeParagraph2: v })}
          rows={4}
        />
        <InputField
          label="Ayırıcı Metin"
          value={founder.narrativeDividerText || ""}
          onChange={(v) => setFounder({ ...founder, narrativeDividerText: v })}
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Profil Görseli
          </label>
          <ImageUpload
            value={founder.image || ""}
            onChange={(url) => setFounder({ ...founder, image: url })}
            folder="founder"
          />
        </div>
      </div>
    </div>
  );
}

// ============ HENDEK VERİLERİ EDİTÖRÜ ============
interface HendekStat {
  id: string;
  key: string;
  label: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
  description: string | null;
  icon: string;
  color: string;
  source: string | null;
  year: number | null;
  isActive: boolean;
  sortOrder: number;
}

function HendekEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [stats, setStats] = useState<HendekStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [lastCrawl, setLastCrawl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/hendek-stats");
      const { data } = await res.json();
      setStats(data || []);

      // Son crawl zamanını kontrol et
      const crawlRes = await fetch("/api/hendek-stats/crawl-status");
      if (crawlRes.ok) {
        const crawlData = await crawlRes.json();
        setLastCrawl(crawlData.lastCrawl);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveStat(stat: HendekStat) {
    setSaving(stat.id);
    try {
      await fetch("/api/hendek-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stat),
      });
      await fetchData();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(null);
    }
  }

  async function runCrawler() {
    setCrawling(true);
    try {
      const res = await fetch("/api/hendek-stats/crawl", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        await fetchData();
        alert("Veriler başarıyla güncellendi!");
      } else {
        alert("Crawl hatası: " + (result.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Crawl error:", error);
      alert("Crawl sırasında hata oluştu");
    } finally {
      setCrawling(false);
    }
  }

  function updateStat(
    id: string,
    field: string,
    value: string | number | boolean | null
  ) {
    setStats((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      {/* Crawler Kontrol Paneli */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon name="cloud_sync" className="text-blue-400" />
              Otomatik Veri Güncelleme
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              TÜİK ve resmi kaynaklardan güncel verileri çek
            </p>
            {lastCrawl && (
              <p className="text-slate-500 text-xs mt-2">
                Son güncelleme: {new Date(lastCrawl).toLocaleString("tr-TR")}
              </p>
            )}
          </div>
          <button
            onClick={runCrawler}
            disabled={crawling}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            {crawling ? (
              <>
                <Icon name="sync" className="animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <Icon name="refresh" />
                Verileri Güncelle
              </>
            )}
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}
                >
                  <Icon name={stat.icon} className={`text-${stat.color}-400`} />
                </div>
                <div>
                  <h4 className="font-bold text-white">{stat.label}</h4>
                  <span className="text-xs text-slate-500">{stat.key}</span>
                </div>
              </div>
              <button
                onClick={() => saveStat(stat)}
                disabled={saving === stat.id}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving === stat.id ? (
                  <Icon name="sync" className="animate-spin" />
                ) : (
                  <Icon name="save" />
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Değer
                  </label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) =>
                      updateStat(stat.id, "value", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Sayısal
                  </label>
                  <input
                    type="number"
                    value={stat.numericValue || ""}
                    onChange={(e) =>
                      updateStat(
                        stat.id,
                        "numericValue",
                        parseInt(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={stat.description || ""}
                  onChange={(e) =>
                    updateStat(stat.id, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Kaynak: {stat.source || "Belirtilmemiş"}{" "}
                  {stat.year && `(${stat.year})`}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stat.isActive}
                    onChange={(e) =>
                      updateStat(stat.id, "isActive", e.target.checked)
                    }
                    className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400">Aktif</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="info" className="text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Veri Kaynakları</h4>
            <p className="text-slate-400 text-sm">
              Veriler TÜİK, Sakarya 2. OSB ve Hendek Belediyesi resmi
              kaynaklarından alınmaktadır. Otomatik güncelleme ile veriler
              periyodik olarak kontrol edilir.
            </p>
          </div>
        </div>
      </div>

      {/* Nüfus Geçmişi Grafiği */}
      <PopulationHistoryChart />
    </div>
  );
}

// ============ YATIRIM REHBERİ EDİTÖRÜ ============
interface RehberFeature {
  icon: string;
  title: string;
  description: string;
}

interface RehberContent {
  title: string;
  subtitle: string;
  description: string;
  comingSoonText: string;
  features: RehberFeature[];
  progressItems: { label: string; progress: number }[];
}

function RehberEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [content, setContent] = useState<RehberContent>({
    title: "",
    subtitle: "",
    description: "",
    comingSoonText: "",
    features: [],
    progressItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/content/investment_guide_page");
      if (res.ok) {
        const { data } = await res.json();
        if (data?.data) {
          setContent({
            title: data.data.title || "Hendek Yatırım Rehberi",
            subtitle:
              data.data.subtitle || "Veriye Dayalı Akıllı Yatırım Kararları",
            description: data.data.description || "",
            comingSoonText: data.data.comingSoonText || "",
            features: data.data.features || [],
            progressItems: data.data.progressItems || [
              { label: "Pazar Araştırması", progress: 100 },
              { label: "Veri Analizi", progress: 85 },
              { label: "İçerik Hazırlığı", progress: 60 },
              { label: "Tasarım & Geliştirme", progress: 40 },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/content/investment_guide_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: content }),
      });
      alert("Kaydedildi!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Kaydetme hatası!");
    } finally {
      setSaving(false);
    }
  }

  function updateFeature(
    index: number,
    field: keyof RehberFeature,
    value: string
  ) {
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  }

  function addFeature() {
    setContent({
      ...content,
      features: [
        ...content.features,
        { icon: "star", title: "", description: "" },
      ],
    });
  }

  function removeFeature(index: number) {
    setContent({
      ...content,
      features: content.features.filter((_, i) => i !== index),
    });
  }

  function updateProgress(
    index: number,
    field: "label" | "progress",
    value: string | number
  ) {
    const newItems = [...content.progressItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setContent({ ...content, progressItems: newItems });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: "genel", label: "Genel Bilgiler", icon: "info" },
          { key: "ozellikler", label: "Özellikler", icon: "grid_view" },
          { key: "ilerleme", label: "İlerleme Durumu", icon: "trending_up" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Genel Bilgiler Tab */}
      {activeTab === "genel" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Hero Bölümü</h3>
            <SaveButton onClick={save} saving={saving} />
          </div>

          <InputField
            label="Başlık"
            value={content.title}
            onChange={(v) => setContent({ ...content, title: v })}
          />
          <InputField
            label="Alt Başlık"
            value={content.subtitle}
            onChange={(v) => setContent({ ...content, subtitle: v })}
          />
          <TextareaField
            label="Açıklama"
            value={content.description}
            onChange={(v) => setContent({ ...content, description: v })}
            rows={5}
          />
          <TextareaField
            label="Yakında Yayında Metni"
            value={content.comingSoonText}
            onChange={(v) => setContent({ ...content, comingSoonText: v })}
            rows={3}
          />
        </div>
      )}

      {/* Özellikler Tab */}
      {activeTab === "ozellikler" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Rehber Özellikleri</h3>
            <div className="flex gap-2">
              <button
                onClick={addFeature}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
              >
                <Icon name="add" />
                Özellik Ekle
              </button>
              <SaveButton onClick={save} saving={saving} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Özellik {idx + 1}
                  </span>
                  <button
                    onClick={() => removeFeature(idx)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                  >
                    <Icon name="delete" className="text-sm" />
                  </button>
                </div>
                <InputField
                  label="İkon (Material Icon)"
                  value={feature.icon}
                  onChange={(v) => updateFeature(idx, "icon", v)}
                />
                <InputField
                  label="Başlık"
                  value={feature.title}
                  onChange={(v) => updateFeature(idx, "title", v)}
                />
                <TextareaField
                  label="Açıklama"
                  value={feature.description}
                  onChange={(v) => updateFeature(idx, "description", v)}
                  rows={2}
                />
              </div>
            ))}
          </div>

          {content.features.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="grid_view" className="text-4xl mb-2" />
              <p>Henüz özellik eklenmemiş</p>
            </div>
          )}
        </div>
      )}

      {/* İlerleme Durumu Tab */}
      {activeTab === "ilerleme" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">İlerleme Çubukları</h3>
            <SaveButton onClick={save} saving={saving} />
          </div>

          <div className="space-y-4">
            {content.progressItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4"
              >
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="col-span-2">
                    <InputField
                      label="Etiket"
                      value={item.label}
                      onChange={(v) => updateProgress(idx, "label", v)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      İlerleme (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.progress}
                      onChange={(e) =>
                        updateProgress(
                          idx,
                          "progress",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-emerald-400">{item.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.progress === 100
                          ? "bg-green-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hendek İstatistikleri Bilgi Kutusu */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="info" className="text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">
              Hendek İstatistikleri
            </h4>
            <p className="text-slate-400 text-sm mb-3">
              Yatırım Rehberi sayfasında gösterilen Hendek istatistikleri
              (nüfus, OSB, üniversite vb.) otomatik olarak{" "}
              <strong className="text-emerald-400">Hendek Verileri</strong>{" "}
              sayfasından çekilmektedir.
            </p>
            <Link
              href="/admin/sayfalar/hendek"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <Icon name="arrow_forward" />
              Hendek Verilerini Düzenle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ İLETİŞİM SAYFASI EDİTÖRÜ ============
interface IletisimContent {
  heroTitle: string;
  heroDescription: string;
  formTitle: string;
  formDescription: string;
  successTitle: string;
  successMessage: string;
  notificationEmail: string;
  features: { icon: string; title: string; description: string }[];
}

function IletisimEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [content, setContent] = useState<IletisimContent>({
    heroTitle: "Bize Ulaşın",
    heroDescription: "",
    formTitle: "Bize Mesaj Gönderin",
    formDescription: "Formu doldurun, en kısa sürede size dönüş yapalım.",
    successTitle: "Mesajınız Alındı!",
    successMessage: "En kısa sürede sizinle iletişime geçeceğiz.",
    notificationEmail: "",
    features: [],
  });
  const [settings, setSettings] = useState({
    phone: "",
    email: "",
    whatsapp: "",
    address: "",
    mapEmbedUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // İçerik
      const contentRes = await fetch("/api/content/contact_page");
      if (contentRes.ok) {
        const { data } = await contentRes.json();
        if (data?.data) {
          setContent({ ...content, ...data.data });
        }
      }

      // Site ayarları
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const { data } = await settingsRes.json();
        if (data) {
          setSettings({
            phone: data.phone || "",
            email: data.email || "",
            whatsapp: data.whatsapp || "",
            address: data.address || "",
            mapEmbedUrl: data.mapEmbedUrl || "",
          });
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    try {
      await fetch("/api/content/contact_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: content }),
      });
      alert("İçerik kaydedildi!");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      alert("Ayarlar kaydedildi!");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  function updateFeature(index: number, field: string, value: string) {
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  }

  function addFeature() {
    setContent({
      ...content,
      features: [
        ...content.features,
        { icon: "check", title: "", description: "" },
      ],
    });
  }

  function removeFeature(index: number) {
    setContent({
      ...content,
      features: content.features.filter((_, i) => i !== index),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: "genel", label: "Sayfa İçeriği", icon: "article" },
          {
            key: "iletisim",
            label: "İletişim Bilgileri",
            icon: "contact_phone",
          },
          {
            key: "bildirim",
            label: "Bildirim Ayarları",
            icon: "notifications",
          },
          { key: "ozellikler", label: "Alt Özellikler", icon: "grid_view" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sayfa İçeriği Tab */}
      {activeTab === "genel" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Hero & Form Metinleri
            </h3>
            <SaveButton onClick={saveContent} saving={saving} />
          </div>

          <InputField
            label="Hero Başlık"
            value={content.heroTitle}
            onChange={(v) => setContent({ ...content, heroTitle: v })}
          />
          <TextareaField
            label="Hero Açıklama"
            value={content.heroDescription}
            onChange={(v) => setContent({ ...content, heroDescription: v })}
            rows={3}
          />

          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-4">
              Form Metinleri
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Form Başlık"
                value={content.formTitle}
                onChange={(v) => setContent({ ...content, formTitle: v })}
              />
              <InputField
                label="Form Açıklama"
                value={content.formDescription}
                onChange={(v) => setContent({ ...content, formDescription: v })}
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-4">
              Başarı Mesajı
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Başarı Başlık"
                value={content.successTitle}
                onChange={(v) => setContent({ ...content, successTitle: v })}
              />
              <InputField
                label="Başarı Mesajı"
                value={content.successMessage}
                onChange={(v) => setContent({ ...content, successMessage: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* İletişim Bilgileri Tab */}
      {activeTab === "iletisim" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">İletişim Bilgileri</h3>
            <SaveButton onClick={saveSettings} saving={saving} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Telefon"
              value={settings.phone}
              onChange={(v) => setSettings({ ...settings, phone: v })}
            />
            <InputField
              label="E-posta"
              value={settings.email}
              onChange={(v) => setSettings({ ...settings, email: v })}
            />
          </div>
          <InputField
            label="WhatsApp Numarası"
            value={settings.whatsapp}
            onChange={(v) => setSettings({ ...settings, whatsapp: v })}
          />
          <TextareaField
            label="Adres"
            value={settings.address}
            onChange={(v) => setSettings({ ...settings, address: v })}
            rows={2}
          />
          <InputField
            label="Google Maps Embed URL"
            value={settings.mapEmbedUrl}
            onChange={(v) => setSettings({ ...settings, mapEmbedUrl: v })}
          />
          <p className="text-xs text-slate-500">
            Google Maps'ten "Paylaş" → "Haritayı yerleştir" → iframe src
            URL'sini kopyalayın
          </p>
        </div>
      )}

      {/* Bildirim Ayarları Tab */}
      {activeTab === "bildirim" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Form Bildirim Ayarları
            </h3>
            <SaveButton onClick={saveContent} saving={saving} />
          </div>

          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" className="text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">
                  İletişim formundan gelen mesajlar bu e-posta adresine
                  gönderilecek.
                </p>
              </div>
            </div>
          </div>

          <InputField
            label="Bildirim E-posta Adresi"
            value={content.notificationEmail}
            onChange={(v) => setContent({ ...content, notificationEmail: v })}
          />
          <p className="text-xs text-slate-500">
            Birden fazla e-posta için virgülle ayırın: ornek1@mail.com,
            ornek2@mail.com
          </p>
        </div>
      )}

      {/* Alt Özellikler Tab */}
      {activeTab === "ozellikler" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Sayfa Alt Özellikleri
            </h3>
            <div className="flex gap-2">
              <button
                onClick={addFeature}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
              >
                <Icon name="add" />
                Ekle
              </button>
              <SaveButton onClick={saveContent} saving={saving} />
            </div>
          </div>

          <div className="space-y-4">
            {content.features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">
                    Özellik {idx + 1}
                  </span>
                  <button
                    onClick={() => removeFeature(idx)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                  >
                    <Icon name="delete" className="text-sm" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputField
                    label="İkon"
                    value={feature.icon}
                    onChange={(v) => updateFeature(idx, "icon", v)}
                  />
                  <InputField
                    label="Başlık"
                    value={feature.title}
                    onChange={(v) => updateFeature(idx, "title", v)}
                  />
                  <InputField
                    label="Açıklama"
                    value={feature.description}
                    onChange={(v) => updateFeature(idx, "description", v)}
                  />
                </div>
              </div>
            ))}
          </div>

          {content.features.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="grid_view" className="text-4xl mb-2" />
              <p>Henüz özellik eklenmemiş</p>
              <p className="text-xs mt-1">
                Sayfanın altında gösterilecek özellik kartları
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ RANDEVU SAYFASI EDİTÖRÜ ============
interface RandevuContent {
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  successTitle: string;
  successMessage: string;
  notificationEmail: string;
  brokerName: string;
  brokerTitle: string;
  brokerPhone: string;
  brokerEmail: string;
  appointmentTypes: {
    key: string;
    label: string;
    icon: string;
    description: string;
    duration: string;
    isActive: boolean;
  }[];
}

function RandevuEditor({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  const [content, setContent] = useState<RandevuContent>({
    heroTitle: "Randevu",
    heroHighlight: "Oluşturun",
    heroDescription: "Mustafa Demir ile birebir görüşme için randevu alın.",
    successTitle: "Randevunuz Alındı!",
    successMessage: "En kısa sürede sizinle iletişime geçeceğiz.",
    notificationEmail: "",
    brokerName: "Mustafa Demir",
    brokerTitle: "Kurucu & Gayrimenkul Danışmanı",
    brokerPhone: "",
    brokerEmail: "",
    appointmentTypes: [
      {
        key: "kahve",
        label: "Kahve Sohbeti",
        icon: "coffee",
        description: "Tanışma ve genel danışmanlık",
        duration: "30 dk",
        isActive: true,
      },
      {
        key: "property_visit",
        label: "Mülk Gezisi",
        icon: "home",
        description: "Yerinde mülk inceleme",
        duration: "1 saat",
        isActive: true,
      },
      {
        key: "valuation",
        label: "Değerleme Randevusu",
        icon: "calculate",
        description: "Detaylı mülk değerleme",
        duration: "45 dk",
        isActive: true,
      },
      {
        key: "consultation",
        label: "Yatırım Danışmanlığı",
        icon: "trending_up",
        description: "Yatırım stratejisi görüşmesi",
        duration: "1 saat",
        isActive: true,
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/content/appointment_page");
      if (res.ok) {
        const { data } = await res.json();
        if (data?.data) {
          setContent({ ...content, ...data.data });
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/content/appointment_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: content }),
      });
      alert("Kaydedildi!");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  function updateAppointmentType(
    index: number,
    field: string,
    value: string | boolean
  ) {
    const newTypes = [...content.appointmentTypes];
    newTypes[index] = { ...newTypes[index], [field]: value };
    setContent({ ...content, appointmentTypes: newTypes });
  }

  function addAppointmentType() {
    setContent({
      ...content,
      appointmentTypes: [
        ...content.appointmentTypes,
        {
          key: `type_${Date.now()}`,
          label: "",
          icon: "event",
          description: "",
          duration: "30 dk",
          isActive: true,
        },
      ],
    });
  }

  function removeAppointmentType(index: number) {
    setContent({
      ...content,
      appointmentTypes: content.appointmentTypes.filter((_, i) => i !== index),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: "genel", label: "Sayfa İçeriği", icon: "article" },
          { key: "tipler", label: "Randevu Tipleri", icon: "event" },
          { key: "danisma", label: "Danışman Bilgileri", icon: "person" },
          {
            key: "bildirim",
            label: "Bildirim Ayarları",
            icon: "notifications",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-emerald-400 border-b-2 border-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sayfa İçeriği Tab */}
      {activeTab === "genel" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Hero & Mesajlar</h3>
            <SaveButton onClick={save} saving={saving} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Hero Başlık"
              value={content.heroTitle}
              onChange={(v) => setContent({ ...content, heroTitle: v })}
            />
            <InputField
              label="Vurgulu Kelime"
              value={content.heroHighlight}
              onChange={(v) => setContent({ ...content, heroHighlight: v })}
            />
          </div>
          <TextareaField
            label="Hero Açıklama"
            value={content.heroDescription}
            onChange={(v) => setContent({ ...content, heroDescription: v })}
            rows={2}
          />

          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-4">
              Başarı Mesajı
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Başarı Başlık"
                value={content.successTitle}
                onChange={(v) => setContent({ ...content, successTitle: v })}
              />
              <InputField
                label="Başarı Mesajı"
                value={content.successMessage}
                onChange={(v) => setContent({ ...content, successMessage: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Randevu Tipleri Tab */}
      {activeTab === "tipler" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Randevu Tipleri</h3>
            <div className="flex gap-2">
              <button
                onClick={addAppointmentType}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
              >
                <Icon name="add" />
                Tip Ekle
              </button>
              <SaveButton onClick={save} saving={saving} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.appointmentTypes.map((type, idx) => (
              <div
                key={idx}
                className={`bg-slate-900 border rounded-xl p-4 ${
                  type.isActive
                    ? "border-slate-700"
                    : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name={type.icon} className="text-emerald-400" />
                    <span className="text-xs text-slate-500">
                      Tip {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={type.isActive}
                        onChange={(e) =>
                          updateAppointmentType(
                            idx,
                            "isActive",
                            e.target.checked
                          )
                        }
                        className="rounded border-slate-600 bg-slate-900 text-emerald-500"
                      />
                      <span className="text-xs text-slate-400">Aktif</span>
                    </label>
                    <button
                      onClick={() => removeAppointmentType(idx)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                    >
                      <Icon name="delete" className="text-sm" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Başlık"
                      value={type.label}
                      onChange={(v) => updateAppointmentType(idx, "label", v)}
                    />
                    <InputField
                      label="İkon"
                      value={type.icon}
                      onChange={(v) => updateAppointmentType(idx, "icon", v)}
                    />
                  </div>
                  <InputField
                    label="Açıklama"
                    value={type.description}
                    onChange={(v) =>
                      updateAppointmentType(idx, "description", v)
                    }
                  />
                  <InputField
                    label="Süre"
                    value={type.duration}
                    onChange={(v) => updateAppointmentType(idx, "duration", v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danışman Bilgileri Tab */}
      {activeTab === "danisma" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Danışman Kartı</h3>
            <SaveButton onClick={save} saving={saving} />
          </div>

          <p className="text-sm text-slate-400">
            Randevu sayfasının altında gösterilen danışman bilgileri
          </p>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="İsim"
              value={content.brokerName}
              onChange={(v) => setContent({ ...content, brokerName: v })}
            />
            <InputField
              label="Ünvan"
              value={content.brokerTitle}
              onChange={(v) => setContent({ ...content, brokerTitle: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Telefon"
              value={content.brokerPhone}
              onChange={(v) => setContent({ ...content, brokerPhone: v })}
            />
            <InputField
              label="E-posta"
              value={content.brokerEmail}
              onChange={(v) => setContent({ ...content, brokerEmail: v })}
            />
          </div>
        </div>
      )}

      {/* Bildirim Ayarları Tab */}
      {activeTab === "bildirim" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Randevu Bildirim Ayarları
            </h3>
            <SaveButton onClick={save} saving={saving} />
          </div>

          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" className="text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">
                  Yeni randevu talepleri bu e-posta adresine bildirilecek.
                </p>
              </div>
            </div>
          </div>

          <InputField
            label="Bildirim E-posta Adresi"
            value={content.notificationEmail}
            onChange={(v) => setContent({ ...content, notificationEmail: v })}
          />
          <p className="text-xs text-slate-500">
            Birden fazla e-posta için virgülle ayırın: ornek1@mail.com,
            ornek2@mail.com
          </p>
        </div>
      )}
    </div>
  );
}

// ============ GENERİK SAYFA EDİTÖRÜ ============
function GenericPageEditor({
  slug,
  config,
}: {
  slug: string;
  config: { name: string; icon: string; path: string };
}) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/page-content?page=${slug}`);
      const { data } = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const merged: Record<string, string> = {};
        data.forEach((item: Record<string, string>) => {
          Object.keys(item).forEach((key) => {
            if (item[key]) merged[`${item.sectionKey}_${key}`] = item[key];
          });
        });
        setContent(merged);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/page-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          sectionKey: "hero",
          title: content.hero_title,
          subtitle: content.hero_subtitle,
          description: content.hero_description,
        }),
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader config={config} />

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Sayfa İçeriği</h3>
          <SaveButton onClick={save} saving={saving} />
        </div>

        <InputField
          label="Başlık"
          value={content.hero_title || ""}
          onChange={(v) => setContent({ ...content, hero_title: v })}
        />
        <InputField
          label="Alt Başlık"
          value={content.hero_subtitle || ""}
          onChange={(v) => setContent({ ...content, hero_subtitle: v })}
        />
        <TextareaField
          label="Açıklama"
          value={content.hero_description || ""}
          onChange={(v) => setContent({ ...content, hero_description: v })}
          rows={4}
        />
      </div>
    </div>
  );
}

// ============ YARDIMCI COMPONENTLER ============
function PageHeader({
  config,
}: {
  config: { name: string; icon: string; path: string };
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sayfalar"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Icon name={config.icon} className="text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">{config.name}</h2>
          </div>
          <p className="text-slate-500 text-sm">{config.path}</p>
        </div>
      </div>
      <a
        href={config.path}
        target="_blank"
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
      >
        <Icon name="open_in_new" />
        Önizle
      </a>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
}: {
  onClick: () => void;
  saving: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
    >
      {saving ? (
        <>
          <Icon name="sync" className="animate-spin" />
          Kaydediliyor...
        </>
      ) : (
        <>
          <Icon name="save" />
          Kaydet
        </>
      )}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
      />
    </div>
  );
}

// ============ NÜFUS GEÇMİŞİ GRAFİĞİ ============
interface PopulationData {
  id: string;
  year: number;
  totalPopulation: number;
  malePopulation: number | null;
  femalePopulation: number | null;
  growthRate: string | null;
}

function PopulationHistoryChart() {
  const [data, setData] = useState<PopulationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  useEffect(() => {
    fetchPopulationData();
  }, []);

  async function fetchPopulationData() {
    try {
      const res = await fetch("/api/hendek-stats?type=population");
      const { data: populationData } = await res.json();
      // Yıla göre artan sırala (eski -> yeni)
      const sorted = (populationData || []).sort(
        (a: PopulationData, b: PopulationData) => a.year - b.year
      );
      setData(sorted);
    } catch (error) {
      console.error("Population fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center h-48">
          <Icon
            name="sync"
            className="text-2xl text-emerald-400 animate-spin"
          />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="show_chart" className="text-emerald-400 text-xl" />
          <h3 className="text-lg font-bold text-white">
            Nüfus Geçmişi (2000-2024)
          </h3>
        </div>
        <p className="text-slate-400 text-center py-8">
          Nüfus verisi bulunamadı
        </p>
      </div>
    );
  }

  const maxPopulation = Math.max(...data.map((d) => d.totalPopulation));
  const minPopulation = Math.min(...data.map((d) => d.totalPopulation));
  const latestData = data[data.length - 1];
  const oldestData = data[0];
  const totalGrowth =
    latestData && oldestData
      ? (
          ((latestData.totalPopulation - oldestData.totalPopulation) /
            oldestData.totalPopulation) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Icon name="show_chart" className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Nüfus Geçmişi (2000-2024)
            </h3>
            <p className="text-slate-500 text-sm">25 yıllık nüfus değişimi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("chart")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "chart"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Icon name="bar_chart" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Icon name="table_rows" />
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">Güncel Nüfus</p>
          <p className="text-white font-bold text-lg">
            {latestData?.totalPopulation.toLocaleString("tr-TR")}
          </p>
          <p className="text-slate-500 text-xs">{latestData?.year}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">Başlangıç</p>
          <p className="text-white font-bold text-lg">
            {oldestData?.totalPopulation.toLocaleString("tr-TR")}
          </p>
          <p className="text-slate-500 text-xs">{oldestData?.year}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">Toplam Artış</p>
          <p className="text-emerald-400 font-bold text-lg">%{totalGrowth}</p>
          <p className="text-slate-500 text-xs">25 yılda</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">Veri Sayısı</p>
          <p className="text-white font-bold text-lg">{data.length}</p>
          <p className="text-slate-500 text-xs">yıl</p>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === "chart" && (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="flex items-end gap-1 h-48 px-2">
            {data.map((item, index) => {
              const height =
                ((item.totalPopulation - minPopulation) /
                  (maxPopulation - minPopulation)) *
                100;
              const normalizedHeight = Math.max(height, 5); // Minimum %5 yükseklik
              const isLatest = index === data.length - 1;
              const showLabel = index % 5 === 0 || isLatest; // Her 5 yılda bir veya son yıl

              return (
                <div
                  key={item.id}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                      <p className="text-white font-bold">{item.year}</p>
                      <p className="text-slate-300">
                        {item.totalPopulation.toLocaleString("tr-TR")} kişi
                      </p>
                      {item.growthRate && (
                        <p
                          className={`${
                            parseFloat(item.growthRate) >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(item.growthRate) >= 0 ? "+" : ""}
                          {item.growthRate}%
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isLatest
                        ? "bg-emerald-500 group-hover:bg-emerald-400"
                        : "bg-slate-600 group-hover:bg-slate-500"
                    }`}
                    style={{ height: `${normalizedHeight}%` }}
                  />
                  {/* Year Label */}
                  {showLabel && (
                    <span className="text-[10px] text-slate-500 mt-1 transform -rotate-45 origin-top-left">
                      {item.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-600 rounded" />
              Geçmiş Yıllar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded" />
              Güncel ({latestData?.year})
            </span>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 px-3">Yıl</th>
                <th className="text-right py-2 px-3">Toplam</th>
                <th className="text-right py-2 px-3">Erkek</th>
                <th className="text-right py-2 px-3">Kadın</th>
                <th className="text-right py-2 px-3">Artış</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-2 px-3 text-white font-medium">
                    {item.year}
                  </td>
                  <td className="py-2 px-3 text-right text-white">
                    {item.totalPopulation.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-blue-400">
                    {item.malePopulation?.toLocaleString("tr-TR") || "-"}
                  </td>
                  <td className="py-2 px-3 text-right text-pink-400">
                    {item.femalePopulation?.toLocaleString("tr-TR") || "-"}
                  </td>
                  <td
                    className={`py-2 px-3 text-right ${
                      item.growthRate && parseFloat(item.growthRate) >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.growthRate
                      ? `${parseFloat(item.growthRate) >= 0 ? "+" : ""}${
                          item.growthRate
                        }%`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kaynak Bilgisi */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi</span>
        <span>Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</span>
      </div>
    </div>
  );
}
