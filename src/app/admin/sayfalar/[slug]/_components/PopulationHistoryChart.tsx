"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import type { PopulationData } from "../_types";

export function PopulationHistoryChart() {
    const [data, setData] = useState<PopulationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

    useEffect(() => {
        fetchPopulationData();
    }, []);

    async function fetchPopulationData() {
        try {
            const res = await fetch("/api/hendek-stats?type=population");
            const result = await res.json();
            const sorted = (result.data || []).sort(
                (a: PopulationData, b: PopulationData) => a.year - b.year
            );
            setData(sorted);
        } catch (error) {
            console.error("PopulationHistoryChart - Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-center h-48">
                    <Icon name="sync" className="text-2xl text-emerald-400 animate-spin" />
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Icon name="show_chart" className="text-emerald-400 text-xl" />
                    <h3 className="text-lg font-bold text-white">Nüfus Geçmişi (2000-2024)</h3>
                </div>
                <p className="text-slate-400 text-center py-8">Nüfus verisi bulunamadı</p>
            </div>
        );
    }

    const maxPopulation = Math.max(...data.map((d) => d.totalPopulation));
    const minPopulation = Math.min(...data.map((d) => d.totalPopulation));
    const latestData = data[data.length - 1];
    const oldestData = data[0];
    const totalGrowth =
        latestData && oldestData
            ? (((latestData.totalPopulation - oldestData.totalPopulation) / oldestData.totalPopulation) * 100).toFixed(1)
            : "0";

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Icon name="show_chart" className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Nüfus Geçmişi (2000-2024)</h3>
                        <p className="text-slate-500 text-sm">25 yıllık nüfus değişimi</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode("chart")}
                        aria-label="Grafik görünümü"
                        aria-pressed={viewMode === "chart"}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "chart"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-slate-400 hover:text-white hover:bg-slate-700"
                            }`}
                    >
                        <Icon name="bar_chart" />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        aria-label="Tablo görünümü"
                        aria-pressed={viewMode === "table"}
                        className={`p-2 rounded-lg transition-colors ${viewMode === "table"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-slate-400 hover:text-white hover:bg-slate-700"
                            }`}
                    >
                        <Icon name="table_rows" />
                    </button>
                </div>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Güncel Nüfus</p>
                    <p className="text-white font-bold text-lg">{latestData?.totalPopulation.toLocaleString("tr-TR")}</p>
                    <p className="text-slate-500 text-xs">{latestData?.year}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Başlangıç</p>
                    <p className="text-white font-bold text-lg">{oldestData?.totalPopulation.toLocaleString("tr-TR")}</p>
                    <p className="text-slate-500 text-xs">{oldestData?.year}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Toplam Artış</p>
                    <p className="text-emerald-400 font-bold text-lg">%{totalGrowth}</p>
                    <p className="text-slate-500 text-xs">25 yılda</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Veri Sayısı</p>
                    <p className="text-white font-bold text-lg">{data.length}</p>
                    <p className="text-slate-500 text-xs">yıl</p>
                </div>
            </div>

            {/* Chart View */}
            {viewMode === "chart" && (
                <div className="space-y-4">
                    <div className="flex items-end gap-1 h-48 px-2">
                        {data.map((item, index) => {
                            const height = ((item.totalPopulation - minPopulation) / (maxPopulation - minPopulation)) * 100;
                            const normalizedHeight = Math.max(height, 5);
                            const isLatest = index === data.length - 1;
                            const showLabel = index % 5 === 0 || isLatest;

                            return (
                                <div key={item.id} className="flex-1 flex flex-col items-center group relative">
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                                            <p className="text-white font-bold">{item.year}</p>
                                            <p className="text-slate-300">{item.totalPopulation.toLocaleString("tr-TR")} kişi</p>
                                            {item.growthRate && (
                                                <p className={parseFloat(item.growthRate) >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {parseFloat(item.growthRate) >= 0 ? "+" : ""}{item.growthRate}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`w-full rounded-t transition-all duration-300 ${isLatest ? "bg-emerald-500 group-hover:bg-emerald-400" : "bg-slate-600 group-hover:bg-slate-500"
                                            }`}
                                        style={{ height: `${normalizedHeight}%` }}
                                    />
                                    {showLabel && (
                                        <span className="text-[10px] text-slate-500 mt-1 transform -rotate-45 origin-top-left">
                                            {item.year}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-700">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-slate-600 rounded" />
                            Geçmiş Yıllar
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-500 rounded" />
                            Güncel ({latestData?.year})
                        </span>
                    </div>
                </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-800">
                            <tr className="text-slate-400 border-b border-slate-700">
                                <th className="text-left py-2 px-3">Yıl</th>
                                <th className="text-right py-2 px-3">Toplam</th>
                                <th className="text-right py-2 px-3">Erkek</th>
                                <th className="text-right py-2 px-3">Kadın</th>
                                <th className="text-right py-2 px-3">Artış</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...data].reverse().map((item) => (
                                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-2 px-3 text-white font-medium">{item.year}</td>
                                    <td className="py-2 px-3 text-right text-white">{item.totalPopulation.toLocaleString("tr-TR")}</td>
                                    <td className="py-2 px-3 text-right text-blue-400">{item.malePopulation?.toLocaleString("tr-TR") || "-"}</td>
                                    <td className="py-2 px-3 text-right text-pink-400">{item.femalePopulation?.toLocaleString("tr-TR") || "-"}</td>
                                    <td className={`py-2 px-3 text-right ${item.growthRate && parseFloat(item.growthRate) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {item.growthRate ? `${parseFloat(item.growthRate) >= 0 ? "+" : ""}${item.growthRate}%` : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi</span>
                <span>Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</span>
            </div>
        </div>
    );
}
