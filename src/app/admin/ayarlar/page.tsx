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
  googleAnalyticsId: string | null;
  googleSearchConsoleCode: string | null;
  footerText: string | null;
  copyrightText: string | null;
}

interface SystemSettings {
  id: string;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string | null;
  hasApiKey: boolean;
  aiApiKeyValid: boolean;
}

type AIProvider =
  | "deepseek"
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "openrouter";

const AI_PROVIDERS: { value: AIProvider; label: string; icon: string }[] = [
  { value: "deepseek", label: "DeepSeek", icon: "smart_toy" },
  { value: "openai", label: "OpenAI", icon: "psychology" },
  { value: "anthropic", label: "Anthropic (Claude)", icon: "neurology" },
  { value: "google-gemini", label: "Google Gemini", icon: "auto_awesome" },
  { value: "openrouter", label: "OpenRouter", icon: "hub" },
];

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, string[]> = {
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
  ],
  "google-gemini": [
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  openrouter: [
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat",
  ],
};

export default function AdminAyarlarPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("genel");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // AI Settings State
  const [newApiKey, setNewApiKey] = useState("");
  const [validatingKey, setValidatingKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("deepseek");
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpEncryption: "tls",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "Demir Gayrimenkul",
    replyToEmail: "",
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchSystemSettings();
    fetchSmtpSettings();
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

  async function fetchSystemSettings() {
    try {
      const response = await fetch("/api/system-settings");
      if (response.ok) {
        const result = await response.json();
        setSystemSettings(result.data);
        const provider = (result.data.aiProvider || "deepseek") as AIProvider;
        setSelectedProvider(provider);
        setSelectedModel(result.data.aiModel || "deepseek-chat");
        // Load default models for current provider
        setAvailableModels(DEFAULT_MODELS[provider] || []);
      }
    } catch (error) {
      console.error("Sistem ayarları yüklenemedi:", error);
    }
  }

  async function fetchSmtpSettings() {
    try {
      const response = await fetch("/api/email-settings");
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setSmtpSettings({
            smtpHost: result.data.smtpHost || "",
            smtpPort: String(result.data.smtpPort || 587),
            smtpEncryption: result.data.smtpEncryption || "tls",
            smtpUsername: result.data.smtpUsername || "",
            smtpPassword: result.data.smtpPassword || "",
            fromEmail: result.data.fromEmail || "",
            fromName: result.data.fromName || "Demir Gayrimenkul",
            replyToEmail: result.data.replyToEmail || "",
          });
        }
      }
    } catch (error) {
      console.error("SMTP ayarları yüklenemedi:", error);
    }
  }

  async function handleSaveSmtp() {
    try {
      setSmtpLoading(true);
      const response = await fetch("/api/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "SMTP ayarları kaydedildi!" });
        setTimeout(() => setMessage(null), 3000);
        fetchSmtpSettings();
      } else {
        setMessage({ type: "error", text: "SMTP ayarları kaydedilemedi!" });
      }
    } catch (error) {
      console.error("SMTP kaydetme hatası:", error);
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setSmtpLoading(false);
    }
  }

  async function handleTestSmtp() {
    if (!testEmail.trim()) {
      setMessage({ type: "error", text: "Test e-posta adresi girin" });
      return;
    }

    try {
      setTestingSmtp(true);
      const response = await fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: result.message });
        setTestEmail("");
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      console.error("SMTP test hatası:", error);
      setMessage({ type: "error", text: "Test sırasında bir hata oluştu!" });
    } finally {
      setTestingSmtp(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      console.log("Kaydediliyor:", settings);

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (response.ok) {
        setMessage({ type: "success", text: "Ayarlar başarıyla kaydedildi!" });
        setTimeout(() => setMessage(null), 3000);
        // Güncel veriyi yeniden yükle
        await fetchSettings();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Ayarlar kaydedilemedi!",
        });
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setMessage({ type: "error", text: "Bir hata oluştu!" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function handleValidateApiKey() {
    if (!newApiKey.trim()) {
      setMessage({ type: "error", text: "Lütfen API key girin" });
      return;
    }

    setValidatingKey(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: newApiKey,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setAvailableModels(result.models);
        setMessage({
          type: "success",
          text: "API key doğrulandı! Model seçebilirsiniz.",
        });
        setNewApiKey("");
        fetchSystemSettings();
      } else {
        setMessage({
          type: "error",
          text: result.error || "API key doğrulanamadı",
        });
      }
    } catch (error) {
      console.error("API key doğrulama hatası:", error);
      setMessage({
        type: "error",
        text: "Doğrulama sırasında bir hata oluştu",
      });
    } finally {
      setValidatingKey(false);
    }
  }

  async function handleSaveAISettings() {
    try {
      setSaving(true);
      const response = await fetch("/api/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: selectedProvider,
          aiModel: selectedModel,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "AI ayarları kaydedildi!" });
        setTimeout(() => setMessage(null), 3000);
        fetchSystemSettings();
      } else {
        setMessage({ type: "error", text: "AI ayarları kaydedilemedi!" });
      }
    } catch (error) {
      console.error("AI ayarları kaydetme hatası:", error);
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
    value: string,
  ) {
    if (!settings) return;
    setSettings({
      ...settings,
      [parent]: { ...(settings[parent] || {}), [field]: value },
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
    {
      key: "entegrasyonlar",
      label: "Entegrasyonlar",
      icon: "integration_instructions",
    },
    { key: "smtp", label: "E-posta (SMTP)", icon: "email" },
    { key: "ai", label: "AI Ayarları", icon: "smart_toy" },
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
        {activeTab !== "ai" && (
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
        )}
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
      <div className="flex gap-2 border-b border-slate-700 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
        {/* Genel Tab */}
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

        {/* İletişim Tab */}
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
                placeholder="BAŞPINAR MAHALLESİ 1134 SOKAĞI No : 9/1 HENDEK/ SAKARYA"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Google Maps Embed URL
              </label>
              <input
                type="url"
                value={settings.mapEmbedUrl || ""}
                onChange={(e) => updateSettings("mapEmbedUrl", e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                Google Maps'te konumunuzu bulun → Paylaş → Haritayı yerleştir →
                HTML kodunu kopyalayın → src="..." kısmındaki URL'yi buraya
                yapıştırın
              </p>
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
                        e.target.value,
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
                        e.target.value,
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
                        e.target.value,
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

        {/* Sosyal Medya Tab */}
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
                      e.target.value,
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
                      e.target.value,
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
                      e.target.value,
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
                      e.target.value,
                    )
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
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

        {/* Entegrasyonlar Tab */}
        {activeTab === "entegrasyonlar" && settings && (
          <div className="space-y-8">
            {/* Google Analytics */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-orange-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.84 2.998c-.648-.636-1.716-.636-2.364 0l-3.204 3.144c-.324.318-.504.756-.504 1.206v13.404c0 .936.756 1.692 1.692 1.692h2.688c.936 0 1.692-.756 1.692-1.692V4.204c0-.45-.18-.888-.504-1.206h.504zM12.504 8.998c-.648-.636-1.716-.636-2.364 0l-3.204 3.144c-.324.318-.504.756-.504 1.206v7.404c0 .936.756 1.692 1.692 1.692h2.688c.936 0 1.692-.756 1.692-1.692v-10.548c0-.45-.18-.888-.504-1.206h.504zM2.16 14.998c-.648-.636-1.716-.636-2.364 0l-.504.504c-.324.318-.504.756-.504 1.206v4.044c0 .936.756 1.692 1.692 1.692h2.688c.936 0 1.692-.756 1.692-1.692v-4.548c0-.45-.18-.888-.504-1.206h-.196z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Google Analytics
                  </h3>
                  <p className="text-sm text-slate-400">
                    Web sitesi trafiğini ve kullanıcı davranışlarını takip edin
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Measurement ID (G-XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  value={settings.googleAnalyticsId || ""}
                  onChange={(e) =>
                    updateSettings("googleAnalyticsId", e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Google Analytics 4 &gt; Yönetici &gt; Veri Akışları &gt; Web
                  akışı seçin &gt; Measurement ID
                </p>
              </div>
            </div>

            {/* Google Search Console */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Google Search Console
                  </h3>
                  <p className="text-sm text-slate-400">
                    Arama sonuçlarındaki performansınızı izleyin
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  HTML Etiketi Doğrulama Kodu
                </label>
                <input
                  type="text"
                  value={settings.googleSearchConsoleCode || ""}
                  onChange={(e) =>
                    updateSettings("googleSearchConsoleCode", e.target.value)
                  }
                  placeholder="google-site-verification=XXXXXXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Search Console &gt; Ayarlar &gt; Sahiplik doğrulama &gt; HTML
                  etiketi &gt; content değeri
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-blue-400 mt-0.5" />
                <div className="text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-1">
                    Nasıl Çalışır?
                  </p>
                  <p>
                    Bu kodları girdikten sonra, sistem otomatik olarak sitenizin
                    &lt;head&gt; bölümüne gerekli meta etiketlerini
                    ekleyecektir. Değişikliklerin aktif olması için sayfayı
                    kaydetmeyi unutmayın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMTP Ayarları Tab */}
        {activeTab === "smtp" && (
          <div className="space-y-8">
            {/* SMTP Sunucu Ayarları */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon name="dns" className="text-blue-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    SMTP Sunucu Ayarları
                  </h3>
                  <p className="text-sm text-slate-400">
                    E-posta gönderimi için SMTP sunucu bilgilerini girin
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    SMTP Sunucu
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.smtpHost}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        smtpHost: e.target.value,
                      })
                    }
                    placeholder="smtp.gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.smtpPort}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        smtpPort: e.target.value,
                      })
                    }
                    placeholder="587"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Şifreleme
                  </label>
                  <select
                    value={smtpSettings.smtpEncryption}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        smtpEncryption: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="tls">TLS (Önerilen)</option>
                    <option value="ssl">SSL</option>
                    <option value="none">Yok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.smtpUsername}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        smtpUsername: e.target.value,
                      })
                    }
                    placeholder="email@domain.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Şifre / App Password
                  </label>
                  <input
                    type="password"
                    value={smtpSettings.smtpPassword}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        smtpPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Gmail için App Password kullanın (2FA aktifken)
                  </p>
                </div>
              </div>
            </div>

            {/* Gönderici Bilgileri */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Icon name="person" className="text-emerald-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Gönderici Bilgileri
                  </h3>
                  <p className="text-sm text-slate-400">
                    E-postalarda görünecek gönderici bilgileri
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gönderici E-posta
                  </label>
                  <input
                    type="email"
                    value={smtpSettings.fromEmail}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        fromEmail: e.target.value,
                      })
                    }
                    placeholder="info@demirgayrimenkul.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gönderici Adı
                  </label>
                  <input
                    type="text"
                    value={smtpSettings.fromName}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        fromName: e.target.value,
                      })
                    }
                    placeholder="Demir Gayrimenkul"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Yanıt Adresi (Opsiyonel)
                  </label>
                  <input
                    type="email"
                    value={smtpSettings.replyToEmail}
                    onChange={(e) =>
                      setSmtpSettings({
                        ...smtpSettings,
                        replyToEmail: e.target.value,
                      })
                    }
                    placeholder="destek@demirgayrimenkul.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test ve Kaydet */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Icon name="send" className="text-yellow-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Bağlantı Testi
                  </h3>
                  <p className="text-sm text-slate-400">
                    SMTP ayarlarını test edin
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {testingSmtp ? (
                    <Icon name="sync" className="animate-spin" />
                  ) : (
                    <Icon name="send" />
                  )}
                  Test Gönder
                </button>
              </div>

              <button
                onClick={handleSaveSmtp}
                disabled={smtpLoading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {smtpLoading ? (
                  <Icon name="sync" className="animate-spin" />
                ) : (
                  <Icon name="save" />
                )}
                SMTP Ayarlarını Kaydet
              </button>
            </div>

            {/* Bilgi Kutusu */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="lightbulb" className="text-yellow-400 mt-0.5" />
                <div className="text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-2">
                    Popüler SMTP Ayarları
                  </p>
                  <ul className="space-y-1">
                    <li>
                      • <span className="text-white">Gmail:</span>{" "}
                      smtp.gmail.com:587 (TLS) - App Password gerekli
                    </li>
                    <li>
                      • <span className="text-white">Outlook:</span>{" "}
                      smtp.office365.com:587 (TLS)
                    </li>
                    <li>
                      • <span className="text-white">Yandex:</span>{" "}
                      smtp.yandex.com:465 (SSL)
                    </li>
                    <li>
                      • <span className="text-white">SendGrid:</span>{" "}
                      smtp.sendgrid.net:587 (TLS)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Ayarları Tab */}
        {activeTab === "ai" && (
          <div className="space-y-8">
            {/* Provider Seçimi */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Icon
                    name="psychology"
                    className="text-purple-400 text-2xl"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    AI Provider Seçimi
                  </h3>
                  <p className="text-sm text-slate-400">
                    Sistemde kullanılacak yapay zeka sağlayıcısını seçin
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.value}
                    onClick={() => {
                      setSelectedProvider(provider.value);
                      // Load default models for the selected provider
                      setAvailableModels(DEFAULT_MODELS[provider.value] || []);
                      // Set first model as default
                      const defaultModel = DEFAULT_MODELS[provider.value]?.[0];
                      if (defaultModel) {
                        setSelectedModel(defaultModel);
                      }
                      setNewApiKey("");
                    }}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      selectedProvider === provider.value
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <Icon name={provider.icon} className="text-xl" />
                    <span className="font-medium">{provider.label}</span>
                    {selectedProvider === provider.value && (
                      <Icon
                        name="check_circle"
                        className="ml-auto text-emerald-400"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Mevcut Durum */}
              {systemSettings && (
                <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          systemSettings.aiApiKeyValid
                            ? "bg-emerald-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <span className="text-sm text-slate-300">
                        {systemSettings.aiApiKeyValid
                          ? `Aktif: ${systemSettings.aiProvider} / ${systemSettings.aiModel}`
                          : systemSettings.hasApiKey
                            ? "API key doğrulanmadı"
                            : "API key girilmedi"}
                      </span>
                    </div>
                    {systemSettings.hasApiKey && (
                      <span className="text-xs text-slate-500 font-mono">
                        {systemSettings.aiApiKey}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* API Key Girişi */}
            <div className="border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Icon name="key" className="text-yellow-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">API Key</h3>
                  <p className="text-sm text-slate-400">
                    {
                      AI_PROVIDERS.find((p) => p.value === selectedProvider)
                        ?.label
                    }{" "}
                    için API anahtarınızı girin
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-... veya API anahtarınız"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                />
                <button
                  onClick={handleValidateApiKey}
                  disabled={validatingKey || !newApiKey.trim()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingKey ? (
                    <>
                      <Icon name="sync" className="animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <Icon name="verified" />
                      Doğrula
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                API key doğrulandıktan sonra kullanılabilir modeller otomatik
                olarak listelenecektir.
              </p>
            </div>

            {/* Model Seçimi */}
            {(availableModels.length > 0 || systemSettings?.aiApiKeyValid) && (
              <div className="border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Icon
                      name="model_training"
                      className="text-emerald-400 text-2xl"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Model Seçimi
                    </h3>
                    <p className="text-sm text-slate-400">
                      Kullanılacak AI modelini seçin
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))
                    ) : (
                      <option value={systemSettings?.aiModel}>
                        {systemSettings?.aiModel}
                      </option>
                    )}
                  </select>

                  <button
                    onClick={handleSaveAISettings}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Icon name="sync" className="animate-spin" />
                    ) : (
                      <Icon name="save" />
                    )}
                    AI Ayarlarını Kaydet
                  </button>
                </div>
              </div>
            )}

            {/* Bilgi Kutusu */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="lightbulb" className="text-yellow-400 mt-0.5" />
                <div className="text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-2">
                    API Key Nereden Alınır?
                  </p>
                  <ul className="space-y-1">
                    <li>
                      • <span className="text-white">DeepSeek:</span>{" "}
                      platform.deepseek.com
                    </li>
                    <li>
                      • <span className="text-white">OpenAI:</span>{" "}
                      platform.openai.com/api-keys
                    </li>
                    <li>
                      • <span className="text-white">Anthropic:</span>{" "}
                      console.anthropic.com
                    </li>
                    <li>
                      • <span className="text-white">Google Gemini:</span>{" "}
                      aistudio.google.com/apikey
                    </li>
                    <li>
                      • <span className="text-white">OpenRouter:</span>{" "}
                      openrouter.ai/keys
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
