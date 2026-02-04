import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { SOIL_TYPES, CROP_TYPES } from "../_constants";
import { FormSectionProps } from "../_types";

export function TarimFormSection({ register, errors }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="agriculture" className="text-emerald-400" /> Tarım Detayları
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <SelectField label="Arazi Tipi" {...register("cropType")} error={errors.cropType?.message} options={CROP_TYPES} />
        <SelectField label="Toprak Yapısı" {...register("soilType")} error={errors.soilType?.message} options={SOIL_TYPES} />
        <InputField label="Ağaç Sayısı" type="number" {...register("treeCount")} error={errors.treeCount?.message} placeholder="320" />
        <InputField label="Ağaç Yaşı" type="number" {...register("treeAge")} error={errors.treeAge?.message} placeholder="15" />
        <SelectField label="Sulama Tipi" {...register("irrigationType")} error={errors.irrigationType?.message} options={["Damla Sulama", "Yağmurlama", "Salma Sulama", "Yok"]} />
        <SelectField label="Su Kaynağı" {...register("waterSource")} error={errors.waterSource?.message} options={["Kuyu", "Dere/Çay", "Gölet", "Şebeke Suyu", "Yok"]} />
        <InputField label="Kuyu Derinliği (m)" type="number" {...register("wellDepth")} error={errors.wellDepth?.message} placeholder="50" />
        <InputField label="Depo Alanı (m²)" type="number" {...register("warehouseArea")} error={errors.warehouseArea?.message} placeholder="100" />
        <SelectField label="Arazi Eğimi" {...register("slope")} error={errors.slope?.message} options={["Düz", "Hafif Eğimli", "Orta Eğimli", "Dik"]} />
        <InputField label="Yıllık Verim (kg)" {...register("annualYield")} error={errors.annualYield?.message} placeholder="2500" />
        <InputField label="Organik Sertifika No" {...register("organicCertificate")} error={errors.organicCertificate?.message} placeholder="TR-123456" />
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Arazi Özellikleri</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Sulama Sistemi" {...register("irrigation")} icon="water_drop" />
          <CheckboxField label="Organik Sertifikalı" {...register("organic")} icon="eco" />
          <CheckboxField label="Çevrili/Çitli" {...register("fenced")} icon="fence" />
          <CheckboxField label="Depo/Ambar" {...register("warehouse")} icon="warehouse" />
          <CheckboxField label="Kuyu Mevcut" {...register("well")} icon="water" />
        </div>
      </div>
    </div>
  );
}
