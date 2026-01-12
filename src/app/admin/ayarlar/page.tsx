"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  mapEmbedUrl: string | null;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  } | null;
  workingHours: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  footerText: string | null;
  copyrightText: string | null;
}

export default function AdminAyarlarPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const result = await response.json();
        setSettings(result.data);
      }
    } catch (error) {
      console.error("Ayarlar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Ayarlar başarıyla kaydedildi!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Ayarlar kaydedilemedi!" });
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setSaving(false);
    }
  }

  function updateSettings(field: string, value: unknown) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  function updateNestedSettings(
    parent: "socialMedia" | "workingHours",
    field: string,
    value: string
  ) {
    if (!settings) return;
    setSettings({
      ...settings,
      [parent]: {
        ...(settings[parent] || {}),
        [field]: value,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "genel", label: "Genel", icon: "settings" },
    { key: "iletisim", label: "İletişim", icon: "contact_phone" },
    { key: "sosyal", label: "Sosyal Medya", icon: "share" },
    { key: "seo", label: "SEO", icon: "search" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Site Ayarları
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Web sitesi içeriklerini ve ayarlarını yönetin
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Icon name="sync" className="animate-spin" />
          ) : (
            <Icon name="save" />
          )}
          Kaydet
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          <Icon name={message.type === "success" ? "check_circle" : "error"} />
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        {activeTab === "genel" && settings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site Adı
                </label>
                <input
                  type="text"
                  value={settings.siteName || ""}
                  onChange={(e) => updateSettings("siteName", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={settings.siteTagline || ""}
                  onChange={(e) =>
                    updateSettings("siteTagline", e.target.value)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Footer Metni
              </label>
              <textarea
                value={settings.footerText || ""}
                onChange={(e) => updateSettings("footerText", e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Copyright Metni
              </label>
              <input
                type="text"
                value={settings.copyrightText || ""}
                onChange={(e) =>
                  updateSettings("copyrightText", e.target.value)
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {activeTab === "iletisim" && settings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon
                </label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => updateSettings("phone", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.whatsapp || ""}
                  onChange={(e) => updateSettings("whatsapp", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={settings.email || ""}
                onChange={(e) => updateSettings("email", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adres
              </label>
              <textarea
                value={settings.address || ""}
                onChange={(e) => updateSettings("address", e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Çalışma Saatleri
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Hafta İçi
                  </label>
                  <input
                    type="text"
                    value={settings.workingHours?.weekdays || ""}
                    onChange={(e) =>
                      updateNestedSettings(
                        "workingHours",
                        "weekdays",
                        e.target.value
                      )
                    }
                    placeholder="09:00 - 18:00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Cumartesi
                  </label>
                  <input
                    type="text"
                    value={settings.workingHours?.saturday || ""}
                    onChange={(e) =>
                      updateNestedSettings(
                        "workingHours",
                        "saturday",
                        e.target.value
                      )
                    }
                    placeholder="10:00 - 14:00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Pazar
                  </label>
                  <input
                    type="text"
                    value={settings.workingHours?.sunday || ""}
                    onChange={(e) =>
                      updateNestedSettings(
                        "workingHours",
                        "sunday",
                        e.target.value
                      )
                    }
                    placeholder="Kapalı"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sosyal" && settings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
                    </svg>
                    Instagram
                  </span>
                </label>
                <input
                  type="url"
                  value={settings.socialMedia?.instagram || ""}
                  onChange={(e) =>
                    updateNestedSettings(
                      "socialMedia",
                      "instagram",
                      e.target.value
                    )
                  }
                  placeholder="https://instagram.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </span>
                </label>
                <input
                  type="url"
                  value={settings.socialMedia?.linkedin || ""}
                  onChange={(e) =>
                    updateNestedSettings(
                      "socialMedia",
                      "linkedin",
                      e.target.value
                    )
                  }
                  placeholder="https://linkedin.com/company/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </span>
                </label>
                <input
                  type="url"
                  value={settings.socialMedia?.facebook || ""}
                  onChange={(e) =>
                    updateNestedSettings(
                      "socialMedia",
                      "facebook",
                      e.target.value
                    )
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube
                  </span>
                </label>
                <input
                  type="url"
                  value={settings.socialMedia?.youtube || ""}
                  onChange={(e) =>
                    updateNestedSettings(
                      "socialMedia",
                      "youtube",
                      e.target.value
                    )
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "seo" && settings && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Meta Başlık
              </label>
              <input
                type="text"
                value={settings.metaTitle || ""}
                onChange={(e) => updateSettings("metaTitle", e.target.value)}
                placeholder="Demir Gayrimenkul - Hendek'in Güvenilir Gayrimenkul Danışmanı"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                Önerilen: 50-60 karakter
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Meta Açıklama
              </label>
              <textarea
                value={settings.metaDescription || ""}
                onChange={(e) =>
                  updateSettings("metaDescription", e.target.value)
                }
                rows={3}
                placeholder="Hendek ve çevresinde sanayi, tarım ve konut gayrimenkul yatırımları için güvenilir danışmanlık hizmeti."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Önerilen: 150-160 karakter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
