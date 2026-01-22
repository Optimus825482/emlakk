"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface PageSeoData {
  id?: string;
  pagePath: string;
  pageTitle: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  focusKeyword?: string;
  seoScore?: number;
  isActive?: boolean;
  isAiGenerated?: boolean;
}

const DEFAULT_PAGES = [
  { path: "/", title: "Anasayfa", icon: "home" },
  { path: "/hakkimizda", title: "Hakkımızda", icon: "info" },
  { path: "/iletisim", title: "İletişim", icon: "contact_mail" },
  { path: "/ilanlar", title: "İlanlar", icon: "real_estate_agent" },
  { path: "/degerleme", title: "Değerleme", icon: "calculate" },
  { path: "/randevu", title: "Randevu", icon: "event" },
  { path: "/rehber", title: "Hendek Yatırım Rehberi", icon: "map" },
];

export function PageSeoManager() {
  const [pages, setPages] = useState<PageSeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<PageSeoData | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchPageSeo();
  }, []);

  async function fetchPageSeo() {
    try {
      const res = await fetch("/api/page-seo");
      const data = await res.json();

      // Merge default pages with existing SEO data
      const existingSeo = data.data || [];
      const mergedPages = DEFAULT_PAGES.map((defaultPage) => {
        const existing = existingSeo.find(
          (seo: PageSeoData) => seo.pagePath === defaultPage.path,
        );
        return (
          existing || {
            pagePath: defaultPage.path,
            pageTitle: defaultPage.title,
          }
        );
      });

      setPages(mergedPages);
    } catch (error) {
      console.error("Page SEO fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateSeo(pagePath: string, pageTitle: string) {
    setGenerating(pagePath);
    try {
      const res = await fetch("/api/page-seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagePath, pageTitle }),
      });

      if (res.ok) {
        await fetchPageSeo();
      }
    } catch (error) {
      console.error("SEO generation error:", error);
      alert("SEO üretilirken hata oluştu");
    } finally {
      setGenerating(null);
    }
  }

  async function savePage(pageData: PageSeoData) {
    try {
      const method = pageData.id ? "PUT" : "POST";
      const res = await fetch("/api/page-seo", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      });

      if (res.ok) {
        await fetchPageSeo();
        setSelectedPage(null);
      }
    } catch (error) {
      console.error("Page SEO save error:", error);
      alert("Kaydetme hatası");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Web Sayfaları SEO</h3>
          <p className="text-slate-400 text-sm">
            Tüm web sayfaları için SEO meta verilerini yönetin
          </p>
        </div>
        <button
          onClick={async () => {
            for (const page of DEFAULT_PAGES) {
              await generateSeo(page.path, page.title);
            }
          }}
          disabled={generating !== null}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Icon name="auto_fix_high" />
          Tümü İçin SEO Oluştur
        </button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_PAGES.map((defaultPage) => {
          const pageData = pages.find((p) => p.pagePath === defaultPage.path);
          const seoScore = pageData?.seoScore || 0;
          const hasData = !!pageData?.metaTitle;

          return (
            <div
              key={defaultPage.path}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Icon
                      name={defaultPage.icon}
                      className="text-emerald-400"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      {defaultPage.title}
                    </h4>
                    <p className="text-slate-500 text-xs">{defaultPage.path}</p>
                  </div>
                </div>
                {hasData && (
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                      seoScore >= 70
                        ? "bg-emerald-500/20 text-emerald-400"
                        : seoScore >= 50
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400",
                    )}
                  >
                    {seoScore}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mb-4">
                {hasData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon
                        name={pageData.isAiGenerated ? "smart_toy" : "edit"}
                        className="text-emerald-400"
                      />
                      <span className="text-slate-400">
                        {pageData.isAiGenerated ? "AI Oluşturuldu" : "Manuel"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {pageData.metaDescription || "Açıklama yok"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <Icon name="warning" />
                    <span>SEO verisi yok</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedPage(
                      pageData || {
                        pagePath: defaultPage.path,
                        pageTitle: defaultPage.title,
                      },
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Icon name="edit" className="text-sm" />
                  Düzenle
                </button>
                <button
                  onClick={() =>
                    generateSeo(defaultPage.path, defaultPage.title)
                  }
                  disabled={generating === defaultPage.path}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {generating === defaultPage.path ? (
                    <Icon name="sync" className="text-sm animate-spin" />
                  ) : (
                    <Icon name="auto_fix_high" className="text-sm" />
                  )}
                  {generating === defaultPage.path
                    ? "Üretiliyor..."
                    : "AI Oluştur"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {selectedPage && (
        <PageSeoEditModal
          page={selectedPage}
          onClose={() => setSelectedPage(null)}
          onSave={savePage}
        />
      )}
    </div>
  );
}

// Edit Modal Component
function PageSeoEditModal({
  page,
  onClose,
  onSave,
}: {
  page: PageSeoData;
  onClose: () => void;
  onSave: (page: PageSeoData) => void;
}) {
  const [editedPage, setEditedPage] = useState(page);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(editedPage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {editedPage.pageTitle} - SEO Düzenle
            </h3>
            <p className="text-slate-400 text-sm">{editedPage.pagePath}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Icon name="close" className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Meta Title
              </label>
              <span
                className={cn(
                  "text-xs",
                  (editedPage.metaTitle?.length || 0) > 60
                    ? "text-red-400"
                    : (editedPage.metaTitle?.length || 0) > 50
                      ? "text-yellow-400"
                      : "text-emerald-400",
                )}
              >
                {editedPage.metaTitle?.length || 0}/60 karakter
              </span>
            </div>
            <input
              type="text"
              value={editedPage.metaTitle || ""}
              onChange={(e) =>
                setEditedPage({ ...editedPage, metaTitle: e.target.value })
              }
              placeholder="Örn: Demir Gayrimenkul | Hendek ve Sakarya'nın Güvenilir Emlak Danışmanı"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Meta Description
              </label>
              <span
                className={cn(
                  "text-xs",
                  (editedPage.metaDescription?.length || 0) > 160
                    ? "text-red-400"
                    : (editedPage.metaDescription?.length || 0) > 150
                      ? "text-yellow-400"
                      : "text-emerald-400",
                )}
              >
                {editedPage.metaDescription?.length || 0}/160 karakter
              </span>
            </div>
            <textarea
              value={editedPage.metaDescription || ""}
              onChange={(e) =>
                setEditedPage({
                  ...editedPage,
                  metaDescription: e.target.value,
                })
              }
              rows={3}
              placeholder="Hendek ve Sakarya bölgesinde satılık ve kiralık emlak ilanları. Konut, arsa, tarım arazisi ve ticari gayrimenkul danışmanlığı..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Keywords & Focus Keyword */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Odak Anahtar Kelime
              </label>
              <input
                type="text"
                value={editedPage.focusKeyword || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, focusKeyword: e.target.value })
                }
                placeholder="hendek emlak"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Anahtar Kelimeler (virgülle ayırın)
              </label>
              <input
                type="text"
                value={editedPage.metaKeywords || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, metaKeywords: e.target.value })
                }
                placeholder="emlak, gayrimenkul, satılık, kiralık"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Icon name="share" className="text-blue-400" />
              Open Graph (Facebook, LinkedIn)
            </h4>
            <div className="space-y-4">
              <input
                type="text"
                value={editedPage.ogTitle || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, ogTitle: e.target.value })
                }
                placeholder="OG Title (boş bırakılırsa Meta Title kullanılır)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={editedPage.ogDescription || ""}
                onChange={(e) =>
                  setEditedPage({
                    ...editedPage,
                    ogDescription: e.target.value,
                  })
                }
                rows={2}
                placeholder="OG Description (boş bırakılırsa Meta Description kullanılır)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <input
                type="text"
                value={editedPage.ogImage || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, ogImage: e.target.value })
                }
                placeholder="OG Image URL (1200x630px önerilir)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Icon name="alternate_email" className="text-sky-400" />
              Twitter Card
            </h4>
            <div className="space-y-4">
              <input
                type="text"
                value={editedPage.twitterTitle || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, twitterTitle: e.target.value })
                }
                placeholder="Twitter Title (boş bırakılırsa Meta Title kullanılır)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <textarea
                value={editedPage.twitterDescription || ""}
                onChange={(e) =>
                  setEditedPage({
                    ...editedPage,
                    twitterDescription: e.target.value,
                  })
                }
                rows={2}
                placeholder="Twitter Description (boş bırakılırsa Meta Description kullanılır)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
              <input
                type="text"
                value={editedPage.twitterImage || ""}
                onChange={(e) =>
                  setEditedPage({ ...editedPage, twitterImage: e.target.value })
                }
                placeholder="Twitter Image URL"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Icon name="visibility" className="text-emerald-400" />
              Google Arama Önizlemesi
            </h4>
            <div className="space-y-1">
              <p className="text-blue-400 text-sm">
                demirgayrimenkul.com ›{" "}
                {editedPage.pagePath.slice(1) || "anasayfa"}
              </p>
              <h4 className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {editedPage.metaTitle || editedPage.pageTitle}
              </h4>
              <p className="text-sm text-slate-400 line-clamp-2">
                {editedPage.metaDescription || "Açıklama girilmemiş"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium"
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
        </div>
      </div>
    </div>
  );
}
