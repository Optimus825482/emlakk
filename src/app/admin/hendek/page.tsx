"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface HendekStat {
  id: string;
  key: string;
  label: string;
  value: string;
  numericValue?: number;
  unit?: string;
  description?: string;
  icon?: string;
  color?: string;
  source?: string;
  year?: number;
  isActive: boolean;
  sortOrder?: number;
}

interface PopulationData {
  id: string;
  year: number;
  totalPopulation: number;
  malePopulation?: number;
  femalePopulation?: number;
  growthRate?: string;
}

const iconOptions = [
  "groups",
  "factory",
  "domain",
  "school",
  "trending_up",
  "analytics",
  "location_city",
  "agriculture",
  "home",
  "business",
  "engineering",
];

const colorOptions = [
  { value: "terracotta", label: "Terracotta", class: "bg-[var(--terracotta)]" },
  { value: "blue", label: "Mavi", class: "bg-blue-500" },
  { value: "forest", label: "Yeşil", class: "bg-[var(--forest)]" },
  { value: "purple", label: "Mor", class: "bg-purple-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
];

export default function HendekYonetimiPage() {
  const [stats, setStats] = useState<HendekStat[]>([]);
  const [population, setPopulation] = useState<PopulationData[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "population">("stats");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<HendekStat | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    key: "",
    label: "",
    value: "",
    numericValue: "",
    unit: "",
    description: "",
    icon: "analytics",
    color: "terracotta",
    source: "",
    year: new Date().getFullYear().toString(),
    isActive: true,
    sortOrder: "0",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      // İstatistikleri çek
      const statsRes = await fetch("/api/hendek-stats");
      if (statsRes.ok) {
        const { data } = await statsRes.json();
        setStats(data || []);
      }

      // Nüfus verilerini çek
      const popRes = await fetch("/api/hendek-stats?type=population");
      if (popRes.ok) {
        const { data } = await popRes.json();
        setPopulation(data || []);
      }
    } catch (error) {
      console.error("Veri yüklenemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function openModal(stat?: HendekStat) {
    if (stat) {
      setSelectedStat(stat);
      setFormData({
        key: stat.key,
        label: stat.label,
        value: stat.value,
        numericValue: stat.numericValue?.toString() || "",
        unit: stat.unit || "",
        description: stat.description || "",
        icon: stat.icon || "analytics",
        color: stat.color || "terracotta",
        source: stat.source || "",
        year: stat.year?.toString() || "",
        isActive: stat.isActive,
        sortOrder: stat.sortOrder?.toString() || "0",
      });
    } else {
      setSelectedStat(null);
      setFormData({
        key: "",
        label: "",
        value: "",
        numericValue: "",
        unit: "",
        description: "",
        icon: "analytics",
        color: "terracotta",
        source: "",
        year: new Date().getFullYear().toString(),
        isActive: true,
        sortOrder: "0",
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        numericValue: formData.numericValue
          ? parseInt(formData.numericValue)
          : undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        sortOrder: parseInt(formData.sortOrder),
      };

      const url = selectedStat
        ? `/api/hendek-stats/${selectedStat.id}`
        : "/api/hendek-stats";
      const method = selectedStat ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Hendek Verileri
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Hendek istatistikleri ve nüfus verilerini yönetin
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors"
        >
          <Icon name="add" />
          Yeni İstatistik
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "stats"
              ? "bg-emerald-500/20 text-emerald-400"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
        >
          <Icon name="analytics" className="mr-2" />
          İstatistikler ({stats.length})
        </button>
        <button
          onClick={() => setActiveTab("population")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "population"
              ? "bg-emerald-500/20 text-emerald-400"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
        >
          <Icon name="groups" className="mr-2" />
          Nüfus Geçmişi ({population.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon
            name="sync"
            className="text-emerald-400 text-3xl animate-spin"
          />
        </div>
      ) : activeTab === "stats" ? (
        <div className="grid gap-4">
          {stats.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <Icon name="analytics" className="text-slate-600 text-5xl mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Henüz istatistik yok
              </h3>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors"
              >
                <Icon name="add" />
                İlk İstatistiği Ekle
              </button>
            </div>
          ) : (
            stats.map((stat) => (
              <div
                key={stat.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === "blue"
                          ? "bg-blue-500/20 text-blue-400"
                          : stat.color === "forest"
                            ? "bg-green-500/20 text-green-400"
                            : stat.color === "purple"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-[var(--terracotta)]/20 text-[var(--terracotta)]"
                        }`}
                    >
                      <Icon
                        name={stat.icon || "analytics"}
                        className="text-2xl"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white">
                          {stat.value}
                        </span>
                        {stat.unit && (
                          <span className="text-sm text-slate-400">
                            {stat.unit}
                          </span>
                        )}
                        {!stat.isActive && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                            Pasif
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium">{stat.label}</p>
                      {stat.description && (
                        <p className="text-slate-400 text-sm">
                          {stat.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 mr-4">
                      {stat.source && `Kaynak: ${stat.source}`}
                      {stat.year && ` (${stat.year})`}
                    </span>
                    <button
                      onClick={() => openModal(stat)}
                      aria-label="İstatistiği düzenle"
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">
                  Yıl
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">
                  Toplam Nüfus
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">
                  Erkek
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">
                  Kadın
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">
                  Artış
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {population.map((pop) => (
                <tr key={pop.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white font-bold">{pop.year}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">
                    {pop.totalPopulation.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">
                    {pop.malePopulation?.toLocaleString("tr-TR") || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">
                    {pop.femalePopulation?.toLocaleString("tr-TR") || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pop.growthRate && (
                      <span
                        className={`font-mono font-bold ${parseFloat(pop.growthRate) > 0
                            ? "text-green-400"
                            : parseFloat(pop.growthRate) < 0
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                      >
                        {parseFloat(pop.growthRate) > 0 ? "+" : ""}
                        {pop.growthRate}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {selectedStat ? "İstatistik Düzenle" : "Yeni İstatistik"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Kapat"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Anahtar (Key) *
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    required
                    disabled={!!selectedStat}
                    placeholder="population"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Etiket *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    required
                    placeholder="Nüfus (2024)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Değer *
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    required
                    placeholder="92.729"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sayısal Değer
                  </label>
                  <input
                    type="number"
                    value={formData.numericValue}
                    onChange={(e) =>
                      setFormData({ ...formData, numericValue: e.target.value })
                    }
                    placeholder="92729"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Birim
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="kişi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Yıllık %1.4 büyüme"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="statIcon" className="block text-sm font-medium text-slate-300 mb-2">
                    İkon
                  </label>
                  <select
                    id="statIcon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="statColor" className="block text-sm font-medium text-slate-300 mb-2">
                    Renk
                  </label>
                  <select
                    id="statColor"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kaynak
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    placeholder="TÜİK"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Yıl
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    placeholder="2024"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Aktif</span>
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="statSortOrder" className="text-sm text-slate-300">Sıra:</label>
                  <input
                    id="statSortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: e.target.value })
                    }
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Icon name="sync" className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Icon name="save" />
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
