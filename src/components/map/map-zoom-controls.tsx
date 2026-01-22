"use client";

import { useMap } from "react-leaflet";
import { Plus, Minus, Maximize2, Locate } from "lucide-react";
import { motion } from "framer-motion";

export default function MapZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleFullscreen = () => {
    const container = map.getContainer();
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleRecenter = () => {
    // Get all markers and fit bounds
    const bounds = map.getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl overflow-hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomIn}
          className="p-3 hover:bg-primary-500 hover:text-white transition-all duration-300 border-b border-slate-200 dark:border-slate-700"
          title="Yakınlaştır"
        >
          <Plus className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomOut}
          className="p-3 hover:bg-primary-500 hover:text-white transition-all duration-300"
          title="Uzaklaştır"
        >
          <Minus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Additional Controls */}
      <div className="flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRecenter}
          className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl hover:bg-primary-500 hover:text-white transition-all duration-300"
          title="Merkeze Al"
        >
          <Locate className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFullscreen}
          className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl hover:bg-primary-500 hover:text-white transition-all duration-300"
          title="Tam Ekran"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
