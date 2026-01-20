"use client";

import { Icon } from "@/components/ui/icon";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
        <Icon
          name="dashboard"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 text-xl"
        />
      </div>
      <div className="text-center">
        <p className="text-slate-400 text-sm font-medium">Yükleniyor...</p>
        <p className="text-slate-600 text-xs mt-1">Lütfen bekleyin</p>
      </div>
    </div>
  );
}
