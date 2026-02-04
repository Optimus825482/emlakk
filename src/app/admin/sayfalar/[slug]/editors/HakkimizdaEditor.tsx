"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { EditorProps } from "../_types";

export function HakkimizdaEditor({ config }: EditorProps) {
    const [founder, setFounder] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const res = await fetch("/api/about");
            const result = await res.json();
            setFounder(result.data?.founder || {});
        } catch (error) {
            console.error("HakkimizdaEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        setSaving(true);
        try {
            const response = await fetch("/api/about", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ founder }),
            });
            const result = await response.json();
            if (result.success) {
                alert("Kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("HakkimizdaEditor - Save error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <PageHeader config={config} />

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Kurucu Profili</h3>
                    <SaveButton onClick={save} saving={saving} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InputField label="İsim" value={founder.name || ""} onChange={(v) => setFounder({ ...founder, name: v })} />
                    <InputField label="Ünvan" value={founder.title || ""} onChange={(v) => setFounder({ ...founder, title: v })} />
                </div>
                <InputField label="Badge Metni" value={founder.badgeText || ""} onChange={(v) => setFounder({ ...founder, badgeText: v })} />
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Hero Başlık" value={founder.heroTitle || ""} onChange={(v) => setFounder({ ...founder, heroTitle: v })} />
                    <InputField label="Hero Vurgu" value={founder.heroTitleHighlight || ""} onChange={(v) => setFounder({ ...founder, heroTitleHighlight: v })} />
                </div>
                <InputField label="Anlatı Başlığı" value={founder.narrativeTitle || ""} onChange={(v) => setFounder({ ...founder, narrativeTitle: v })} />
                <TextareaField label="Anlatı Paragraf 1" value={founder.narrativeParagraph1 || ""} onChange={(v) => setFounder({ ...founder, narrativeParagraph1: v })} rows={4} />
                <TextareaField label="Anlatı Paragraf 2" value={founder.narrativeParagraph2 || ""} onChange={(v) => setFounder({ ...founder, narrativeParagraph2: v })} rows={4} />
                <InputField label="Ayırıcı Metin" value={founder.narrativeDividerText || ""} onChange={(v) => setFounder({ ...founder, narrativeDividerText: v })} />

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Profil Görseli</label>
                    <ImageUpload value={founder.image || ""} onChange={(url) => setFounder({ ...founder, image: url })} folder="founder" />
                </div>
            </div>
        </div>
    );
}
