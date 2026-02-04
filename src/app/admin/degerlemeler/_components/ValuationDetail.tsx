"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import type { Valuation, ComparableProperty } from "../_types";

interface ValuationDetailProps {
    valuation: Valuation;
    onDelete: (id: string) => void;
    onGeneratePDF: (valuation: Valuation) => void;
}

export function ValuationDetail({
    valuation,
    onDelete,
    onGeneratePDF,
}: ValuationDetailProps) {
    return (
        <div className="px-5 pb-5 pt-0 border-t border-slate-700 mt-0">
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <ContactInfo valuation={valuation} />

                {/* Property Features */}
                <PropertyDetails valuation={valuation} />

                {/* Actions */}
                <ActionButtons
                    valuation={valuation}
                    onDelete={onDelete}
                    onGeneratePDF={onGeneratePDF}
                />
            </div>

            {/* Market Analysis */}
            {valuation.marketAnalysis && (
                <MarketAnalysisSection analysis={valuation.marketAnalysis} />
            )}

            {/* Comparable Properties */}
            {valuation.comparables && valuation.comparables.length > 0 && (
                <ComparablesSection comparables={valuation.comparables} />
            )}
        </div>
    );
}

function ContactInfo({ valuation }: { valuation: Valuation }) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase">İletişim</h4>
            <div className="space-y-2">
                {valuation.phone && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="phone" className="text-slate-500" />
                        <span className="text-white">{valuation.phone}</span>
                    </div>
                )}
                {valuation.email && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="email" className="text-slate-500" />
                        <span className="text-white">{valuation.email}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

const DETAIL_LABELS: Record<string, string> = {
    floor: "Kat",
    mahalle: "Mahalle",
    roomCount: "Oda Sayısı",
    hasBalcony: "Balkon",
    hasParking: "Otopark",
    buildingAge: "Bina Yaşı",
    hasElevator: "Asansör",
    propertyType: "Mülk Tipi",
};

const DETAIL_COLORS: Record<string, string> = {
    floor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    mahalle: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    roomCount: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    hasBalcony: "bg-green-500/20 text-green-300 border-green-500/30",
    hasParking: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    buildingAge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    hasElevator: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    propertyType: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function PropertyDetails({ valuation }: { valuation: Valuation }) {
    const filteredDetails = valuation.details
        ? Object.entries(valuation.details).filter(
            ([key]) => !["lat", "lng", "area"].includes(key)
        )
        : [];

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase">Detaylar</h4>
            <div className="space-y-2">
                {/* Adres */}
                <div className="flex items-start gap-2 text-sm">
                    <Icon name="location_on" className="text-slate-500 mt-0.5" />
                    <div>
                        <p className="text-white text-xs leading-relaxed">
                            {valuation.address}, {valuation.city}
                        </p>
                        {valuation.details?.lat && valuation.details?.lng ? (
                            <p className="text-slate-400 text-[10px] mt-1">
                                {parseFloat(String(valuation.details.lat)).toFixed(6)},{" "}
                                {parseFloat(String(valuation.details.lng)).toFixed(6)}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Metrekare */}
                <div className="flex items-center gap-2 text-sm">
                    <Icon name="square_foot" className="text-slate-500" />
                    <span className="text-white">
                        {(valuation.details?.area as number) || valuation.area} m²
                    </span>
                </div>
            </div>

            <h4 className="text-sm font-bold text-slate-400 uppercase mt-4">
                Özellikler
            </h4>
            <div className="flex flex-wrap gap-2">
                {filteredDetails.length > 0 ? (
                    filteredDetails.map(([key, value]) => {
                        const label = DETAIL_LABELS[key] || key;
                        const colorClass =
                            DETAIL_COLORS[key] || "bg-slate-700 text-slate-300 border-slate-600";

                        return (
                            <span
                                key={key}
                                className={`text-xs px-2 py-1 rounded border ${colorClass}`}
                            >
                                {label}:{" "}
                                {typeof value === "boolean"
                                    ? value
                                        ? "Var"
                                        : "Yok"
                                    : String(value)}
                            </span>
                        );
                    })
                ) : (
                    <span className="text-slate-500 text-sm">Özellik belirtilmemiş</span>
                )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Icon name="calendar_today" className="text-[10px]" />
                    Analiz Tarihi:{" "}
                    {new Date(valuation.createdAt).toLocaleString("tr-TR")}
                </p>
            </div>
        </div>
    );
}

function ActionButtons({
    valuation,
    onDelete,
    onGeneratePDF,
}: {
    valuation: Valuation;
    onDelete: (id: string) => void;
    onGeneratePDF: (valuation: Valuation) => void;
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase">İşlemler</h4>
            <div className="flex flex-wrap gap-2">
                {valuation.estimatedValue && (
                    <button
                        onClick={() => onGeneratePDF(valuation)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        <Icon name="picture_as_pdf" />
                        Raporu Yazdır / İndir
                    </button>
                )}
                <button
                    onClick={() => onDelete(valuation.id)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-slate-600"
                >
                    <Icon name="delete" />
                    Sil
                </button>
            </div>
        </div>
    );
}

function MarketAnalysisSection({ analysis }: { analysis: string }) {
    return (
        <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                <Icon name="auto_awesome" className="text-purple-400 text-xs" />
                AI Pazar Analizi & Özet
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;{analysis}&rdquo;
            </p>
        </div>
    );
}

function ComparablesSection({ comparables }: { comparables: ComparableProperty[] }) {
    return (
        <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Icon name="list" className="text-emerald-400 text-xs" />
                Eşleşen Benzer İlanlar ({comparables.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparables.map((comp, i) => (
                    <div
                        key={i}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-slate-500">ID: {comp.id}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                                %{Math.round(comp.similarity || 0)} Benzer
                            </Badge>
                        </div>
                        <h5 className="text-white text-xs font-medium line-clamp-1 mb-2">
                            {comp.baslik}
                        </h5>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-emerald-400 font-bold text-sm">
                                    ₺{comp.fiyat?.toLocaleString("tr-TR")}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                    {comp.m2}m² • ₺
                                    {Math.round(comp.fiyat / comp.m2).toLocaleString("tr-TR")}/m²
                                </p>
                            </div>
                            <p className="text-slate-400 text-[10px] flex items-center gap-1">
                                <Icon name="location_on" className="text-[10px]" />
                                {(comp.distance || 0).toFixed(2)} km
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
