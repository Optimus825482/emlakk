"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { EditorProps, RandevuContent } from "../_types";

export function RandevuEditor({ config }: EditorProps) {
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
            { key: "kahve", label: "Kahve Sohbeti", icon: "coffee", description: "Tanışma ve genel danışmanlık", duration: "30 dk", isActive: true },
            { key: "property_visit", label: "Mülk Gezisi", icon: "home", description: "Yerinde mülk inceleme", duration: "1 saat", isActive: true },
            { key: "valuation", label: "Değerleme Randevusu", icon: "calculate", description: "Detaylı mülk değerleme", duration: "45 dk", isActive: true },
            { key: "consultation", label: "Yatırım Danışmanlığı", icon: "trending_up", description: "Yatırım stratejisi görüşmesi", duration: "1 saat", isActive: true },
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
                const result = await res.json();
                if (result.data) {
                    setContent({ ...content, ...result.data });
                }
            }
        } catch (error) {
            console.error("RandevuEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        setSaving(true);
        try {
            const response = await fetch("/api/content/appointment_page", {
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
            console.error("RandevuEditor - Save error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(false);
        }
    }

    function updateAppointmentType(index: number, field: string, value: string | boolean) {
        const newTypes = [...content.appointmentTypes];
        newTypes[index] = { ...newTypes[index], [field]: value };
        setContent({ ...content, appointmentTypes: newTypes });
    }

    function addAppointmentType() {
        setContent({
            ...content,
            appointmentTypes: [
                ...content.appointmentTypes,
                { key: `type_${Date.now()}`, label: "", icon: "event", description: "", duration: "30 dk", isActive: true },
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
                    { key: "bildirim", label: "Bildirim Ayarları", icon: "notifications" },
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
                        <h3 className="text-lg font-bold text-white">Hero & Mesajlar</h3>
                        <SaveButton onClick={save} saving={saving} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Hero Başlık" value={content.heroTitle} onChange={(v) => setContent({ ...content, heroTitle: v })} />
                        <InputField label="Vurgulu Kelime" value={content.heroHighlight} onChange={(v) => setContent({ ...content, heroHighlight: v })} />
                    </div>
                    <TextareaField label="Hero Açıklama" value={content.heroDescription} onChange={(v) => setContent({ ...content, heroDescription: v })} rows={2} />

                    <div className="border-t border-slate-700 pt-6">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Başarı Mesajı</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Başarı Başlık" value={content.successTitle} onChange={(v) => setContent({ ...content, successTitle: v })} />
                            <InputField label="Başarı Mesajı" value={content.successMessage} onChange={(v) => setContent({ ...content, successMessage: v })} />
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
                            <button onClick={addAppointmentType} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm">
                                <Icon name="add" />
                                Tip Ekle
                            </button>
                            <SaveButton onClick={save} saving={saving} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.appointmentTypes.map((type, idx) => (
                            <div key={idx} className={`bg-slate-900 border rounded-xl p-4 ${type.isActive ? "border-slate-700" : "border-red-500/30 opacity-60"}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Icon name={type.icon} className="text-emerald-400" />
                                        <span className="text-xs text-slate-500">Tip {idx + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={type.isActive}
                                                onChange={(e) => updateAppointmentType(idx, "isActive", e.target.checked)}
                                                className="rounded border-slate-600 bg-slate-900 text-emerald-500"
                                            />
                                            <span className="text-xs text-slate-400">Aktif</span>
                                        </label>
                                        <button onClick={() => removeAppointmentType(idx)} aria-label={`Randevu tipi ${idx + 1} sil`} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded">
                                            <Icon name="delete" className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputField label="Başlık" value={type.label} onChange={(v) => updateAppointmentType(idx, "label", v)} />
                                        <InputField label="İkon" value={type.icon} onChange={(v) => updateAppointmentType(idx, "icon", v)} />
                                    </div>
                                    <InputField label="Açıklama" value={type.description} onChange={(v) => updateAppointmentType(idx, "description", v)} />
                                    <InputField label="Süre" value={type.duration} onChange={(v) => updateAppointmentType(idx, "duration", v)} />
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

                    <p className="text-sm text-slate-400">Randevu sayfasının altında gösterilen danışman bilgileri</p>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="İsim" value={content.brokerName} onChange={(v) => setContent({ ...content, brokerName: v })} />
                        <InputField label="Ünvan" value={content.brokerTitle} onChange={(v) => setContent({ ...content, brokerTitle: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Telefon" value={content.brokerPhone} onChange={(v) => setContent({ ...content, brokerPhone: v })} />
                        <InputField label="E-posta" value={content.brokerEmail} onChange={(v) => setContent({ ...content, brokerEmail: v })} />
                    </div>
                </div>
            )}

            {/* Bildirim Ayarları Tab */}
            {activeTab === "bildirim" && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Randevu Bildirim Ayarları</h3>
                        <SaveButton onClick={save} saving={saving} />
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Icon name="info" className="text-blue-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300">Yeni randevu talepleri bu e-posta adresine bildirilecek.</p>
                            </div>
                        </div>
                    </div>

                    <InputField label="Bildirim E-posta Adresi" value={content.notificationEmail} onChange={(v) => setContent({ ...content, notificationEmail: v })} />
                    <p className="text-xs text-slate-500">Birden fazla e-posta için virgülle ayırın: ornek1@mail.com, ornek2@mail.com</p>
                </div>
            )}
        </div>
    );
}
