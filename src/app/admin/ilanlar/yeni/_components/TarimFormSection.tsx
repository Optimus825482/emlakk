import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { SOIL_TYPES, CROP_TYPES } from "../_constants";
import { FormSectionProps } from "../_types";

export function TarimFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="agriculture" className="text-emerald-400" /> Tarım Detayları
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SelectField label="Arazi Tipi" name="cropType" value={formData.cropType} onChange={handleChange} options={CROP_TYPES} />
        <SelectField label="Toprak Yapısı" name="soilType" value={formData.soilType} onChange={handleChange} options={SOIL_TYPES} />
        <InputField label="Ağaç Sayısı" name="treeCount" value={formData.treeCount} onChange={handleChange} type="number" placeholder="320" />
        <InputField label="Ağaç Yaşı" name="treeAge" value={formData.treeAge} onChange={handleChange} type="number" placeholder="15" />
        <SelectField label="Sulama Tipi" name="irrigationType" value={formData.irrigationType} onChange={handleChange} options={["Damla Sulama", "Yağmurlama", "Salma Sulama", "Yok"]} />
        <SelectField label="Su Kaynağı" name="waterSource" value={formData.waterSource} onChange={handleChange} options={["Kuyu", "Dere/Çay", "Gölet", "Şebeke Suyu", "Yok"]} />
        <InputField label="Kuyu Derinliği (m)" name="wellDepth" value={formData.wellDepth} onChange={handleChange} type="number" placeholder="50" />
        <InputField label="Depo Alanı (m²)" name="warehouseArea" value={formData.warehouseArea} onChange={handleChange} type="number" placeholder="100" />
        <SelectField label="Arazi Eğimi" name="slope" value={formData.slope} onChange={handleChange} options={["Düz", "Hafif Eğimli", "Orta Eğimli", "Dik"]} />
        <InputField label="Yıllık Verim (kg)" name="annualYield" value={formData.annualYield} onChange={handleChange} placeholder="2500" />
        <InputField label="Organik Sertifika No" name="organicCertificate" value={formData.organicCertificate} onChange={handleChange} placeholder="TR-123456" />
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Arazi Özellikleri</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Sulama Sistemi" name="irrigation" checked={formData.irrigation} onChange={handleChange} icon="water_drop" />
          <CheckboxField label="Organik Sertifikalı" name="organic" checked={formData.organic} onChange={handleChange} icon="eco" />
          <CheckboxField label="Çevrili/Çitli" name="fenced" checked={formData.fenced} onChange={handleChange} icon="fence" />
          <CheckboxField label="Depo/Ambar" name="warehouse" checked={formData.warehouse} onChange={handleChange} icon="warehouse" />
          <CheckboxField label="Kuyu Mevcut" name="well" checked={formData.well} onChange={handleChange} icon="water" />
        </div>
      </div>
    </div>
  );
}
