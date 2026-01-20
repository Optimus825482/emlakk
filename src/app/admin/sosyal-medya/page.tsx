"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/**
 * Sosyal Medya Yönetim Merkezi
 * - İlan bazlı içerik üretimi
 * - Genel içerik üretimi (Firma tanıtımı, duyurular, kampanyalar)
 * - Planlama ve takvim
 * - Performans analizi
 */

interface ContentStats {
  totalGenerated: number;
  pendingApproval: number;
  published: number;
  scheduled: number;
}

interface Activity {
  id: string;
  action: string;
  target: string;
  time: string;
  icon: string;
  platform: string;
  status: string;
}

interface PlatformStat {
  platform: string;
  count: number;
  publishedCount: number;
}

export default function SosyalMedyaPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ContentStats>({
    totalGenerated: 0,
    pendingApproval: 0,
    published: 0,
    scheduled: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setShowCreateMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/social-media/stats");
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setActivities(data.activities || []);
        setPlatformStats(data.platformStats || []);
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modüller - stats'tan dinamik değerler
  const modules = [
    {
      id: "ilan",
      title: "İlan İçerikleri",
      description:
        "Mevcut ilanlar için sosyal medya paylaşım içeriği oluşturun",
      icon: "home_work",
      color: "from-purple-500 to-pink-500",
      href: "/admin/sosyal-medya/ilan",
      stats: { label: "Bekleyen", value: stats.pendingApproval },
    },
    {
      id: "genel",
      title: "Genel İçerikler",
      description: "Marka tanıtımı, sektör haberleri ve kampanya içerikleri",
      icon: "campaign",
      color: "from-blue-500 to-cyan-500",
      href: "/admin/sosyal-medya/genel",
      stats: { label: "Taslak", value: stats.pendingApproval },
    },
    {
      id: "takvim",
      title: "Paylaşım Takvimi",
      description: "İçerik planlaması ve otomatik paylaşım zamanlaması",
      icon: "calendar_month",
      color: "from-green-500 to-emerald-500",
      href: "/admin/sosyal-medya/takvim",
      stats: { label: "Planlanmış", value: stats.scheduled },
    },
    {
      id: "analiz",
      title: "Performans Analizi",
      description: "Sosyal medya etkileşim ve erişim metrikleri",
      icon: "analytics",
      color: "from-orange-500 to-amber-500",
      href: "/admin/sosyal-medya/analiz",
      stats: { label: "Yayınlanan", value: stats.published },
    },
  ];

  // Platform bilgileri - veritabanından gelen istatistiklerle birleştir
  const getPlatformInfo = (platformId: string) => {
    const stat = platformStats.find((p) => p.platform === platformId);
    return {
      count: stat?.count || 0,
      publishedCount: stat?.publishedCount || 0,
    };
  };

  const platforms = [
    {
      name: "Instagram",
      id: "instagram",
      icon: "photo_camera",
      connected: getPlatformInfo("instagram").count > 0,
      stats: `${getPlatformInfo("instagram").publishedCount} paylaşım`,
    },
    {
      name: "Facebook",
      id: "facebook",
      icon: "facebook",
      connected: getPlatformInfo("facebook").count > 0,
      stats: `${getPlatformInfo("facebook").publishedCount} paylaşım`,
    },
    {
      name: "Twitter/X",
      id: "twitter",
      icon: "tag",
      connected: getPlatformInfo("twitter").count > 0,
      stats: `${getPlatformInfo("twitter").publishedCount} paylaşım`,
    },
    {
      name: "LinkedIn",
      id: "linkedin",
      icon: "work",
      connected: getPlatformInfo("linkedin").count > 0,
      stats: `${getPlatformInfo("linkedin").publishedCount} paylaşım`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icon name="share" className="text-purple-400" />
            Sosyal Medya Yönetimi
          </h1>
          <p className="text-slate-400 mt-1">
            AI destekli içerik üretimi ve sosyal medya yönetimi
          </p>
        </div>

        {/* Yeni İçerik Dropdown */}
        <div className="relative" ref={createMenuRef}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Icon name="add" />
            Yeni İçerik Oluştur
            <Icon
              name={showCreateMenu ? "expand_less" : "expand_more"}
              className="text-sm"
            />
          </button>

          {showCreateMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-2">
                <button
                  onClick={() => {
                    router.push("/admin/sosyal-medya/ilan");
                    setShowCreateMenu(false);
                  }}
                  className="w-full p-3 text-left hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="home_work" className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium group-hover:text-purple-400 transition-colors">
                        İlan İçeriği
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Mevcut ilanlar için sosyal medya paylaşımı
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/admin/sosyal-medya/genel");
                    setShowCreateMenu(false);
                  }}
                  className="w-full p-3 text-left hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="campaign" className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        Genel İçerik
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Firma tanıtımı, duyurular, kampanyalar
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="border-t border-slate-700 p-2">
                <p className="px-3 py-2 text-xs text-slate-500">
                  <Icon name="info" className="inline mr-1" />
                  AI ile otomatik içerik üretimi
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 animate-pulse"
            >
              <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-24"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-3xl font-bold text-white">
                {stats.totalGenerated}
              </div>
              <div className="text-slate-400 text-sm">Toplam İçerik</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-3xl font-bold text-yellow-400">
                {stats.pendingApproval}
              </div>
              <div className="text-slate-400 text-sm">Onay Bekleyen</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-3xl font-bold text-green-400">
                {stats.published}
              </div>
              <div className="text-slate-400 text-sm">Yayınlanan</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-3xl font-bold text-blue-400">
                {stats.scheduled}
              </div>
              <div className="text-slate-400 text-sm">Planlanmış</div>
            </div>
          </>
        )}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="group bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center`}
              >
                <Icon name={module.icon} className="text-white text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {module.stats.value}
                </div>
                <div className="text-xs text-slate-500">
                  {module.stats.label}
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mt-4 group-hover:text-purple-400 transition-colors">
              {module.title}
            </h3>
            <p className="text-slate-400 text-sm mt-1">{module.description}</p>
            <div className="mt-4 flex items-center text-purple-400 text-sm">
              <span>Modüle Git</span>
              <Icon
                name="arrow_forward"
                className="ml-1 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Connected Platforms */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="link" className="text-blue-400" />
          Platform İstatistikleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className={`p-4 rounded-lg border ${
                platform.connected
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-slate-700/30 border-slate-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  name={platform.icon}
                  className={
                    platform.connected ? "text-green-400" : "text-slate-500"
                  }
                />
                <div>
                  <div className="text-white font-medium">{platform.name}</div>
                  <div className="text-xs text-slate-400">
                    {platform.connected ? platform.stats : "Henüz içerik yok"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="history" className="text-cyan-400" />
          Son Aktiviteler
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg animate-pulse"
              >
                <div className="w-6 h-6 bg-slate-600 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-600 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Icon name="inbox" className="text-4xl mb-2" />
            <p>Henüz aktivite bulunmuyor</p>
            <p className="text-sm">İçerik oluşturduğunuzda burada görünecek</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
              >
                <Icon name={activity.icon} className="text-purple-400" />
                <div className="flex-1">
                  <span className="text-white">{activity.action}</span>
                  <span className="text-slate-400"> - {activity.target}</span>
                </div>
                <span className="text-xs text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
