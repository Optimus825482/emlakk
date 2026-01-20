"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface SeoMetadata {
  id: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[] | null;
  focusKeyword: string | null;
  seoScore: number | null;
  seoAnalysis: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } | null;
  isAiGenerated: boolean | null;
  updatedAt: string;
}

interface SeoSettings {
  siteName: string;
  siteDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  autoGenerateSeo: boolean;
  targetRegion: string;
  industryKeywords: string[];
}

type TabType = "overview" | "pages" | "listings" | "settings" | "logs";

export default function SeoManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [seoData, setSeoData] = useState<SeoMetadata[]>([]);
  const [settings, setSettings] = useState<SeoSettings>({
    siteName: "Demir Gayrimenkul",
    siteDescription: "Hendek ve Sakarya bölgesinin güvenilir emlak danışmanı",
    defaultOgImage: "",
    twitterHandle: "",
    googleSiteVerification: "",
    googleAnalyticsId: "",
    autoGenerateSeo: true,
    targetRegion: "Hendek, Sakarya",
    industryKeywords: [
      "emlak",
      "gayrimenkul",
      "satılık",
      "kiralık",
      "arsa",
      "daire",
    ],
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SeoMetadata | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchSeoData();
  }, []);

  async function fetchSeoData() {
    try {
      const res = await fetch("/api/seo");
      const data = await res.json();
      setSeoData(data.data || []);
    } catch (error) {
      console.error("SEO verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }

  // Toplu SEO Oluştur
  async function handleBulkGenerate() {
    setBulkGenerating(true);
    setBulkProgress({ current: 0, total: 0 });

    try {
      // Önce tüm ilanları getir
      const listingsRes = await fetch("/api/listings?limit=100&status=active");
      const listingsData = await listingsRes.json();
      const listings = listingsData.data || [];

      setBulkProgress({ current: 0, total: listings.length });

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        try {
          await fetch("/api/seo/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityType: "listing",
              entityId: listing.id,
              title: listing.title,
              content: listing.description || listing.title,
              location: listing.address || listing.district,
              category: listing.type,
              price: parseInt(listing.price) || undefined,
              features: listing.features,
            }),
          });
        } catch (err) {
          console.error(`SEO oluşturulamadı: ${listing.id}`, err);
        }
        setBulkProgress({ current: i + 1, total: listings.length });
      }

      // Verileri yenile
      await fetchSeoData();
    } catch (error) {
      console.error("Toplu SEO oluşturma hatası:", error);
    } finally {
      setBulkGenerating(false);
    }
  }

  async function regenerateSeo(item: SeoMetadata) {
    setSaving(true);
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: item.entityType,
          entityId: item.entityId,
          title: item.entityTitle || item.entityId,
          content: item.metaDescription || "",
        }),
      });

      if (res.ok) {
        await fetchSeoData();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("SEO yenilenemedi:", error);
    } finally {
      setSaving(false);
    }
  }

  async function saveSeoItem(item: SeoMetadata) {
    setSaving(true);
    try {
      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        await fetchSeoData();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("SEO kaydedilemedi:", error);
    } finally {
      setSaving(false);
    }
  }

  // İstatistikler
  const stats = {
    total: seoData.length,
    optimized: seoData.filter((d) => (d.seoScore || 0) >= 70).length,
    needsWork: seoData.filter((d) => (d.seoScore || 0) < 70).length,
    avgScore:
      seoData.length > 0
        ? Math.round(
            seoData.reduce((acc, d) => acc + (d.seoScore || 0), 0) /
              seoData.length,
          )
        : 0,
    aiGenerated: seoData.filter((d) => d.isAiGenerated).length,
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Genel Bakış", icon: "dashboard" },
    { id: "pages", label: "Sayfalar", icon: "web" },
    { id: "listings", label: "İlanlar", icon: "real_estate_agent" },
    { id: "settings", label: "Ayarlar", icon: "settings" },
    { id: "logs", label: "İşlem Geçmişi", icon: "history" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon name="travel_explore" className="text-emerald-400" />
            SEO Yönetimi
          </h1>
          <p className="text-slate-400 mt-1">
            DeepSeek-Reasoner destekli otomatik SEO optimizasyonu
          </p>
        </div>
        <button
          onClick={handleBulkGenerate}
          disabled={bulkGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          {bulkGenerating ? (
            <>
              <Icon name="progress_activity" className="animate-spin" />
              {bulkProgress.current}/{bulkProgress.total} İşleniyor...
            </>
          ) : (
            <>
              <Icon name="auto_fix_high" />
              Toplu SEO Oluştur
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors",
              activeTab === tab.id
                ? "bg-slate-700 text-emerald-400 border-b-2 border-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50",
            )}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon
            name="progress_activity"
            className="text-4xl text-emerald-400 animate-spin"
          />
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <OverviewTab stats={stats} seoData={seoData} />
          )}
          {activeTab === "pages" && (
            <SeoListTab
              data={seoData.filter((d) => d.entityType === "page")}
              onSelect={setSelectedItem}
              onRegenerate={regenerateSeo}
            />
          )}
          {activeTab === "listings" && (
            <SeoListTab
              data={seoData.filter((d) => d.entityType === "listing")}
              onSelect={setSelectedItem}
              onRegenerate={regenerateSeo}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab settings={settings} setSettings={setSettings} />
          )}
          {activeTab === "logs" && <LogsTab />}
        </>
      )}

      {/* Edit Modal */}
      {selectedItem && (
        <SeoEditModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={saveSeoItem}
          onRegenerate={regenerateSeo}
          saving={saving}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  stats,
  seoData,
}: {
  stats: {
    total: number;
    optimized: number;
    needsWork: number;
    avgScore: number;
    aiGenerated: number;
  };
  seoData: SeoMetadata[];
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          icon="analytics"
          label="Toplam Kayıt"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon="check_circle"
          label="Optimize Edilmiş"
          value={stats.optimized}
          color="green"
          subtitle="Skor ≥ 70"
        />
        <StatCard
          icon="warning"
          label="İyileştirme Gerekli"
          value={stats.needsWork}
          color="yellow"
          subtitle="Skor < 70"
        />
        <StatCard
          icon="speed"
          label="Ortalama Skor"
          value={stats.avgScore}
          color="purple"
          suffix="/100"
        />
        <StatCard
          icon="smart_toy"
          label="AI Oluşturulmuş"
          value={stats.aiGenerated}
          color="emerald"
        />
      </div>

      {/* SEO Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="pie_chart" className="text-emerald-400" />
            SEO Skor Dağılımı
          </h3>
          <div className="space-y-3">
            <ScoreBar
              label="Mükemmel (90-100)"
              count={seoData.filter((d) => (d.seoScore || 0) >= 90).length}
              total={stats.total}
              color="emerald"
            />
            <ScoreBar
              label="İyi (70-89)"
              count={
                seoData.filter(
                  (d) => (d.seoScore || 0) >= 70 && (d.seoScore || 0) < 90,
                ).length
              }
              total={stats.total}
              color="green"
            />
            <ScoreBar
              label="Orta (50-69)"
              count={
                seoData.filter(
                  (d) => (d.seoScore || 0) >= 50 && (d.seoScore || 0) < 70,
                ).length
              }
              total={stats.total}
              color="yellow"
            />
            <ScoreBar
              label="Zayıf (0-49)"
              count={seoData.filter((d) => (d.seoScore || 0) < 50).length}
              total={stats.total}
              color="red"
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="tips_and_updates" className="text-amber-400" />
            SEO İpuçları
          </h3>
          <div className="space-y-3 text-sm">
            <TipItem
              icon="title"
              text="Meta başlıklar 50-60 karakter arasında olmalı"
            />
            <TipItem
              icon="description"
              text="Meta açıklamalar 150-160 karakter arasında olmalı"
            />
            <TipItem
              icon="key"
              text="Her sayfa için odak anahtar kelime belirleyin"
            />
            <TipItem
              icon="image"
              text="Open Graph görselleri 1200x630px olmalı"
            />
            <TipItem icon="code" text="Structured Data (JSON-LD) ekleyin" />
          </div>
        </div>
      </div>

      {/* Recent SEO Updates */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="update" className="text-blue-400" />
          Son SEO Güncellemeleri
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-4">Sayfa/İlan</th>
                <th className="text-left py-3 px-4">Tip</th>
                <th className="text-left py-3 px-4">Skor</th>
                <th className="text-left py-3 px-4">AI</th>
                <th className="text-left py-3 px-4">Güncelleme</th>
              </tr>
            </thead>
            <tbody>
              {seoData.slice(0, 5).map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-3 px-4 text-white">
                    {item.entityTitle || item.entityId}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        item.entityType === "page"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400",
                      )}
                    >
                      {item.entityType === "page" ? "Sayfa" : "İlan"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SeoScoreBadge score={item.seoScore || 0} />
                  </td>
                  <td className="py-3 px-4">
                    {item.isAiGenerated ? (
                      <Icon name="smart_toy" className="text-emerald-400" />
                    ) : (
                      <Icon name="edit" className="text-slate-500" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// SEO List Tab Component
function SeoListTab({
  data,
  onSelect,
  onRegenerate,
}: {
  data: SeoMetadata[];
  onSelect: (item: SeoMetadata) => void;
  onRegenerate: (item: SeoMetadata) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
        <Icon name="search_off" className="text-6xl text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          SEO Kaydı Bulunamadı
        </h3>
        <p className="text-slate-400">
          Bu kategoride henüz SEO verisi oluşturulmamış.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700 bg-slate-800/50">
            <th className="text-left py-4 px-4">Başlık</th>
            <th className="text-left py-4 px-4">Meta Title</th>
            <th className="text-left py-4 px-4">Odak Kelime</th>
            <th className="text-center py-4 px-4">Skor</th>
            <th className="text-center py-4 px-4">AI</th>
            <th className="text-right py-4 px-4">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-700/50 hover:bg-slate-700/30"
            >
              <td className="py-4 px-4">
                <div className="text-white font-medium">
                  {item.entityTitle || item.entityId}
                </div>
                <div className="text-slate-500 text-xs">{item.entityId}</div>
              </td>
              <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                {item.metaTitle || "-"}
              </td>
              <td className="py-4 px-4">
                {item.focusKeyword && (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                    {item.focusKeyword}
                  </span>
                )}
              </td>
              <td className="py-4 px-4 text-center">
                <SeoScoreBadge score={item.seoScore || 0} />
              </td>
              <td className="py-4 px-4 text-center">
                {item.isAiGenerated ? (
                  <Icon name="smart_toy" className="text-emerald-400" />
                ) : (
                  <Icon name="edit" className="text-slate-500" />
                )}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onSelect(item)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Icon name="edit" className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => onRegenerate(item)}
                    className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    title="AI ile Yeniden Oluştur"
                  >
                    <Icon name="auto_fix_high" className="text-emerald-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({
  settings,
  setSettings,
}: {
  settings: SeoSettings;
  setSettings: (s: SeoSettings) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Ayarlar kaydedilemedi:", error);
    } finally {
      setSaving(false);
    }
  }

  function addKeyword() {
    if (
      newKeyword.trim() &&
      !settings.industryKeywords.includes(newKeyword.trim())
    ) {
      setSettings({
        ...settings,
        industryKeywords: [...settings.industryKeywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  }

  function removeKeyword(keyword: string) {
    setSettings({
      ...settings,
      industryKeywords: settings.industryKeywords.filter((k) => k !== keyword),
    });
  }

  return (
    <div className="space-y-6">
      {/* Site Bilgileri */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="language" className="text-blue-400" />
          Site Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Site Adı
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Hedef Bölge
            </label>
            <input
              type="text"
              value={settings.targetRegion}
              onChange={(e) =>
                setSettings({ ...settings, targetRegion: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-2">
              Site Açıklaması
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) =>
                setSettings({ ...settings, siteDescription: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Google Entegrasyonu */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="search" className="text-red-400" />
          Google Entegrasyonu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Google Site Verification
            </label>
            <input
              type="text"
              value={settings.googleSiteVerification}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  googleSiteVerification: e.target.value,
                })
              }
              placeholder="google-site-verification=..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Google Analytics ID
            </label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) =>
                setSettings({ ...settings, googleAnalyticsId: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sosyal Medya */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="share" className="text-purple-400" />
          Sosyal Medya
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Twitter Handle
            </label>
            <input
              type="text"
              value={settings.twitterHandle}
              onChange={(e) =>
                setSettings({ ...settings, twitterHandle: e.target.value })
              }
              placeholder="@demirgayrimenkul"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Varsayılan OG Görsel URL
            </label>
            <input
              type="text"
              value={settings.defaultOgImage}
              onChange={(e) =>
                setSettings({ ...settings, defaultOgImage: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sektör Anahtar Kelimeleri */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="key" className="text-amber-400" />
          Sektör Anahtar Kelimeleri
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.industryKeywords.map((keyword) => (
            <span
              key={keyword}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="hover:text-red-400"
              >
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="Yeni anahtar kelime..."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <Icon name="add" />
          </button>
        </div>
      </div>

      {/* AI Ayarları */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="smart_toy" className="text-emerald-400" />
          AI SEO Ayarları
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoGenerateSeo}
            onChange={(e) =>
              setSettings({ ...settings, autoGenerateSeo: e.target.checked })
            }
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-white">
            Yeni içerik eklendiğinde otomatik SEO oluştur
          </span>
        </label>
        <p className="text-slate-500 text-sm mt-2 ml-8">
          DeepSeek-Reasoner modeli kullanılarak içerik için otomatik SEO meta
          verileri oluşturulur.
        </p>
      </div>

      {/* Kaydet Butonu */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          {saving ? (
            <Icon name="progress_activity" className="animate-spin" />
          ) : (
            <Icon name="save" />
          )}
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}

// Logs Tab Component
function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/seo/logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error("Loglar alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon
          name="progress_activity"
          className="text-4xl text-emerald-400 animate-spin"
        />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
        <Icon name="history" className="text-6xl text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          İşlem Geçmişi Boş
        </h3>
        <p className="text-slate-400">Henüz SEO işlemi yapılmamış.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700 bg-slate-800/50">
            <th className="text-left py-4 px-4">Tarih</th>
            <th className="text-left py-4 px-4">İşlem</th>
            <th className="text-left py-4 px-4">İçerik</th>
            <th className="text-center py-4 px-4">Durum</th>
            <th className="text-right py-4 px-4">Süre</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-slate-700/50 hover:bg-slate-700/30"
            >
              <td className="py-4 px-4 text-slate-400">
                {new Date(log.createdAt).toLocaleString("tr-TR")}
              </td>
              <td className="py-4 px-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded text-xs",
                    log.action === "generate"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : log.action === "update"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400",
                  )}
                >
                  {log.action}
                </span>
              </td>
              <td className="py-4 px-4 text-white">{log.entityId}</td>
              <td className="py-4 px-4 text-center">
                {log.status === "success" ? (
                  <Icon name="check_circle" className="text-emerald-400" />
                ) : log.status === "pending" ? (
                  <Icon name="pending" className="text-amber-400" />
                ) : (
                  <Icon name="error" className="text-red-400" />
                )}
              </td>
              <td className="py-4 px-4 text-right text-slate-400">
                {log.processingTime ? `${log.processingTime}ms` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// SEO Edit Modal Component
function SeoEditModal({
  item,
  onClose,
  onSave,
  onRegenerate,
  saving,
}: {
  item: SeoMetadata;
  onClose: () => void;
  onSave: (item: SeoMetadata) => void;
  onRegenerate: (item: SeoMetadata) => void;
  saving: boolean;
}) {
  const [editedItem, setEditedItem] = useState(item);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">SEO Düzenle</h2>
            <p className="text-slate-400 text-sm">
              {item.entityTitle || item.entityId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            <Icon name="close" className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* SEO Score */}
          <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
            <SeoScoreBadge score={editedItem.seoScore || 0} size="lg" />
            <div>
              <div className="text-white font-medium">SEO Skoru</div>
              <div className="text-slate-400 text-sm">
                {(editedItem.seoScore || 0) >= 70
                  ? "İyi durumda"
                  : "İyileştirme gerekli"}
              </div>
            </div>
            <button
              onClick={() => onRegenerate(item)}
              disabled={saving}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
            >
              <Icon name="auto_fix_high" />
              AI ile Yenile
            </button>
          </div>

          {/* Meta Title */}
          <div>
            <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Meta Title</span>
              <span
                className={cn(
                  (editedItem.metaTitle?.length || 0) > 60
                    ? "text-red-400"
                    : "text-slate-500",
                )}
              >
                {editedItem.metaTitle?.length || 0}/60
              </span>
            </label>
            <input
              type="text"
              value={editedItem.metaTitle || ""}
              onChange={(e) =>
                setEditedItem({ ...editedItem, metaTitle: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Meta Description */}
          <div>
            <label className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Meta Description</span>
              <span
                className={cn(
                  (editedItem.metaDescription?.length || 0) > 160
                    ? "text-red-400"
                    : "text-slate-500",
                )}
              >
                {editedItem.metaDescription?.length || 0}/160
              </span>
            </label>
            <textarea
              value={editedItem.metaDescription || ""}
              onChange={(e) =>
                setEditedItem({
                  ...editedItem,
                  metaDescription: e.target.value,
                })
              }
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Focus Keyword */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Odak Anahtar Kelime
            </label>
            <input
              type="text"
              value={editedItem.focusKeyword || ""}
              onChange={(e) =>
                setEditedItem({ ...editedItem, focusKeyword: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Anahtar Kelimeler
            </label>
            <div className="flex flex-wrap gap-2">
              {(editedItem.keywords || []).map((keyword, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    onClick={() =>
                      setEditedItem({
                        ...editedItem,
                        keywords:
                          editedItem.keywords?.filter((_, i) => i !== idx) ||
                          [],
                      })
                    }
                    className="hover:text-red-400"
                  >
                    <Icon name="close" className="text-sm" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO Analysis */}
          {editedItem.seoAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                  <Icon name="check_circle" />
                  Güçlü Yönler
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {editedItem.seoAnalysis.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                  <Icon name="warning" />
                  Zayıf Yönler
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {editedItem.seoAnalysis.weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  <Icon name="tips_and_updates" />
                  Öneriler
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {editedItem.seoAnalysis.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(editedItem)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {saving ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <Icon name="save" />
            )}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
  suffix,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  subtitle?: string;
  suffix?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    yellow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  return (
    <div className={cn("rounded-xl p-4 border", colorClasses[color])}>
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        {suffix}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500",
    green: "bg-green-500",
    yellow: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{count}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            colorClasses[color],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TipItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-slate-300">
      <Icon name={icon} className="text-emerald-400 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

function SeoScoreBadge({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "lg";
}) {
  const getColor = () => {
    if (score >= 90) return "bg-emerald-500 text-white";
    if (score >= 70) return "bg-green-500 text-white";
    if (score >= 50) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold rounded-full",
        getColor(),
        size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm",
      )}
    >
      {score}
    </span>
  );
}
