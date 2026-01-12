"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { valuationPropertyTypeLabels } from "@/lib/validations/valuation";

interface Valuation {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  propertyType: "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
  address: string;
  city: string;
  district: string | null;
  area: number;
  details: Record<string, unknown> | null;
  estimatedValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  pricePerSqm: string | null;
  confidenceScore: number | null;
  marketAnalysis: string | null;
  createdAt: string;
}

interface ApiResponse {
  data: Valuation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const typeColors: Record<string, string> = {
  konut: "bg-orange-500",
  sanayi: "bg-blue-500",
  tarim: "bg-emerald-500",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

const typeIcons: Record<string, string> = {
  konut: "home",
  sanayi: "factory",
  tarim: "agriculture",
  ticari: "store",
  arsa: "landscape",
};

export default function AdminDegerlemelerPage() {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedValuation, setSelectedValuation] = useState<string | null>(
    null
  );

  const fetchValuations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("propertyType", filter);

      const response = await fetch(`/api/valuations?${params.toString()}`);
      if (!response.ok) throw new Error("Değerlemeler yüklenemedi");

      const result: ApiResponse = await response.json();
      setValuations(result.data);
    } catch (error) {
      console.error("Değerleme yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchValuations();
  }, [fetchValuations]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu değerleme talebini silmek istediğinize emin misiniz?"))
      return;

    try {
      await fetch(`/api/valuations/${id}`, { method: "DELETE" });
      setSelectedValuation(null);
      fetchValuations();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const completedCount = valuations.filter((v) => v.estimatedValue).length;
  const pendingCount = valuations.filter((v) => !v.estimatedValue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            AI Değerleme Talepleri
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {valuations.length} değerleme talebi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <Icon name="auto_awesome" className="text-purple-400" />
            <span className="text-sm text-slate-300">
              AI Engine: <span className="text-emerald-400">Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs uppercase">Toplam Talep</p>
            <Icon name="calculate" className="text-slate-500" />
          </div>
          <p className="text-2xl font-mono text-white">{valuations.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs uppercase">Bekleyen</p>
            <Icon name="hourglass_empty" className="text-yellow-400" />
          </div>
          <p className="text-2xl font-mono text-yellow-400">{pendingCount}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs uppercase">Tamamlanan</p>
            <Icon name="check_circle" className="text-emerald-400" />
          </div>
          <p className="text-2xl font-mono text-emerald-400">
            {completedCount}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-xs uppercase">Ort. Güven</p>
            <Icon name="insights" className="text-blue-400" />
          </div>
          <p className="text-2xl font-mono text-blue-400">
            {valuations.filter((v) => v.confidenceScore).length > 0
              ? Math.round(
                  valuations
                    .filter((v) => v.confidenceScore)
                    .reduce((acc, v) => acc + (v.confidenceScore || 0), 0) /
                    valuations.filter((v) => v.confidenceScore).length
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "konut", "sanayi", "tarim", "ticari", "arsa"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
            }`}
          >
            {type === "all" ? "Tümü" : valuationPropertyTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* Valuations List */}
      {valuations.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="calculate" className="text-4xl text-slate-600 mb-3" />
          <p className="text-slate-400">Değerleme talebi bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          {valuations.map((valuation) => (
            <div
              key={valuation.id}
              className={`bg-slate-800 border rounded-lg overflow-hidden transition-all ${
                selectedValuation === valuation.id
                  ? "border-emerald-500"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              {/* Main Row */}
              <div
                className="p-5 cursor-pointer"
                onClick={() =>
                  setSelectedValuation(
                    selectedValuation === valuation.id ? null : valuation.id
                  )
                }
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${
                        typeColors[valuation.propertyType]
                      } flex items-center justify-center`}
                    >
                      <Icon
                        name={typeIcons[valuation.propertyType]}
                        className="text-white text-xl"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">
                          {valuation.name || "İsimsiz"}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            typeColors[valuation.propertyType]
                          } text-white`}
                        >
                          {valuationPropertyTypeLabels[valuation.propertyType]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {valuation.address}, {valuation.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-slate-500 text-xs uppercase">Alan</p>
                      <p className="text-white font-mono">
                        {valuation.area.toLocaleString("tr-TR")}m²
                      </p>
                    </div>

                    {valuation.estimatedValue && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase">
                          Tahmini Değer
                        </p>
                        <p className="text-emerald-400 font-mono font-bold">
                          ₺
                          {(
                            parseFloat(valuation.estimatedValue) / 1000000
                          ).toFixed(2)}
                          M
                        </p>
                      </div>
                    )}

                    {valuation.confidenceScore && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase">
                          AI Güven
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${valuation.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 text-sm font-mono">
                            {valuation.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    <span
                      className={`text-xs px-3 py-1.5 rounded border ${
                        valuation.estimatedValue
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {valuation.estimatedValue ? "Tamamlandı" : "Bekliyor"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedValuation === valuation.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-700 mt-0">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        İletişim
                      </h4>
                      <div className="space-y-2">
                        {valuation.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="phone" className="text-slate-500" />
                            <span className="text-white">
                              {valuation.phone}
                            </span>
                          </div>
                        )}
                        {valuation.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="email" className="text-slate-500" />
                            <span className="text-white">
                              {valuation.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Features */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        Özellikler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {valuation.details &&
                          Object.entries(valuation.details).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
                              >
                                {key}:{" "}
                                {typeof value === "boolean"
                                  ? value
                                    ? "Var"
                                    : "Yok"
                                  : String(value)}
                              </span>
                            )
                          )}
                        {(!valuation.details ||
                          Object.keys(valuation.details).length === 0) && (
                          <span className="text-slate-500 text-sm">
                            Özellik belirtilmemiş
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        İşlemler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {valuation.estimatedValue && (
                          <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                            <Icon name="picture_as_pdf" />
                            Rapor İndir
                          </button>
                        )}
                        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                          <Icon name="email" />
                          Müşteriye Gönder
                        </button>
                        <button
                          onClick={() => handleDelete(valuation.id)}
                          className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          <Icon name="delete" />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis */}
                  {valuation.marketAnalysis && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">
                        AI Pazar Analizi
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {valuation.marketAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
