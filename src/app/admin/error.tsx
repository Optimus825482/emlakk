"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
        <Icon name="error_outline" className="text-red-400 text-4xl" />
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Bir Hata Oluştu</h2>
        <p className="text-slate-400 text-sm mb-1">
          Sayfa yüklenirken beklenmeyen bir hata oluştu.
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs font-mono">
            Hata Kodu: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold text-sm transition-colors"
        >
          <Icon name="refresh" />
          Tekrar Dene
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Icon name="home" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
