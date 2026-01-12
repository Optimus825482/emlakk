"use client";

import { Icon } from "@/components/ui/icon";
import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="flex-none h-16 border-b border-slate-700 bg-slate-800 px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-4">
        <div className="size-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Icon name="terminal" className="text-xl" />
        </div>
        <div>
          <h1 className="text-white text-base font-bold tracking-wider leading-none">
            DEMİR-NET{" "}
            <span className="text-emerald-400 font-mono text-xs ml-1">
              KOMUTA MERKEZİ
            </span>
          </h1>
          <p className="text-slate-400 text-[10px] tracking-widest uppercase mt-0.5">
            Güvenli Bağlantı Kuruldu • v1.0
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8 hidden lg:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="text-slate-400" />
          </div>
          <input
            className="block w-full rounded bg-slate-900 border border-slate-700 text-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm pl-10 py-2 placeholder-slate-500 font-mono transition-colors"
            placeholder="Ara..."
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <kbd className="inline-flex items-center border border-slate-600 rounded px-2 text-xs font-mono text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* System Stats */}
        <div className="hidden md:flex items-center gap-3 mr-4 border-r border-slate-600 pr-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Sistem
            </span>
            <span className="text-xs font-mono text-emerald-400">Aktif</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              API
            </span>
            <span className="text-xs font-mono text-emerald-400">24ms</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse" />
          <Icon name="notifications" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">
              {user.name || "Admin"}
            </p>
            <p className="text-[10px] text-emerald-400">Tam Yetki</p>
          </div>
          <div className="size-9 rounded bg-slate-600 border border-slate-500 flex items-center justify-center">
            <Icon name="person" className="text-slate-300" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/giris" })}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Çıkış Yap"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </header>
  );
}
