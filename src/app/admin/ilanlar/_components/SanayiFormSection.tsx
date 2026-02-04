import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function SanayiFormSection({ register, errors }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="factory" className="text-emerald-400" /> Sanayi Detayları
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <InputField label="Kapalı Alan (m²)" type="number" {...register("closedArea")} error={errors.closedArea?.message} placeholder="3000" />
        <InputField label="Açık Alan (m²)" type="number" {...register("openArea")} error={errors.openArea?.message} placeholder="2000" />
        <InputField label="Ofis Alanı (m²)" type="number" {...register("officeArea")} error={errors.officeArea?.message} placeholder="200" />
        <InputField label="Tavan Yüksekliği (m)" type="number" step="0.1" {...register("ceilingHeight")} error={errors.ceilingHeight?.message} placeholder="8" />
        <InputField label="Elektrik Gücü (kVA)" {...register("electricityPower")} error={errors.electricityPower?.message} placeholder="400" />
        <InputField label="Vinç Kapasitesi (ton)" {...register("craneCapacity")} error={errors.craneCapacity?.message} placeholder="10" />
        <SelectField label="Yol Tipi" {...register("roadType")} error={errors.roadType?.message} options={["Asfalt", "Parke Taşı", "Stabilize", "Toprak Yol"]} />
        <InputField label="Yol Cephesi (m)" {...register("roadAccess")} error={errors.roadAccess?.message} placeholder="50" />
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Altyapı</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Elektrik" {...register("electricity")} icon="bolt" />
          <CheckboxField label="3 Faz" {...register("threePhase")} icon="electrical_services" />
          <CheckboxField label="Su" {...register("water")} icon="water_drop" />
          <CheckboxField label="Doğalgaz" {...register("naturalGas")} icon="local_fire_department" />
          <CheckboxField label="Kanalizasyon" {...register("sewage")} icon="plumbing" />
          <CheckboxField label="Altyapı Hazır" {...register("infrastructure")} icon="construction" />
        </div>
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Tesis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Yükleme Rampası" {...register("loadingRamp")} icon="local_shipping" />
          <CheckboxField label="Vinç Sistemi" {...register("craneSystem")} icon="precision_manufacturing" />
          <CheckboxField label="Güvenlik Kulübesi" {...register("securityRoom")} icon="shield" />
          <CheckboxField label="Yangın Sistemi" {...register("fireSystem")} icon="fire_extinguisher" />
        </div>
      </div>
    </div>
  );
}
