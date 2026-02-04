"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { coreModules, contentModules, tools } from "@/constants/admin-navigation";
import { useAdminCounts } from "@/hooks/use-admin-counts";

export function AdminSidebar() {
  const pathname = usePathname();
  const { counts } = useAdminCounts();

  function getBadgeCount(badgeKey: string | null): number {
    if (!badgeKey) return 0;
    return counts[badgeKey as keyof typeof counts] || 0;
  }

  return (
    <aside className="w-64 flex-none bg-slate-800 border-r border-slate-700 flex flex-col justify-between overflow-y-auto hidden md:flex">
      <div className="p-4 space-y-6">
        {/* Ana Modüller */}
        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
            Ana Modüller
          </h3>
          <nav className="space-y-1" role="navigation" aria-label="Ana modüller navigasyonu">
            {coreModules.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const badgeCount = getBadgeCount(item.badgeKey);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={item.icon} className="text-[20px]" />
                    {item.label}
                  </div>
                  {badgeCount > 0 && (
                    <span className="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content Management */}
        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
            İçerik
          </h3>
          <nav className="space-y-1" role="navigation" aria-label="İçerik yönetimi navigasyonu">
            {contentModules.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white",
                  )}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Araçlar */}
        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
            Araçlar
          </h3>
          <nav className="space-y-1" role="navigation" aria-label="Araçlar navigasyonu">
            {tools.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white",
                  )}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sistem Durumu */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="bolt" className="text-emerald-400 text-sm" />
            <span className="text-xs font-bold text-emerald-400 uppercase">
              Sistem Durumu
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>Veritabanı</span>
              <span className="text-emerald-400">Çevrimiçi</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>AI Motoru</span>
              <span className="text-emerald-400">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
