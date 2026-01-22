import { Metadata } from "next";
import PropertyMap from "@/components/admin/property-map";

export const metadata: Metadata = {
  title: "Emlak Haritası | Demir Gayrimenkul",
  description: "İlçe ve kategori bazlı emlak haritası görüntüleme",
};

export default function EmlakHaritasiPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Emlak Haritası</h1>
        <p className="text-muted-foreground">
          İlçe ve kategori seçerek emlak ilanlarını harita üzerinde
          görüntüleyin. Mavi işaretler satılık, kırmızı işaretler kiralık
          ilanları gösterir.
        </p>
      </div>

      <PropertyMap />
    </div>
  );
}
