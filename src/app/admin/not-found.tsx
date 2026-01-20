"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center">
          <Icon name="search_off" className="text-slate-500 text-5xl" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Icon name="warning" className="text-amber-400 text-xl" />
        </div>
      </div>

      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-medium text-slate-300 mb-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-slate-400 text-sm">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. Lütfen
          URL&apos;yi kontrol edin veya ana sayfaya dönün.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold text-sm transition-colors"
        >
          <Icon name="dashboard" />
          Kontrol Paneline Dön
        </Link>
        <Link
          href="/admin/ilanlar"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Icon name="real_estate_agent" />
          İlanları Görüntüle
        </Link>
      </div>

      <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg max-w-md">
        <p className="text-slate-500 text-xs text-center">
          <Icon
            name="info"
            className="text-sm mr-1 inline-block align-middle"
          />
          Bu hatayı görmeye devam ederseniz, lütfen sistem yöneticisi ile
          iletişime geçin.
        </p>
      </div>
    </div>
  );
}
