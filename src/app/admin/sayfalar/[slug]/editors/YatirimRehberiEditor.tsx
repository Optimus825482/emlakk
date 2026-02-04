"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { EditorProps, RehberContent, RehberFeature } from "../_types";

export function YatirimRehberiEditor({ config }: EditorProps) {
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
                const result = await res.json();
                if (result.data) {
                    setContent({
                        title: result.data.title || "Hendek Yatırım Rehberi",
                        subtitle: result.data.subtitle || "Veriye Dayalı Akıllı Yatırım Kararları",
                        description: result.data.description || "",
                        comingSoonText: result.data.comingSoonText || "",
                        features: result.data.features || [],
                        progressItems: result.data.progressItems || [
                            { label: "Pazar Araştırması", progress: 100 },
                            { label: "Veri Analizi", progress: 85 },
                            { label: "İçerik Hazırlığı", progress: 60 },
                            { label: "Tasarım & Geliştirme", progress: 40 },
                        ],
                    });
                }
            }
        } catch (error) {
            console.error("RehberEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        setSaving(true);
        try {
            const response = await fetch("/api/content/investment_guide_page", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: content }),
            });
            const result = await response.json();
            if (result.success) {
                alert("Kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("RehberEditor - Save error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(false);
        }
    }

    function updateFeature(index: number, field: keyof RehberFeature, value: string) {
        const newFeatures = [...content.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setContent({ ...content, features: newFeatures });
    }

    function addFeature() {
        setContent({
            ...content,
            features: [...content.features, { icon: "star", title: "", description: "" }],
        });
    }

    function removeFeature(index: number) {
        setContent({
            ...content,
            features: content.features.filter((_, i) => i !== index),
        });
    }

    function updateProgress(index: number, field: "label" | "progress", value: string | number) {
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

            {/* Genel Bilgiler Tab */}
            {activeTab === "genel" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Hero Bölümü</h3>
                        <SaveButton onClick={save} saving={saving} />
                    </div>

                    <InputField label="Başlık" value={content.title} onChange={(v) => setContent({ ...content, title: v })} />
                    <InputField label="Alt Başlık" value={content.subtitle} onChange={(v) => setContent({ ...content, subtitle: v })} />
                    <TextareaField label="Açıklama" value={content.description} onChange={(v) => setContent({ ...content, description: v })} rows={5} />
                    <TextareaField label="Yakında Yayında Metni" value={content.comingSoonText} onChange={(v) => setContent({ ...content, comingSoonText: v })} rows={3} />
                </div>
            )}

            {/* Özellikler Tab */}
            {activeTab === "ozellikler" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Rehber Özellikleri</h3>
                        <div className="flex gap-2">
                            <button onClick={addFeature} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">
                                <Icon name="add" />
                                Özellik Ekle
                            </button>
                            <SaveButton onClick={save} saving={saving} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.features.map((feature, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Özellik {idx + 1}</span>
                                    <button onClick={() => removeFeature(idx)} aria-label={`Özellik ${idx + 1} sil`} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded">
                                        <Icon name="delete" className="text-sm" />
                                    </button>
                                </div>
                                <InputField label="İkon (Material Icon)" value={feature.icon} onChange={(v) => updateFeature(idx, "icon", v)} />
                                <InputField label="Başlık" value={feature.title} onChange={(v) => updateFeature(idx, "title", v)} />
                                <TextareaField label="Açıklama" value={feature.description} onChange={(v) => updateFeature(idx, "description", v)} rows={2} />
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
                            <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                                <div className="grid grid-cols-3 gap-4 items-end">
                                    <div className="col-span-2">
                                        <InputField label="Etiket" value={item.label} onChange={(v) => updateProgress(idx, "label", v)} />
                                    </div>
                                    <div>
                                        <label htmlFor={`progress-${idx}`} className="block text-sm font-medium text-slate-300 mb-2">İlerleme (%)</label>
                                        <input
                                            id={`progress-${idx}`}
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.progress}
                                            onChange={(e) => updateProgress(idx, "progress", parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className="text-emerald-400">{item.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${item.progress === 100 ? "bg-green-500" : "bg-emerald-500"}`} style={{ width: `${item.progress}%` }} />
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
                        <h4 className="font-semibold text-white mb-1">Hendek İstatistikleri</h4>
                        <p className="text-slate-400 text-sm mb-3">
                            Yatırım Rehberi sayfasında gösterilen Hendek istatistikleri (nüfus, OSB, üniversite vb.) otomatik olarak{" "}
                            <strong className="text-emerald-400">Hendek Verileri</strong> sayfasından çekilmektedir.
                        </p>
                        <Link href="/admin/sayfalar/hendek" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                            <Icon name="arrow_forward" />
                            Hendek Verilerini Düzenle
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
