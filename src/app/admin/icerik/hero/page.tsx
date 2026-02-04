"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { ImageUpload } from "@/components/ui/image-upload";
import Link from "next/link";

interface HeroData {
  id?: string;
  badge: string;
  title: string;
  titleHighlight: string;
  titleAccent: string;
  titleEnd: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
  founderName: string;
  founderTitle: string;
  founderQuote: string;
  founderImage: string;
  feature1Icon: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Icon: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Icon: string;
  feature3Title: string;
  feature3Desc: string;
}

const defaultData: HeroData = {
  badge: "Hendek'in Premium Gayrimenkulü",
  title: "Demir Gayrimenkul:",
  titleHighlight: "Akıllı",
  titleAccent: "Yatırım",
  titleEnd: "Demir Güven.",
  description:
    "Yılların getirdiği yerel esnaf samimiyetini, küresel dünyanın veri bilimiyle harmanlıyoruz.",
  ctaPrimary: "Hendek'i Keşfedin",
  ctaSecondary: "Mülk Değerleme Platformu",
  founderName: "Mustafa Demir",
  founderTitle: "Gayrimenkul Danışmanı",
  founderQuote: "Bence değil, Verilere göre yatırım...",
  founderImage: "",
  feature1Icon: "speed",
  feature1Title: "Hızlı Satış Analizi",
  feature1Desc: "Saniyeler içinde AI destekli değerleme.",
  feature2Icon: "school",
  feature2Title: "Hendek Yatırım Rehberi",
  feature2Desc: "Uzman eğitimsel içgörüler.",
  feature3Icon: "location_city",
  feature3Title: "Yaşam Alanı Keşfet",
  feature3Desc: "Hayalinizdeki yaşam alanını bulun.",
};

export default function HeroEditPage() {
  const [data, setData] = useState<HeroData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/hero");
      if (res.ok) {
        const result = await res.json();
        if (result) {
          setData({ ...defaultData, ...result });
        }
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Hero içeriği kaydedildi!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Kaydetme hatası");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme hatası oluştu!" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof HeroData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/icerik"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Ana Sayfa Hero</h1>
            <p className="text-slate-400 text-sm">Giriş bölümünü düzenleyin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white border border-slate-600 rounded-lg"
          >
            <Icon name="visibility" />
            Önizle
          </Link>
          <button
            onClick={saveData}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            <Icon name={saving ? "hourglass_empty" : "save"} />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
        >
          <Icon name={message.type === "success" ? "check_circle" : "error"} />
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Kolon */}
        <div className="space-y-6">
          {/* Badge & Başlıklar */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Başlıklar
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="heroBadge" className="block text-sm text-slate-300 mb-1">
                  Badge (Üst Etiket)
                </label>
                <input
                  id="heroBadge"
                  type="text"
                  value={data.badge}
                  onChange={(e) => updateField("badge", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label htmlFor="heroTitle" className="block text-sm text-slate-300 mb-1">
                  Ana Başlık
                </label>
                <input
                  id="heroTitle"
                  type="text"
                  value={data.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="titleHighlight" className="block text-xs text-slate-400 mb-1">
                    Vurgu 1
                  </label>
                  <input
                    id="titleHighlight"
                    type="text"
                    value={data.titleHighlight}
                    onChange={(e) =>
                      updateField("titleHighlight", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="titleAccent" className="block text-xs text-slate-400 mb-1">
                    Vurgu 2
                  </label>
                  <input
                    id="titleAccent"
                    type="text"
                    value={data.titleAccent}
                    onChange={(e) => updateField("titleAccent", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="titleEnd" className="block text-xs text-slate-400 mb-1">
                    Son Kısım
                  </label>
                  <input
                    id="titleEnd"
                    type="text"
                    value={data.titleEnd}
                    onChange={(e) => updateField("titleEnd", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="heroDescription" className="block text-sm text-slate-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="heroDescription"
                  value={data.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              CTA Butonları
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Birincil Buton
                </label>
                <input
                  type="text"
                  value={data.ctaPrimary}
                  onChange={(e) => updateField("ctaPrimary", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  İkincil Buton
                </label>
                <input
                  type="text"
                  value={data.ctaSecondary}
                  onChange={(e) => updateField("ctaSecondary", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Özellik Kartları */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Özellik Kartları
            </h3>
            <div className="space-y-4">
              {/* Kart 1 */}
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">Kart 1</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={data.feature1Icon}
                    onChange={(e) =>
                      updateField("feature1Icon", e.target.value)
                    }
                    placeholder="Icon"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature1Title}
                    onChange={(e) =>
                      updateField("feature1Title", e.target.value)
                    }
                    placeholder="Başlık"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature1Desc}
                    onChange={(e) =>
                      updateField("feature1Desc", e.target.value)
                    }
                    placeholder="Açıklama"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              {/* Kart 2 */}
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">Kart 2</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={data.feature2Icon}
                    onChange={(e) =>
                      updateField("feature2Icon", e.target.value)
                    }
                    placeholder="Icon"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature2Title}
                    onChange={(e) =>
                      updateField("feature2Title", e.target.value)
                    }
                    placeholder="Başlık"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature2Desc}
                    onChange={(e) =>
                      updateField("feature2Desc", e.target.value)
                    }
                    placeholder="Açıklama"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              {/* Kart 3 */}
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">Kart 3</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={data.feature3Icon}
                    onChange={(e) =>
                      updateField("feature3Icon", e.target.value)
                    }
                    placeholder="Icon"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature3Title}
                    onChange={(e) =>
                      updateField("feature3Title", e.target.value)
                    }
                    placeholder="Başlık"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="text"
                    value={data.feature3Desc}
                    onChange={(e) =>
                      updateField("feature3Desc", e.target.value)
                    }
                    placeholder="Açıklama"
                    className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Kurucu */}
        <div className="space-y-6">
          {/* Fotoğraf */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Kurucu Fotoğrafı
            </h3>
            <ImageUpload
              value={data.founderImage}
              onChange={(url) => updateField("founderImage", url)}
              folder="hero"
              aspectRatio="3:4"
              recommendedSize="600x800"
              label=""
              enableEditor={true}
            />
          </div>

          {/* Kurucu Bilgileri */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Kurucu Bilgileri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={data.founderName}
                  onChange={(e) => updateField("founderName", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Ünvan
                </label>
                <input
                  type="text"
                  value={data.founderTitle}
                  onChange={(e) => updateField("founderTitle", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Slogan / Alıntı
                </label>
                <input
                  type="text"
                  value={data.founderQuote}
                  onChange={(e) => updateField("founderQuote", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
