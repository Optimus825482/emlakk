"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function AdminAnalitikPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Analitik
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Web sitesi performans ve ziyaretçi verileri
          </p>
        </div>
      </div>

      {/* Vercel Analytics Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
            <Icon name="analytics" className="text-emerald-400 text-4xl" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">
            Vercel Analytics Aktif
          </h3>

          <p className="text-slate-400 mb-6 leading-relaxed">
            DEMİR-NET artık Vercel Analytics ile entegre. Ziyaretçi sayıları,
            sayfa görüntülemeleri, coğrafi dağılım ve daha fazlası Vercel
            Dashboard üzerinden takip edilebilir.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <Icon name="visibility" className="text-blue-400 text-2xl mb-2" />
              <p className="text-white font-semibold">Sayfa Görüntüleme</p>
              <p className="text-slate-500 text-sm">Gerçek zamanlı takip</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <Icon name="public" className="text-emerald-400 text-2xl mb-2" />
              <p className="text-white font-semibold">Coğrafi Veriler</p>
              <p className="text-slate-500 text-sm">Ülke ve şehir bazlı</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <Icon name="devices" className="text-purple-400 text-2xl mb-2" />
              <p className="text-white font-semibold">Cihaz Analizi</p>
              <p className="text-slate-500 text-sm">Mobil, tablet, masaüstü</p>
            </div>
          </div>

          <a
            href="https://vercel.com/erkans-projects-e8f0e8e5/demir-gayrimenkul/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Icon name="open_in_new" />
            Vercel Analytics Dashboard
          </a>
        </div>
      </div>

      {/* Quick Stats Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Icon name="info" className="text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">
              Vercel Analytics Nedir?
            </h4>
          </div>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <Icon name="check" className="text-emerald-400 text-sm mt-0.5" />
              <span>Gizlilik odaklı, GDPR uyumlu analitik</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" className="text-emerald-400 text-sm mt-0.5" />
              <span>Cookie kullanmadan ziyaretçi takibi</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" className="text-emerald-400 text-sm mt-0.5" />
              <span>Core Web Vitals performans metrikleri</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" className="text-emerald-400 text-sm mt-0.5" />
              <span>Gerçek zamanlı veri güncelleme</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Icon name="tips_and_updates" className="text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">
              Takip Edilen Metrikler
            </h4>
          </div>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <Icon
                name="trending_up"
                className="text-emerald-400 text-sm mt-0.5"
              />
              <span>Toplam ve benzersiz ziyaretçi sayısı</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="pageview" className="text-blue-400 text-sm mt-0.5" />
              <span>Sayfa görüntüleme ve popüler sayfalar</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon
                name="language"
                className="text-orange-400 text-sm mt-0.5"
              />
              <span>Referans kaynakları (Google, sosyal medya)</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="speed" className="text-yellow-400 text-sm mt-0.5" />
              <span>LCP, FID, CLS performans skorları</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Vercel Analytics aktif olarak veri topluyor
      </div>
    </div>
  );
}
