"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { PageHeader, LoadingSpinner, PopulationHistoryChart } from "../_components";
import type { EditorProps, HendekStat } from "../_types";

export function HendekEditor({ config }: EditorProps) {
    const [stats, setStats] = useState<HendekStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [crawling, setCrawling] = useState(false);
    const [lastCrawl, setLastCrawl] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const res = await fetch("/api/hendek-stats");
            const result = await res.json();
            setStats(result.data || []);

            const crawlRes = await fetch("/api/hendek-stats/crawl-status");
            if (crawlRes.ok) {
                const crawlData = await crawlRes.json();
                setLastCrawl(crawlData.lastCrawl);
            }
        } catch (error) {
            console.error("HendekEditor - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function saveStat(stat: HendekStat) {
        setSaving(stat.id);
        try {
            const response = await fetch("/api/hendek-stats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stat),
            });
            const result = await response.json();
            if (result.success) {
                await fetchData();
            } else {
                alert("Kaydetme hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("HendekEditor - Save stat error:", error);
            alert("Kaydetme hatası!");
        } finally {
            setSaving(null);
        }
    }

    async function runCrawler() {
        setCrawling(true);
        try {
            const res = await fetch("/api/hendek-stats/crawl", { method: "POST" });
            const result = await res.json();
            if (result.success) {
                await fetchData();
                alert("Veriler başarıyla güncellendi!");
            } else {
                alert("Crawl hatası: " + (result.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error("Crawl error:", error);
            alert("Crawl sırasında hata oluştu");
        } finally {
            setCrawling(false);
        }
    }

    function updateStat(id: string, field: string, value: string | number | boolean | null) {
        setStats((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <PageHeader config={config} />

            {/* Crawler Kontrol Paneli */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Icon name="cloud_sync" className="text-blue-400" />
                            Otomatik Veri Güncelleme
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">TÜİK ve resmi kaynaklardan güncel verileri çek</p>
                        {lastCrawl && (
                            <p className="text-slate-500 text-xs mt-2">Son güncelleme: {new Date(lastCrawl).toLocaleString("tr-TR")}</p>
                        )}
                    </div>
                    <button
                        onClick={runCrawler}
                        disabled={crawling}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                        {crawling ? (
                            <>
                                <Icon name="sync" className="animate-spin" />
                                Güncelleniyor...
                            </>
                        ) : (
                            <>
                                <Icon name="refresh" />
                                Verileri Güncelle
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((stat) => (
                    <div key={stat.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                                    <Icon name={stat.icon} className={`text-${stat.color}-400`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{stat.label}</h4>
                                    <span className="text-xs text-slate-500">{stat.key}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => saveStat(stat)}
                                disabled={saving === stat.id}
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving === stat.id ? <Icon name="sync" className="animate-spin" /> : <Icon name="save" />}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={`stat-value-${stat.id}`} className="block text-xs text-slate-500 mb-1">Değer</label>
                                    <input
                                        id={`stat-value-${stat.id}`}
                                        type="text"
                                        value={stat.value}
                                        onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`stat-numeric-${stat.id}`} className="block text-xs text-slate-500 mb-1">Sayısal</label>
                                    <input
                                        id={`stat-numeric-${stat.id}`}
                                        type="number"
                                        value={stat.numericValue || ""}
                                        onChange={(e) => updateStat(stat.id, "numericValue", parseInt(e.target.value) || null)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor={`stat-desc-${stat.id}`} className="block text-xs text-slate-500 mb-1">Açıklama</label>
                                <input
                                    id={`stat-desc-${stat.id}`}
                                    type="text"
                                    value={stat.description || ""}
                                    onChange={(e) => updateStat(stat.id, "description", e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    Kaynak: {stat.source || "Belirtilmemiş"} {stat.year && `(${stat.year})`}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={stat.isActive}
                                        onChange={(e) => updateStat(stat.id, "isActive", e.target.checked)}
                                        className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-slate-400">Aktif</span>
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bilgi Kutusu */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="info" className="text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">Veri Kaynakları</h4>
                        <p className="text-slate-400 text-sm">
                            Veriler TÜİK, Sakarya 2. OSB ve Hendek Belediyesi resmi kaynaklarından alınmaktadır. Otomatik güncelleme ile veriler periyodik olarak kontrol edilir.
                        </p>
                    </div>
                </div>
            </div>

            {/* Nüfus Geçmişi Grafiği */}
            <PopulationHistoryChart />
        </div>
    );
}
