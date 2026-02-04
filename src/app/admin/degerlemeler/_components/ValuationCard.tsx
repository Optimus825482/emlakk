"use client";

import { Icon } from "@/components/ui/icon";
import { valuationPropertyTypeLabels } from "@/lib/validations/valuation";
import type { Valuation } from "../_types";
import { PROPERTY_TYPE_COLORS, PROPERTY_TYPE_ICONS } from "../_types";
import { ValuationDetail } from "./ValuationDetail";

interface ValuationCardProps {
    valuation: Valuation;
    isSelected: boolean;
    onSelect: (id: string | null) => void;
    onDelete: (id: string) => void;
    onGeneratePDF: (valuation: Valuation) => void;
}

export function ValuationCard({
    valuation,
    isSelected,
    onSelect,
    onDelete,
    onGeneratePDF,
}: ValuationCardProps) {
    return (
        <div
            className={`bg-slate-800 border rounded-lg overflow-hidden transition-all ${isSelected
                ? "border-emerald-500"
                : "border-slate-700 hover:border-slate-600"
                }`}
        >
            {/* Main Row */}
            <div
                className="p-5 cursor-pointer"
                onClick={() => onSelect(isSelected ? null : valuation.id)}
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Tarih/Saat */}
                        <DateInfo createdAt={valuation.createdAt} />

                        {/* Type Icon */}
                        <div
                            className={`w-12 h-12 rounded-lg ${PROPERTY_TYPE_COLORS[valuation.propertyType]
                                } flex items-center justify-center`}
                        >
                            <Icon
                                name={PROPERTY_TYPE_ICONS[valuation.propertyType]}
                                className="text-white text-xl"
                            />
                        </div>

                        {/* Name & Type */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-medium">
                                    {valuation.name || "İsimsiz"}
                                </h3>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded ${PROPERTY_TYPE_COLORS[valuation.propertyType]
                                        } text-white`}
                                >
                                    {valuationPropertyTypeLabels[valuation.propertyType]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                        <AreaInfo area={valuation.area} />
                        {valuation.estimatedValue && (
                            <ValueInfo value={valuation.estimatedValue} />
                        )}
                        {valuation.confidenceScore && (
                            <ConfidenceScore score={valuation.confidenceScore} />
                        )}
                        <StatusBadge hasValue={!!valuation.estimatedValue} />
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isSelected && (
                <ValuationDetail
                    valuation={valuation}
                    onDelete={onDelete}
                    onGeneratePDF={onGeneratePDF}
                />
            )}
        </div>
    );
}

function DateInfo({ createdAt }: { createdAt: string }) {
    return (
        <div className="text-left min-w-35">
            <p className="text-slate-500 text-[10px] uppercase mb-1">
                Değerleme Tarihi
            </p>
            <p className="text-slate-300 text-xs font-mono">
                {new Date(createdAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })}
            </p>
            <p className="text-slate-400 text-[10px] font-mono">
                {new Date(createdAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </p>
        </div>
    );
}

function AreaInfo({ area }: { area: number }) {
    return (
        <div className="text-right">
            <p className="text-slate-500 text-xs uppercase">Alan</p>
            <p className="text-white font-mono">{area.toLocaleString("tr-TR")}m²</p>
        </div>
    );
}

function ValueInfo({ value }: { value: string }) {
    return (
        <div className="text-right">
            <p className="text-slate-500 text-xs uppercase">Tahmini Değer</p>
            <p className="text-emerald-400 font-mono font-bold">
                ₺{(parseFloat(value) / 1000000).toFixed(2)}M
            </p>
        </div>
    );
}

function ConfidenceScore({ score }: { score: number }) {
    return (
        <div className="text-right">
            <p className="text-slate-500 text-xs uppercase">AI Güven</p>
            <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className="text-emerald-400 text-sm font-mono">{score}%</span>
            </div>
        </div>
    );
}

function StatusBadge({ hasValue }: { hasValue: boolean }) {
    return (
        <span
            className={`text-xs px-3 py-1.5 rounded border ${hasValue
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                }`}
        >
            {hasValue ? "Tamamlandı" : "Bekliyor"}
        </span>
    );
}
