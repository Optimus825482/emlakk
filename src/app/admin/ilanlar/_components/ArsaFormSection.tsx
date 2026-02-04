import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function ArsaFormSection({ register, errors }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="landscape" className="text-amber-400" /> Arsa Özellikleri
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField label="Arazi Topoğrafyası" {...register("landTopography")} error={errors.landTopography?.message} options={["Düz", "Hafif Eğimli", "Eğimli", "Teraslı", "Dalgalı"]} />
        <SelectField label="Arsa Şekli" {...register("landShape")} error={errors.landShape?.message} options={["Dikdörtgen", "Kare", "L Şeklinde", "Üçgen", "Düzensiz"]} />
        <SelectField label="Manzara" {...register("viewType")} error={errors.viewType?.message} options={["Deniz", "Göl", "Dağ", "Şehir", "Orman", "Doğa", "Yok"]} />
        <InputField label="Cephe (m)" type="number" step="0.1" {...register("frontage")} error={errors.frontage?.message} placeholder="25" />
        <InputField label="Derinlik (m)" type="number" step="0.1" {...register("depth")} error={errors.depth?.message} placeholder="40" />
        <SelectField label="Yol Erişimi" {...register("roadAccess")} error={errors.roadAccess?.message} options={["Ana Yol", "Ara Yol", "Tali Yol", "Toprak Yol", "Yok"]} />
        <SelectField label="Yol Tipi" {...register("roadType")} error={errors.roadType?.message} options={["Asfalt", "Parke", "Stabilize", "Toprak", "Beton"]} />
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Mesafeler</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InputField label="Merkeze (km)" type="number" step="0.1" {...register("distanceToCenter")} error={errors.distanceToCenter?.message} placeholder="5" />
          <InputField label="Otoyola (km)" type="number" step="0.1" {...register("distanceToHighway")} error={errors.distanceToHighway?.message} placeholder="2" />
          <InputField label="Okula (km)" type="number" step="0.1" {...register("distanceToSchool")} error={errors.distanceToSchool?.message} placeholder="1" />
          <InputField label="Hastaneye (km)" type="number" step="0.1" {...register("distanceToHospital")} error={errors.distanceToHospital?.message} placeholder="3" />
        </div>
      </div>
      <div className="mt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Altyapı Yakınlığı</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Köşe Parsel" {...register("cornerPlot")} icon="crop_square" />
          <CheckboxField label="İfraz Edilebilir" {...register("splitAllowed")} icon="dashboard_customize" />
          <CheckboxField label="Yapı Ruhsatı" {...register("buildingPermit")} icon="description" />
          <CheckboxField label="Proje Hazır" {...register("projectReady")} icon="architecture" />
          <CheckboxField label="Elektrik Yakın" {...register("electricityNearby")} icon="bolt" />
          <CheckboxField label="Su Yakın" {...register("waterNearby")} icon="water_drop" />
          <CheckboxField label="Gaz Yakın" {...register("gasNearby")} icon="local_fire_department" />
          <CheckboxField label="Kanalizasyon Yakın" {...register("sewerNearby")} icon="plumbing" />
        </div>
      </div>
    </div>
  );
}
