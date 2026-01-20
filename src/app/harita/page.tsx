import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import ListingMap from "@/components/map/ListingMap";

export const metadata = {
  title: "Emlak Haritası | DEMİR Gayrimenkul",
  description: "Hendek'teki tüm satılık ve kiralık ilanları interaktif harita üzerinde keşfedin.",
};

export default function HaritaPage() {
  return (
    <main className="min-h-screen bg-warm-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 flex flex-col">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
              İnteraktif Görselleştirme
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Canlı Veri</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black font-outfit text-slate-900 mb-6 tracking-tighter leading-none">
            Hendek <span className="text-primary-600">Emlak Haritası</span>
          </h1>
          
          <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
            Sakarya Hendek bölgesindeki portföyümüzü konuma göre keşfedin. 
            Mahalle bazlı fırsatları ve bölge analizlerini harita üzerinden takip edin.
          </p>
        </div>

        <ListingMap />
      </div>

      <Footer />
    </main>
  );
}
