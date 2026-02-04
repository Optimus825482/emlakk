"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { EditorProps, IletisimContent } from "../_types";

export function IletisimEditor({ config }: EditorProps) {
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
            const contentRes = await fetch("/api/content/contact_page");
            if (contentRes.ok) {
                const contentResult = await contentRes.json();
                if (contentResult.data) {
                    setContent({ ...content, ...contentResult.data });
                }
            }

            const settingsRes = await fetch("/api/settings");
            if (settingsRes.ok) {
                const settingsResult = await settingsRes.json();
                if (settingsResult.data) {
                    setSettings({
                        phone: settingsResult.data.phone || "",
                        email: settingsResult.data.email || "",
                        whatsapp: settingsResult.data.whatsapp || "",
                        address: settingsResult.data.address || "",
                        mapEmbedUrl: settingsResult.data.mapEmbedUrl || "",
                    });
                }
            }
        } catch (error) {
            console.error("IletisimEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function saveContent() {
        setSaving(true);
        try {
            const response = await fetch("/api/content/contact_page", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: content }),
            });
            const result = await response.json();
            if (result.success) {
                alert("İçerik kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("IletisimEditor - Save content error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(false);
        }
    }

    async function saveSettings() {
        setSaving(true);
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const result = await response.json();
            if (result.success) {
                alert("Ayarlar kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("IletisimEditor - Save settings error:", error);
            alert("Kaydetme hatası!");
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
            features: [...content.features, { icon: "check", title: "", description: "" }],
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
                    { key: "iletisim", label: "İletişim Bilgileri", icon: "contact_phone" },
                    { key: "bildirim", label: "Bildirim Ayarları", icon: "notifications" },
                    { key: "ozellikler", label: "Alt Özellikler", icon: "grid_view" },
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

            {/* Sayfa İçeriği Tab */}
            {activeTab === "genel" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Hero & Form Metinleri</h3>
                        <SaveButton onClick={saveContent} saving={saving} />
                    </div>

                    <InputField label="Hero Başlık" value={content.heroTitle} onChange={(v) => setContent({ ...content, heroTitle: v })} />
                    <TextareaField label="Hero Açıklama" value={content.heroDescription} onChange={(v) => setContent({ ...content, heroDescription: v })} rows={3} />

                    <div className="border-t border-slate-700 pt-6">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Form Metinleri</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Form Başlık" value={content.formTitle} onChange={(v) => setContent({ ...content, formTitle: v })} />
                            <InputField label="Form Açıklama" value={content.formDescription} onChange={(v) => setContent({ ...content, formDescription: v })} />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-6">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Başarı Mesajı</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Başarı Başlık" value={content.successTitle} onChange={(v) => setContent({ ...content, successTitle: v })} />
                            <InputField label="Başarı Mesajı" value={content.successMessage} onChange={(v) => setContent({ ...content, successMessage: v })} />
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
                        <InputField label="Telefon" value={settings.phone} onChange={(v) => setSettings({ ...settings, phone: v })} />
                        <InputField label="E-posta" value={settings.email} onChange={(v) => setSettings({ ...settings, email: v })} />
                    </div>
                    <InputField label="WhatsApp Numarası" value={settings.whatsapp} onChange={(v) => setSettings({ ...settings, whatsapp: v })} />
                    <TextareaField label="Adres" value={settings.address} onChange={(v) => setSettings({ ...settings, address: v })} rows={2} />
                    <InputField label="Google Maps Embed URL" value={settings.mapEmbedUrl} onChange={(v) => setSettings({ ...settings, mapEmbedUrl: v })} />
                    <p className="text-xs text-slate-500">Google Maps'ten "Paylaş" → "Haritayı yerleştir" → iframe src URL'sini kopyalayın</p>
                </div>
            )}

            {/* Bildirim Ayarları Tab */}
            {activeTab === "bildirim" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Form Bildirim Ayarları</h3>
                        <SaveButton onClick={saveContent} saving={saving} />
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icon name="info" className="text-blue-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300">İletişim formundan gelen mesajlar bu e-posta adresine gönderilecek.</p>
                            </div>
                        </div>
                    </div>

                    <InputField label="Bildirim E-posta Adresi" value={content.notificationEmail} onChange={(v) => setContent({ ...content, notificationEmail: v })} />
                    <p className="text-xs text-slate-500">Birden fazla e-posta için virgülle ayırın: ornek1@mail.com, ornek2@mail.com</p>
                </div>
            )}

            {/* Alt Özellikler Tab */}
            {activeTab === "ozellikler" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Sayfa Alt Özellikleri</h3>
                        <div className="flex gap-2">
                            <button onClick={addFeature} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">
                                <Icon name="add" />
                                Ekle
                            </button>
                            <SaveButton onClick={saveContent} saving={saving} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {content.features.map((feature, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-slate-500">Özellik {idx + 1}</span>
                                    <button onClick={() => removeFeature(idx)} aria-label={`Özellik ${idx + 1} sil`} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded">
                                        <Icon name="delete" className="text-sm" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <InputField label="İkon" value={feature.icon} onChange={(v) => updateFeature(idx, "icon", v)} />
                                    <InputField label="Başlık" value={feature.title} onChange={(v) => updateFeature(idx, "title", v)} />
                                    <InputField label="Açıklama" value={feature.description} onChange={(v) => updateFeature(idx, "description", v)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {content.features.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Icon name="grid_view" className="text-4xl mb-2" />
                            <p>Henüz özellik eklenmemiş</p>
                            <p className="text-xs mt-1">Sayfanın altında gösterilecek özellik kartları</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
