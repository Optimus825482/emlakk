import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function TicariFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="store" className="text-emerald-400" /> Ticari Detaylar
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Cephe Genişliği (m)" name="shopWidth" value={formData.shopWidth} onChange={handleChange} type="number" placeholder="8" />
        <InputField label="Derinlik (m)" name="shopDepth" value={formData.shopDepth} onChange={handleChange} type="number" placeholder="15" />
        <InputField label="Vitrin Sayısı" name="showcaseCount" value={formData.showcaseCount} onChange={handleChange} type="number" placeholder="2" />
        <InputField label="Bulunduğu Kat" name="floorNumber" value={formData.floorNumber} onChange={handleChange} type="number" placeholder="0" />
        <InputField label="Bina Kat Sayısı" name="totalFloors" value={formData.totalFloors} onChange={handleChange} type="number" placeholder="5" />
        <SelectField label="Uygun Sektör" name="suitableFor" value={formData.suitableFor} onChange={handleChange} options={["Mağaza", "Ofis", "Restoran/Cafe", "Market", "Showroom", "Depo", "Atölye"]} />
        <InputField label="Mevcut Kiracı" name="currentTenant" value={formData.currentTenant} onChange={handleChange} placeholder="Boş veya kiracı adı" />
        <InputField label="Aylık Kira (₺)" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} placeholder="25000" />
        <InputField label="Depozito (₺)" name="depositAmount" value={formData.depositAmount} onChange={handleChange} placeholder="75000" />
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Konum Özellikleri</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Köşe Dükkan" name="cornerShop" checked={formData.cornerShop} onChange={handleChange} icon="storefront" />
          <CheckboxField label="Ana Cadde" name="mainStreet" checked={formData.mainStreet} onChange={handleChange} icon="add_road" />
          <CheckboxField label="AVM İçi" name="mallLocation" checked={formData.mallLocation} onChange={handleChange} icon="local_mall" />
          <CheckboxField label="Otopark" name="parking" checked={formData.parking} onChange={handleChange} icon="local_parking" />
          <CheckboxField label="Asansör" name="elevator" checked={formData.elevator} onChange={handleChange} icon="elevator" />
          <CheckboxField label="Güvenlik" name="security" checked={formData.security} onChange={handleChange} icon="security" />
        </div>
      </div>
    </div>
  );
}
