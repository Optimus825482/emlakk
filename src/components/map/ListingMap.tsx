"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center rounded-[2rem]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-outfit font-bold text-slate-500 uppercase tracking-widest text-xs">Harita Yükleniyor</p>
      </div>
    </div>
  ),
});

export default function ListingMap() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/api/listings?limit=100&status=active");
        const result = await response.json();
        if (result.data) {
          setListings(result.data.filter((l: any) => l.latitude && l.longitude));
        }
      } catch (error) {
        console.error("Listings fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  const filteredListings = filter === "all" 
    ? listings 
    : listings.filter((l: any) => l.type === filter);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {["all", "konut", "arsa", "tarim", "sanayi"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-premium ${
                filter === f 
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" 
                  : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              {f === "all" ? "Tümü" : f}
            </button>
          ))}
        </div>
        
        <div className="px-6 py-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl">
          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
            {filteredListings.length} İlan Gösteriliyor
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        {filteredListings.length > 0 ? (
          <MapComponent listings={filteredListings} />
        ) : !loading ? (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Henüz Konumlu İlan Yok</h3>
            <p className="text-slate-500 max-w-sm">
              Bu filtreye uygun, harita üzerinde işaretlenmiş ilan bulunamadı. Lütfen diğer kategorilere göz atın.
            </p>
          </div>
        ) : null}
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]"
            >
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
