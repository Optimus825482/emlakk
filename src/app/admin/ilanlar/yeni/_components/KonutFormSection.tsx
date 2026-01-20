import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { HEATING_OPTIONS, FACADE_OPTIONS, FLOOR_TYPES } from "../_constants";
import { FormSectionProps } from "../_types";

export function KonutFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="home" className="text-emerald-400" /> Konut Detayları
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Oda Sayısı" name="rooms" value={formData.rooms} onChange={handleChange} placeholder="3+1" />
        <InputField label="Salon" name="livingRooms" value={formData.livingRooms} onChange={handleChange} type="number" placeholder="1" />
        <InputField label="Banyo" name="bathrooms" value={formData.bathrooms} onChange={handleChange} type="number" placeholder="2" />
        <InputField label="Balkon" name="balconies" value={formData.balconies} onChange={handleChange} type="number" placeholder="2" />
        <InputField label="Bulunduğu Kat" name="floorNumber" value={formData.floorNumber} onChange={handleChange} type="number" placeholder="3" />
        <InputField label="Bina Kat Sayısı" name="totalFloors" value={formData.totalFloors} onChange={handleChange} type="number" placeholder="5" />
        <InputField label="Bina Yaşı" name="buildingAge" value={formData.buildingAge} onChange={handleChange} type="number" placeholder="0" />
        <InputField label="Brüt m²" name="grossArea" value={formData.grossArea} onChange={handleChange} type="number" placeholder="150" />
        <InputField label="Net m²" name="netArea" value={formData.netArea} onChange={handleChange} type="number" placeholder="130" />
        <SelectField label="Isıtma" name="heating" value={formData.heating} onChange={handleChange} options={HEATING_OPTIONS} />
        <SelectField label="Cephe" name="facade" value={formData.facade} onChange={handleChange} options={FACADE_OPTIONS} />
        <SelectField label="Zemin" name="floorType" value={formData.floorType} onChange={handleChange} options={FLOOR_TYPES} />
        <InputField label="Otopark Sayısı" name="parkingCount" value={formData.parkingCount} onChange={handleChange} type="number" placeholder="1" />
        <InputField label="Bahçe m²" name="gardenArea" value={formData.gardenArea} onChange={handleChange} type="number" placeholder="100" />
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">İç Özellikler</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField label="Eşyalı" name="furnished" checked={formData.furnished} onChange={handleChange} icon="chair" />
          <CheckboxField label="Klima" name="airConditioning" checked={formData.airConditioning} onChange={handleChange} icon="ac_unit" />
          <CheckboxField label="Şömine" name="fireplace" checked={formData.fireplace} onChange={handleChange} icon="fireplace" />
          <CheckboxField label="Jakuzi" name="jacuzzi" checked={formData.jacuzzi} onChange={handleChange} icon="hot_tub" />
          <CheckboxField label="Giyinme Odası" name="dressing" checked={formData.dressing} onChange={handleChange} icon="checkroom" />
          <CheckboxField label="Çamaşır Odası" name="laundryRoom" checked={formData.laundryRoom} onChange={handleChange} icon="local_laundry_service" />
          <CheckboxField label="Ebeveyn Banyosu" name="parentBathroom" checked={formData.parentBathroom} onChange={handleChange} icon="bathtub" />
          <CheckboxField label="Kiler" name="cellar" checked={formData.cellar} onChange={handleChange} icon="inventory_2" />
          <CheckboxField label="Teras" name="terrace" checked={formData.terrace} onChange={handleChange} icon="deck" />
          <CheckboxField label="Balkon" name="balcony" checked={formData.balcony} onChange={handleChange} icon="balcony" />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Dış & Bina</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField label="Otopark" name="parking" checked={formData.parking} onChange={handleChange} icon="local_parking" />
          <CheckboxField label="Bahçe" name="garden" checked={formData.garden} onChange={handleChange} icon="yard" />
          <CheckboxField label="Havuz" name="pool" checked={formData.pool} onChange={handleChange} icon="pool" />
          <CheckboxField label="Asansör" name="elevator" checked={formData.elevator} onChange={handleChange} icon="elevator" />
          <CheckboxField label="Güvenlik" name="security" checked={formData.security} onChange={handleChange} icon="security" />
          <CheckboxField label="Kapıcı" name="doorman" checked={formData.doorman} onChange={handleChange} icon="person" />
          <CheckboxField label="Sauna" name="sauna" checked={formData.sauna} onChange={handleChange} icon="spa" />
          <CheckboxField label="Spor Salonu" name="gym" checked={formData.gym} onChange={handleChange} icon="fitness_center" />
          <CheckboxField label="Oyun Odası" name="playroom" checked={formData.playroom} onChange={handleChange} icon="sports_esports" />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Teknoloji</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField label="İnternet" name="internet" checked={formData.internet} onChange={handleChange} icon="wifi" />
          <CheckboxField label="Uydu" name="satellite" checked={formData.satellite} onChange={handleChange} icon="satellite_alt" />
          <CheckboxField label="Kablolu TV" name="cableTV" checked={formData.cableTV} onChange={handleChange} icon="tv" />
          <CheckboxField label="Görüntülü Diafon" name="intercom" checked={formData.intercom} onChange={handleChange} icon="videocam" />
        </div>
      </div>
    </div>
  );
}
