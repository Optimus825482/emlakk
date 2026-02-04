import { Metadata } from "next";
import PropertyMap from "@/components/admin/property-map";

export const metadata: Metadata = {
  title: "EMLAK_HARİTASI_MODÜLÜ | Demir Gayrimenkul",
  description: "İlçe ve kategori bazlı otonom emlak haritası görüntüleme",
};

export default function EmlakHaritasiPage() {
  return (
    <div className="space-y-6">
      <PropertyMap />
    </div>
  );
}
