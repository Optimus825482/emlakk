"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

type ContentCategory =
  | "firma_tanitim"
  | "sektor_haberi"
  | "motivasyon"
  | "bilgilendirme"
  | "kampanya"
  | "ozel_gun";

type Platform = "instagram" | "facebook" | "twitter" | "linkedin";

interface GeneratedContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
}

const CONTENT_CATEGORIES: {
  id: ContentCategory;
  label: string;
  icon: string;
  description: string;
  examples: string[];
}[] = [
  {
    id: "firma_tanitim",
    label: "Firma Tanıtımı",
    icon: "business",
    description: "Demir Gayrimenkul'ü tanıtan içerikler",
    examples: [
      "Neden bizi tercih etmelisiniz?",
      "Ekibimizi tanıyın",
      "Hizmetlerimiz",
    ],
  },
  {
    id: "sektor_haberi",
    label: "Sektör Haberi",
    icon: "newspaper",
    description: "Gayrimenkul sektöründen güncel haberler",
    examples: ["Faiz oranları", "Piyasa analizi", "Yeni düzenlemeler"],
  },
  {
    id: "motivasyon",
    label: "Motivasyon",
    icon: "emoji_objects",
    description: "İlham verici ve motive edici içerikler",
    examples: [
      "Ev sahibi olma hayali",
      "Yatırım tavsiyeleri",
      "Başarı hikayeleri",
    ],
  },
  {
    id: "bilgilendirme",
    label: "Bilgilendirme",
    icon: "info",
    description: "Eğitici ve bilgilendirici içerikler",
    examples: [
      "Ev alırken dikkat edilecekler",
      "Tapu işlemleri",
      "Kredi hesaplama",
    ],
  },
  {
    id: "kampanya",
    label: "Kampanya",
    icon: "local_offer",
    description: "Özel teklifler ve kampanyalar",
    examples: ["Sezon indirimi", "Özel fırsatlar", "Sınırlı süre"],
  },
  {
    id: "ozel_gun",
    label: "Özel Gün",
    icon: "celebration",
    description: "Bayram, yılbaşı, özel günler",
    examples: ["Bayram kutlaması", "Yeni yıl", "Anneler günü"],
  },
];

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: "photo_camera",
    color: "text-pink-400",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "facebook",
    color: "text-blue-400",
  },
  { id: "twitter", label: "Twitter/X", icon: "tag", color: "text-slate-300" },
  { id: "linkedin", label: "LinkedIn", icon: "work", color: "text-blue-500" },
];

