"use client";

import { useState, useEffect } from "react";
import { PageHeader, LoadingSpinner, SaveButton, InputField, TextareaField } from "../_components";
import type { PageConfig } from "../_types";

interface GenericEditorProps {
    slug: string;
    config: PageConfig;
}

export function GenericPageEditor({ slug, config }: GenericEditorProps) {
    const [content, setContent] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [slug]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/page-content?page=${slug}`);
            const result = await res.json();
            if (Array.isArray(result.data) && result.data.length > 0) {
                const merged: Record<string, string> = {};
                result.data.forEach((item: Record<string, string>) => {
                    Object.keys(item).forEach((key) => {
                        if (item[key]) merged[`${item.sectionKey}_${key}`] = item[key];
                    });
                });
                setContent(merged);
            }
        } catch (error) {
            console.error("GenericPageEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        setSaving(true);
        try {
            const response = await fetch("/api/page-content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageSlug: slug,
                    sectionKey: "hero",
                    title: content.hero_title,
                    subtitle: content.hero_subtitle,
                    description: content.hero_description,
                }),
            });
            const result = await response.json();
            if (result.success) {
                alert("Kaydedildi!");
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("GenericPageEditor - Save error:", error);
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
                    <h3 className="text-lg font-bold text-white">Sayfa İçeriği</h3>
                    <SaveButton onClick={save} saving={saving} />
                </div>

                <InputField label="Başlık" value={content.hero_title || ""} onChange={(v) => setContent({ ...content, hero_title: v })} />
                <InputField label="Alt Başlık" value={content.hero_subtitle || ""} onChange={(v) => setContent({ ...content, hero_subtitle: v })} />
                <TextareaField label="Açıklama" value={content.hero_description || ""} onChange={(v) => setContent({ ...content, hero_description: v })} rows={4} />
            </div>
        </div>
    );
}
