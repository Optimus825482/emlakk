"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Map as MapIcon, Layers, Eye, EyeOff, X } from "lucide-react";
import type { MapSettings, MapType } from "./property-map";

interface MapControlsProps {
  settings: MapSettings;
  onSettingsChange: (settings: Partial<MapSettings>) => void;
}

const MAP_TYPES: {
  value: MapType;
  label: string;
  icon: string;
  category: string;
}[] = [
  // Standart
  { value: "roadmap", label: "Standart", icon: "🗺️", category: "Standart" },
  { value: "wikimedia", label: "Wikimedia", icon: "📖", category: "Standart" },
  {
    value: "humanitarian",
    label: "Humanitarian",
    icon: "🏥",
    category: "Standart",
  },

  // Uydu
  { value: "satellite", label: "Uydu", icon: "🛰️", category: "Uydu" },
  { value: "hybrid", label: "Hibrit", icon: "🌍", category: "Uydu" },

  // Arazi
  { value: "terrain", label: "Arazi", icon: "⛰️", category: "Arazi" },
  { value: "topo", label: "Topografik", icon: "🗻", category: "Arazi" },

  // Karanlık
  { value: "dark", label: "Karanlık", icon: "🌙", category: "Tema" },
  { value: "darkMatter", label: "Dark Matter", icon: "🌑", category: "Tema" },

  // Aydınlık
  { value: "light", label: "Aydınlık", icon: "☀️", category: "Tema" },
  { value: "positron", label: "Positron", icon: "✨", category: "Tema" },

  // Artistik
  { value: "watercolor", label: "Suluboya", icon: "🎨", category: "Artistik" },
  { value: "toner", label: "Toner", icon: "🖤", category: "Artistik" },

  // Ulaşım
  { value: "transport", label: "Ulaşım", icon: "🚌", category: "Ulaşım" },
  { value: "cycle", label: "Bisiklet", icon: "🚴", category: "Ulaşım" },
];

export default function MapControls({
  settings,
  onSettingsChange,
}: MapControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Settings Button */}
      <motion.button
        data-map-settings
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl border transition-all duration-300 relative ${
          isOpen
            ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30"
            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary-500"
        }`}
        title="Harita Ayarları"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            15
          </span>
        )}
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                <h3 className="font-outfit font-bold text-sm text-slate-900 dark:text-white">
                  Harita Ayarları
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Map Type Selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  <MapIcon className="w-4 h-4" />
                  Harita Türü ({MAP_TYPES.length} Seçenek)
                </label>

                {/* Kategorilere göre grupla */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    "Standart",
                    "Uydu",
                    "Arazi",
                    "Tema",
                    "Artistik",
                    "Ulaşım",
                  ].map((category) => {
                    const categoryTypes = MAP_TYPES.filter(
                      (t) => t.category === category,
                    );
                    if (categoryTypes.length === 0) return null;

                    return (
                      <div key={category}>
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">
                          {category}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryTypes.map((type) => (
                            <button
                              key={type.value}
                              onClick={() =>
                                onSettingsChange({ mapType: type.value })
                              }
                              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                                settings.mapType === type.value
                                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105"
                                  : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-105"
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {type.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  <Layers className="w-4 h-4" />
                  Görünüm Seçenekleri
                </label>

                {/* Cluster Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <span className="text-sm">📍</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Marker Clustering
                      </div>
                      <div className="text-xs text-slate-500">
                        Yakın ilanları grupla
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onSettingsChange({ showClusters: !settings.showClusters })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      settings.showClusters
                        ? "bg-primary-600"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.showClusters ? 24 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>

                {/* Labels Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {settings.showLabels ? (
                        <Eye className="w-4 h-4 text-primary-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Etiketler
                      </div>
                      <div className="text-xs text-slate-500">
                        Konum isimlerini göster
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onSettingsChange({ showLabels: !settings.showLabels })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      settings.showLabels
                        ? "bg-primary-600"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.showLabels ? 24 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20">
                <p className="text-xs text-primary-700 dark:text-primary-400">
                  💡 <strong>İpucu:</strong> Harita üzerinde yakınlaştırma için
                  scroll kullanabilir, sürükleyerek hareket edebilirsiniz.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
