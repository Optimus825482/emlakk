import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function SanayiFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="factory" className="text-emerald-400" /> Sanayi Detayları
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Kapalı Alan (m²)" name="closedArea" value={formData.closedArea} onChange={handleChange} type="number" placeholder="3000" />
        <InputField label="Açık Alan (m²)" name="openArea" value={formData.openArea} onChange={handleChange} type="number" placeholder="2000" />
        <InputField label="Ofis Alanı (m²)" name="officeArea" value={formData.officeArea} onChange={handleChange} type="number" placeholder="200" />
        <InputField label="Tavan Yüksekliği (m)" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} type="number" placeholder="8" />
        <InputField label="Elektrik Gücü (kVA)" name="electricityPower" value={formData.electricityPower} onChange={handleChange} placeholder="400" />
        <InputField label="Vinç Kapasitesi (ton)" name="craneCapacity" value={formData.craneCapacity} onChange={handleChange} placeholder="10" />
        <SelectField label="Yol Tipi" name="roadType" value={formData.roadType} onChange={handleChange} options={["Asfalt", "Parke Taşı", "Stabilize", "Toprak Yol"]} />
        <InputField label="Yol Cephesi (m)" name="roadAccess" value={formData.roadAccess} onChange={handleChange} placeholder="50" />
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Altyapı</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Elektrik" name="electricity" checked={formData.electricity} onChange={handleChange} icon="bolt" />
          <CheckboxField label="3 Faz" name="threePhase" checked={formData.threePhase} onChange={handleChange} icon="electrical_services" />
          <CheckboxField label="Su" name="water" checked={formData.water} onChange={handleChange} icon="water_drop" />
          <CheckboxField label="Doğalgaz" name="naturalGas" checked={formData.naturalGas} onChange={handleChange} icon="local_fire_department" />
          <CheckboxField label="Kanalizasyon" name="sewage" checked={formData.sewage} onChange={handleChange} icon="plumbing" />
          <CheckboxField label="Altyapı Hazır" name="infrastructure" checked={formData.infrastructure} onChange={handleChange} icon="construction" />
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tesis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Yükleme Rampası" name="loadingRamp" checked={formData.loadingRamp} onChange={handleChange} icon="local_shipping" />
          <CheckboxField label="Vinç Sistemi" name="craneSystem" checked={formData.craneSystem} onChange={handleChange} icon="precision_manufacturing" />
          <CheckboxField label="Güvenlik Kulübesi" name="securityRoom" checked={formData.securityRoom} onChange={handleChange} icon="shield" />
          <CheckboxField label="Yangın Sistemi" name="fireSystem" checked={formData.fireSystem} onChange={handleChange} icon="fire_extinguisher" />
        </div>
      </div>
    </div>
  );
}
