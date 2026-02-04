"use client";

import { valuationPropertyTypeLabels } from "@/lib/validations/valuation";

interface ValuationFiltersProps {
    filter: string;
    onFilterChange: (filter: string) => void;
}

const FILTER_OPTIONS = ["all", "konut", "sanayi", "tarim", "ticari", "arsa"] as const;

export function ValuationFilters({ filter, onFilterChange }: ValuationFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((type) => (
                <button
                    key={type}
                    onClick={() => onFilterChange(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === type
                            ? "bg-emerald-500 text-slate-900"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                        }`}
                >
                    {type === "all" ? "Tümü" : valuationPropertyTypeLabels[type]}
                </button>
            ))}
        </div>
    );
}
