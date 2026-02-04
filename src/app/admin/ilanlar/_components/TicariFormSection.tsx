import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function TicariFormSection({ register, errors }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="store" className="text-emerald-400" /> Ticari Detaylar
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <InputField label="Cephe Genişliği (m)" type="number" step="0.1" {...register("shopWidth")} error={errors.shopWidth?.message} placeholder="8" />
        <InputField label="Derinlik (m)" type="number" step="0.1" {...register("shopDepth")} error={errors.shopDepth?.message} placeholder="15" />
        <InputField label="Vitrin Sayısı" type="number" {...register("showcaseCount")} error={errors.showcaseCount?.message} placeholder="2" />
        <InputField label="Bulunduğu Kat" type="number" {...register("floorNumber")} error={errors.floorNumber?.message} placeholder="0" />
        <InputField label="Bina Kat Sayısı" type="number" {...register("totalFloors")} error={errors.totalFloors?.message} placeholder="5" />
        <SelectField label="Uygun Sektör" {...register("suitableFor")} error={errors.suitableFor?.message} options={["Mağaza", "Ofis", "Restoran/Cafe", "Market", "Showroom", "Depo", "Atölye"]} />
        <InputField label="Mevcut Kiracı" {...register("currentTenant")} error={errors.currentTenant?.message} placeholder="Boş veya kiracı adı" />
        <InputField label="Aylık Kira (₺)" {...register("monthlyRent")} error={errors.monthlyRent?.message} placeholder="25000" />
        <InputField label="Depozito (₺)" {...register("depositAmount")} error={errors.depositAmount?.message} placeholder="75000" />
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Konum Özellikleri</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Köşe Dükkan" {...register("cornerShop")} icon="storefront" />
          <CheckboxField label="Ana Cadde" {...register("mainStreet")} icon="add_road" />
          <CheckboxField label="AVM İçi" {...register("mallLocation")} icon="local_mall" />
          <CheckboxField label="Otopark" {...register("parking")} icon="local_parking" />
          <CheckboxField label="Asansör" {...register("elevator")} icon="elevator" />
          <CheckboxField label="Güvenlik" {...register("security")} icon="security" />
        </div>
      </div>
    </div>
  );
}
