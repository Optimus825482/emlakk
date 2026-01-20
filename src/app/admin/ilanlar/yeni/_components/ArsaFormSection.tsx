import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { FormSectionProps } from "../_types";

export function ArsaFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="landscape" className="text-amber-400" /> Arsa Özellikleri
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField label="Arazi Topoğrafyası" name="landTopography" value={formData.landTopography} onChange={handleChange} options={["Düz", "Hafif Eğimli", "Eğimli", "Teraslı", "Dalgalı"]} />
        <SelectField label="Arsa Şekli" name="landShape" value={formData.landShape} onChange={handleChange} options={["Dikdörtgen", "Kare", "L Şeklinde", "Üçgen", "Düzensiz"]} />
        <SelectField label="Manzara" name="viewType" value={formData.viewType} onChange={handleChange} options={["Deniz", "Göl", "Dağ", "Şehir", "Orman", "Doğa", "Yok"]} />
        <InputField label="Cephe (m)" name="frontage" value={formData.frontage} onChange={handleChange} placeholder="25" />
        <InputField label="Derinlik (m)" name="depth" value={formData.depth} onChange={handleChange} placeholder="40" />
        <SelectField label="Yol Erişimi" name="roadAccess" value={formData.roadAccess} onChange={handleChange} options={["Ana Yol", "Ara Yol", "Tali Yol", "Toprak Yol", "Yok"]} />
        <SelectField label="Yol Tipi" name="roadType" value={formData.roadType} onChange={handleChange} options={["Asfalt", "Parke", "Stabilize", "Toprak", "Beton"]} />
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Mesafeler</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InputField label="Merkeze (km)" name="distanceToCenter" value={formData.distanceToCenter} onChange={handleChange} placeholder="5" />
          <InputField label="Otoyola (km)" name="distanceToHighway" value={formData.distanceToHighway} onChange={handleChange} placeholder="2" />
          <InputField label="Okula (km)" name="distanceToSchool" value={formData.distanceToSchool} onChange={handleChange} placeholder="1" />
          <InputField label="Hastaneye (km)" name="distanceToHospital" value={formData.distanceToHospital} onChange={handleChange} placeholder="3" />
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Altyapı Yakınlığı</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="Köşe Parsel" name="cornerPlot" checked={formData.cornerPlot} onChange={handleChange} icon="crop_square" />
          <CheckboxField label="İfraz Edilebilir" name="splitAllowed" checked={formData.splitAllowed} onChange={handleChange} icon="dashboard_customize" />
          <CheckboxField label="Yapı Ruhsatı" name="buildingPermit" checked={formData.buildingPermit} onChange={handleChange} icon="description" />
          <CheckboxField label="Proje Hazır" name="projectReady" checked={formData.projectReady} onChange={handleChange} icon="architecture" />
          <CheckboxField label="Elektrik Yakın" name="electricityNearby" checked={formData.electricityNearby} onChange={handleChange} icon="bolt" />
          <CheckboxField label="Su Yakın" name="waterNearby" checked={formData.waterNearby} onChange={handleChange} icon="water_drop" />
          <CheckboxField label="Gaz Yakın" name="gasNearby" checked={formData.gasNearby} onChange={handleChange} icon="local_fire_department" />
          <CheckboxField label="Kanalizasyon Yakın" name="sewerNearby" checked={formData.sewerNearby} onChange={handleChange} icon="plumbing" />
        </div>
      </div>
    </div>
  );
}
