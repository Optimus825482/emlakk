"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { EditorProps } from "../_types";

export function AnasayfaEditor({ config }: EditorProps) {
    const [heroData, setHeroData] = useState<Record<string, string>>({});
    const [manifestoData, setManifestoData] = useState<Record<string, string>>({});
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
            const heroResult = await heroRes.json();
            const manifestoResult = await manifestoRes.json();
            setHeroData(heroResult.data || heroResult || {});
            setManifestoData(manifestoResult.data || manifestoResult || {});
        } catch (error) {
            console.error("AnasayfaEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function saveHero() {
        setSaving("hero");
        try {
            const response = await fetch("/api/hero", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(heroData),
            });
            const result = await response.json();
            if (result.success) {
                alert("Hero bölümü kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("AnasayfaEditor - Hero save error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(null);
        }
    }

    async function saveManifesto() {
        setSaving("manifesto");
        try {
            const response = await fetch("/api/manifesto", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(manifestoData),
            });
            const result = await response.json();
            if (result.success) {
                alert("Manifesto kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("AnasayfaEditor - Manifesto save error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(null);
        }
    }

    if (loading) return <LoadingSpinner />;

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
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.key
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
                        <InputField label="Badge" value={heroData.badge || ""} onChange={(v) => setHeroData({ ...heroData, badge: v })} />
                        <InputField label="Başlık" value={heroData.title || ""} onChange={(v) => setHeroData({ ...heroData, title: v })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="Vurgulu Kelime" value={heroData.titleHighlight || ""} onChange={(v) => setHeroData({ ...heroData, titleHighlight: v })} />
                        <InputField label="Aksan Kelime" value={heroData.titleAccent || ""} onChange={(v) => setHeroData({ ...heroData, titleAccent: v })} />
                        <InputField label="Bitiş" value={heroData.titleEnd || ""} onChange={(v) => setHeroData({ ...heroData, titleEnd: v })} />
                    </div>
                    <TextareaField label="Açıklama" value={heroData.description || ""} onChange={(v) => setHeroData({ ...heroData, description: v })} rows={3} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="CTA Birincil" value={heroData.ctaPrimary || ""} onChange={(v) => setHeroData({ ...heroData, ctaPrimary: v })} />
                        <InputField label="CTA İkincil" value={heroData.ctaSecondary || ""} onChange={(v) => setHeroData({ ...heroData, ctaSecondary: v })} />
                    </div>

                    <div className="border-t border-slate-700 pt-6">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Kurucu Bilgileri</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="İsim" value={heroData.founderName || ""} onChange={(v) => setHeroData({ ...heroData, founderName: v })} />
                            <InputField label="Ünvan" value={heroData.founderTitle || ""} onChange={(v) => setHeroData({ ...heroData, founderTitle: v })} />
                        </div>
                        <div className="mt-4">
                            <InputField label="Alıntı" value={heroData.founderQuote || ""} onChange={(v) => setHeroData({ ...heroData, founderQuote: v })} />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kurucu Görseli</label>
                            <ImageUpload value={heroData.founderImage || ""} onChange={(url) => setHeroData({ ...heroData, founderImage: url })} folder="hero" />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-6">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Özellikler</h4>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-3 gap-4 mb-4">
                                <InputField label={`Özellik ${i} İkon`} value={heroData[`feature${i}Icon`] || ""} onChange={(v) => setHeroData({ ...heroData, [`feature${i}Icon`]: v })} />
                                <InputField label={`Özellik ${i} Başlık`} value={heroData[`feature${i}Title`] || ""} onChange={(v) => setHeroData({ ...heroData, [`feature${i}Title`]: v })} />
                                <InputField label={`Özellik ${i} Açıklama`} value={heroData[`feature${i}Desc`] || ""} onChange={(v) => setHeroData({ ...heroData, [`feature${i}Desc`]: v })} />
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
                        <SaveButton onClick={saveManifesto} saving={saving === "manifesto"} />
                    </div>
                    <InputField label="Kısa Başlık" value={manifestoData.shortTitle || ""} onChange={(v) => setManifestoData({ ...manifestoData, shortTitle: v })} />
                    <TextareaField label="Kısa Metin" value={manifestoData.shortText || ""} onChange={(v) => setManifestoData({ ...manifestoData, shortText: v })} rows={3} />
                    <InputField label="Tam Başlık" value={manifestoData.fullTitle || ""} onChange={(v) => setManifestoData({ ...manifestoData, fullTitle: v })} />
                    <TextareaField label="Tam Metin" value={manifestoData.fullText || ""} onChange={(v) => setManifestoData({ ...manifestoData, fullText: v })} rows={6} />
                    <InputField label="İmza" value={manifestoData.signature || ""} onChange={(v) => setManifestoData({ ...manifestoData, signature: v })} />
                </div>
            )}
        </div>
    );
}
