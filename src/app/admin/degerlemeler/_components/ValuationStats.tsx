"use client";

import { Icon } from "@/components/ui/icon";

interface ValuationStatsProps {
    total: number;
    page: number;
    totalPages: number;
    groupByUser: boolean;
    onToggleGroupView: () => void;
}

export function ValuationStats({
    total,
    page,
    totalPages,
    groupByUser,
    onToggleGroupView,
}: ValuationStatsProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                    Değerleme Raporları
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    {total} değerleme raporu • Sayfa {page}/{totalPages}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleGroupView}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${groupByUser
                            ? "bg-emerald-500 text-slate-900"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                        }`}
                >
                    <Icon name={groupByUser ? "group" : "list"} />
                    {groupByUser ? "Gruplu Görünüm" : "Liste Görünümü"}
                </button>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <Icon name="auto_awesome" className="text-purple-400" />
                    <span className="text-sm text-slate-300">
                        AI Engine: <span className="text-emerald-400">Active</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
