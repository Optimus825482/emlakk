import PropertyMap from "@/components/map/property-map";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "İlan Haritası | Demir Gayrimenkul",
  description:
    "Tüm emlak ilanlarını harita üzerinde görüntüleyin. İnteraktif harita ile konumları keşfedin.",
};

export default function HaritaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-outfit font-black text-slate-900 dark:text-white mb-3">
            İlan Haritası
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Tüm emlak ilanlarını harita üzerinde görüntüleyin. Farklı harita
            türleri, marker clustering ve gelişmiş filtreleme özellikleri ile
            konumları keşfedin.
          </p>
        </div>

        {/* Map Component */}
        <PropertyMap />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              15 Farklı Harita Türü
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sol üstten hızlı seçim yapın veya ayarlar butonundan tüm harita
              türlerini görün.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Marker Clustering
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Yakın ilanlar otomatik olarak gruplandırılır, harita daha temiz
              görünür.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Gelişmiş Kontroller
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Zoom, tam ekran, merkeze alma ve daha fazla kontrol seçeneği.
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/10 dark:to-primary-800/10 rounded-2xl border border-primary-200 dark:border-primary-900/20">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            ✨ Özellikler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Responsive Tasarım
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Mobil, tablet ve masaüstü cihazlarda mükemmel çalışır
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Kategori Filtreleme
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Konut, arsa, işyeri gibi kategorilere göre filtreleyin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Özel Marker İkonları
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Her kategori için farklı renk ve ikon
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Detaylı Popup'lar
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Fiyat, konum, resim ve detay linki içeren popup'lar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  LocalStorage Ayarları
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Harita tercihleriniz otomatik kaydedilir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Performans Optimizasyonu
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Lazy loading ve clustering ile hızlı yükleme
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