export default function GenelIcerikPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<ContentCategory | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "instagram",
  ]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "casual">(
    "friendly"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<
    GeneratedContent[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const generateContent = async () => {
    if (!selectedCategory && !customPrompt.trim()) {
      setError("Lütfen bir kategori seçin veya özel konu girin");
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError("En az bir platform seçin");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContents([]);

    try {
      const res = await fetch("/api/ai/social-media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general",
          category: selectedCategory,
          customPrompt: customPrompt.trim() || undefined,
          platforms: selectedPlatforms,
          tone,
          companyInfo: {
            name: "Demir Gayrimenkul",
            location: "Hendek, Sakarya",
            slogan: "Güvenilir Gayrimenkul Danışmanlığı",
            phone: "0264 XXX XX XX",
            website: "demirgayrimenkul.com",
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "İçerik üretilemedi");
      }

      const data = await res.json();
      setGeneratedContents(data.contents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveContent = async (content: GeneratedContent) => {
    try {
      await fetch("/api/ai/social-media/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general",
          category: selectedCategory,
          platform: content.platform,
          content: content.content,
          hashtags: content.hashtags,
          imagePrompt: content.imagePrompt,
        }),
      });
      alert("İçerik kaydedildi!");
    } catch {
      alert("Kaydetme başarısız");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/admin/sosyal-medya" className="hover:text-white">
              Sosyal Medya
            </Link>
            <Icon name="chevron_right" className="text-xs" />
            <span className="text-white">Genel İçerik</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icon name="campaign" className="text-purple-400" />
            Genel İçerik Üretimi
          </h1>
          <p className="text-slate-400 mt-1">
            Demir Gayrimenkul için genel sosyal medya içerikleri
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Panel - Ayarlar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Kategori Seçimi */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">
              İçerik Kategorisi
            </h2>
            <div className="space-y-2">
              {CONTENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? "bg-purple-500/20 border border-purple-500"
                      : "bg-slate-700/50 border border-transparent hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      name={cat.icon}
                      className={
                        selectedCategory === cat.id
                          ? "text-purple-400"
                          : "text-slate-400"
                      }
                    />
                    <div>
                      <p className="text-white font-medium">{cat.label}</p>
                      <p className="text-slate-400 text-xs">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Özel Konu */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">
              Özel Konu (Opsiyonel)
            </h2>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Örn: Hendek'te yeni açılan sanayi bölgesi hakkında bilgilendirme postu..."
              className="w-full h-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Platform Seçimi */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Platformlar</h2>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? "bg-purple-500/20 border border-purple-500"
                      : "bg-slate-700/50 border border-transparent hover:bg-slate-700"
                  }`}
                >
                  <Icon name={platform.icon} className={platform.color} />
                  <span className="text-white text-sm">{platform.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ton Seçimi */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">İçerik Tonu</h2>
            <div className="space-y-2">
              {[
                {
                  id: "professional",
                  label: "Profesyonel",
                  icon: "business_center",
                },
                {
                  id: "friendly",
                  label: "Samimi",
                  icon: "sentiment_satisfied",
                },
                { id: "casual", label: "Günlük", icon: "chat_bubble" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id as typeof tone)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    tone === t.id
                      ? "bg-purple-500/20 border border-purple-500"
                      : "bg-slate-700/50 border border-transparent hover:bg-slate-700"
                  }`}
                >
                  <Icon
                    name={t.icon}
                    className={
                      tone === t.id ? "text-purple-400" : "text-slate-400"
                    }
                  />
                  <span className="text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Üret Butonu */}
          <button
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Icon name="hourglass_empty" className="animate-spin" />
                Üretiliyor...
              </>
            ) : (
              <>
                <Icon name="auto_awesome" />
                İçerik Üret
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Sağ Panel - Sonuçlar */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[600px]">
            <h2 className="text-lg font-bold text-white mb-4">
              Üretilen İçerikler
            </h2>

            {generatedContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <Icon
                  name="auto_awesome"
                  className="text-6xl text-slate-600 mb-4"
                />
                <p className="text-slate-400">
                  Kategori seçin ve içerik üretin
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  AI, seçtiğiniz kategoriye uygun sosyal medya içerikleri
                  oluşturacak
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {generatedContents.map((content, idx) => {
                  const platform = PLATFORMS.find(
                    (p) => p.id === content.platform
                  );
                  return (
                    <div
                      key={idx}
                      className="bg-slate-700/50 rounded-xl p-5 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Icon
                            name={platform?.icon || "share"}
                            className={platform?.color || "text-white"}
                          />
                          <span className="text-white font-medium">
                            {platform?.label}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(content.content)}
                            className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
                            title="Kopyala"
                          >
                            <Icon name="content_copy" />
                          </button>
                          <button
                            onClick={() => saveContent(content)}
                            className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white"
                            title="Kaydet"
                          >
                            <Icon name="save" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-800 rounded-lg p-4 mb-4">
                        <p className="text-white whitespace-pre-wrap">
                          {content.content}
                        </p>
                      </div>

                      {content.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {content.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {content.imagePrompt && (
                        <div className="p-3 bg-slate-800 rounded-lg border border-dashed border-slate-600">
                          <p className="text-slate-400 text-sm">
                            <Icon name="image" className="inline mr-1" />
                            Görsel önerisi: {content.imagePrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
