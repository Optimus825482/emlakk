import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { HEATING_OPTIONS, FACADE_OPTIONS, FLOOR_TYPES } from "../_constants";
import { FormSectionProps } from "../_types";

export function KonutFormSection({ formData, handleChange }: FormSectionProps) {
  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="home" className="text-emerald-400" /> Konut Detayları
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField
            label="Oda Sayısı"
            name="rooms"
            value={formData.rooms}
            onChange={handleChange}
            placeholder="3+1"
          />
          <InputField
            label="Salon"
            name="livingRooms"
            value={formData.livingRooms}
            onChange={handleChange}
            type="number"
            placeholder="1"
          />
          <InputField
            label="Banyo"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            type="number"
            placeholder="2"
          />
          <InputField
            label="Balkon"
            name="balconies"
            value={formData.balconies}
            onChange={handleChange}
            type="number"
            placeholder="2"
          />
          <InputField
            label="Bulunduğu Kat"
            name="floorNumber"
            value={formData.floorNumber}
            onChange={handleChange}
            type="number"
            placeholder="3"
          />
          <InputField
            label="Bina Kat Sayısı"
            name="totalFloors"
            value={formData.totalFloors}
            onChange={handleChange}
            type="number"
            placeholder="5"
          />
          <InputField
            label="Bina Yaşı"
            name="buildingAge"
            value={formData.buildingAge}
            onChange={handleChange}
            type="number"
            placeholder="0"
          />
          <InputField
            label="Brüt m²"
            name="grossArea"
            value={formData.grossArea}
            onChange={handleChange}
            type="number"
            placeholder="150"
          />
          <InputField
            label="Net m²"
            name="netArea"
            value={formData.netArea}
            onChange={handleChange}
            type="number"
            placeholder="130"
          />
          <SelectField
            label="Isıtma"
            name="heating"
            value={formData.heating}
            onChange={handleChange}
            options={HEATING_OPTIONS}
          />
          <SelectField
            label="Cephe"
            name="facade"
            value={formData.facade}
            onChange={handleChange}
            options={FACADE_OPTIONS}
          />
          <SelectField
            label="Zemin"
            name="floorType"
            value={formData.floorType}
            onChange={handleChange}
            options={FLOOR_TYPES}
          />
          <InputField
            label="Otopark Sayısı"
            name="parkingCount"
            value={formData.parkingCount}
            onChange={handleChange}
            type="number"
            placeholder="1"
          />
          <InputField
            label="Bahçe m²"
            name="gardenArea"
            value={formData.gardenArea}
            onChange={handleChange}
            type="number"
            placeholder="100"
          />
        </div>
      </div>

      {/* Cephe Yönleri */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="explore" className="text-blue-400" /> Cephe Yönleri
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField
            label="Batı"
            name="facadeWest"
            checked={formData.facadeWest}
            onChange={handleChange}
            icon="wb_twilight"
          />
          <CheckboxField
            label="Doğu"
            name="facadeEast"
            checked={formData.facadeEast}
            onChange={handleChange}
            icon="wb_sunny"
          />
          <CheckboxField
            label="Güney"
            name="facadeSouth"
            checked={formData.facadeSouth}
            onChange={handleChange}
            icon="light_mode"
          />
          <CheckboxField
            label="Kuzey"
            name="facadeNorth"
            checked={formData.facadeNorth}
            onChange={handleChange}
            icon="ac_unit"
          />
        </div>
      </div>

      {/* İç Özellikler */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="meeting_room" className="text-emerald-400" /> İç
          Özellikler
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Alüminyum Doğrama"
            name="aluminumFrames"
            checked={formData.aluminumFrames}
            onChange={handleChange}
            icon="window"
          />
          <CheckboxField
            label="Amerikan Kapı"
            name="americanDoor"
            checked={formData.americanDoor}
            onChange={handleChange}
            icon="door_front"
          />
          <CheckboxField
            label="Ankastre Fırın"
            name="builtInOven"
            checked={formData.builtInOven}
            onChange={handleChange}
            icon="oven"
          />
          <CheckboxField
            label="Barbekü"
            name="barbecue"
            checked={formData.barbecue}
            onChange={handleChange}
            icon="outdoor_grill"
          />
          <CheckboxField
            label="Beyaz Eşya"
            name="whiteGoods"
            checked={formData.whiteGoods}
            onChange={handleChange}
            icon="kitchen"
          />
          <CheckboxField
            label="Boyalı"
            name="painted"
            checked={formData.painted}
            onChange={handleChange}
            icon="format_paint"
          />
          <CheckboxField
            label="Bulaşık Makinesi"
            name="dishwasher"
            checked={formData.dishwasher}
            onChange={handleChange}
            icon="dishwasher"
          />
          <CheckboxField
            label="Buzdolabı"
            name="refrigerator"
            checked={formData.refrigerator}
            onChange={handleChange}
            icon="kitchen"
          />
          <CheckboxField
            label="Çamaşır Kurutma"
            name="dryingMachine"
            checked={formData.dryingMachine}
            onChange={handleChange}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çamaşır Makinesi"
            name="washingMachine"
            checked={formData.washingMachine}
            onChange={handleChange}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çamaşır Odası"
            name="laundryRoom"
            checked={formData.laundryRoom}
            onChange={handleChange}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çelik Kapı"
            name="steelDoor"
            checked={formData.steelDoor}
            onChange={handleChange}
            icon="door_front"
          />
          <CheckboxField
            label="Duşakabin"
            name="showerCabin"
            checked={formData.showerCabin}
            onChange={handleChange}
            icon="shower"
          />
          <CheckboxField
            label="Duvar Kağıdı"
            name="wallpaper"
            checked={formData.wallpaper}
            onChange={handleChange}
            icon="wallpaper"
          />
          <CheckboxField
            label="Ebeveyn Banyosu"
            name="parentBathroom"
            checked={formData.parentBathroom}
            onChange={handleChange}
            icon="bathtub"
          />
          <CheckboxField
            label="Fırın"
            name="oven"
            checked={formData.oven}
            onChange={handleChange}
            icon="oven"
          />
          <CheckboxField
            label="Giyinme Odası"
            name="dressing"
            checked={formData.dressing}
            onChange={handleChange}
            icon="checkroom"
          />
          <CheckboxField
            label="Gömme Dolap"
            name="builtInWardrobe"
            checked={formData.builtInWardrobe}
            onChange={handleChange}
            icon="shelves"
          />
          <CheckboxField
            label="Görüntülü Diyafon"
            name="videoIntercom"
            checked={formData.videoIntercom}
            onChange={handleChange}
            icon="videocam"
          />
          <CheckboxField
            label="Intercom Sistemi"
            name="intercomSystem"
            checked={formData.intercomSystem}
            onChange={handleChange}
            icon="doorbell"
          />
          <CheckboxField
            label="Isıcam"
            name="doubleGlazing"
            checked={formData.doubleGlazing}
            onChange={handleChange}
            icon="window"
          />
          <CheckboxField
            label="Jakuzi"
            name="jacuzzi"
            checked={formData.jacuzzi}
            onChange={handleChange}
            icon="hot_tub"
          />
          <CheckboxField
            label="Kartonpiyer"
            name="molding"
            checked={formData.molding}
            onChange={handleChange}
            icon="architecture"
          />
          <CheckboxField
            label="Kiler"
            name="pantry"
            checked={formData.pantry}
            onChange={handleChange}
            icon="inventory_2"
          />
          <CheckboxField
            label="Klima"
            name="airConditioning"
            checked={formData.airConditioning}
            onChange={handleChange}
            icon="ac_unit"
          />
          <CheckboxField
            label="Küvet"
            name="bathtub"
            checked={formData.bathtub}
            onChange={handleChange}
            icon="bathtub"
          />
          <CheckboxField
            label="Laminat Zemin"
            name="laminateFlooring"
            checked={formData.laminateFlooring}
            onChange={handleChange}
            icon="layers"
          />
          <CheckboxField
            label="Mobilya"
            name="furniture"
            checked={formData.furniture}
            onChange={handleChange}
            icon="chair"
          />
          <CheckboxField
            label="Mutfak (Ankastre)"
            name="builtInKitchen"
            checked={formData.builtInKitchen}
            onChange={handleChange}
            icon="countertops"
          />
          <CheckboxField
            label="Mutfak (Laminat)"
            name="laminateKitchen"
            checked={formData.laminateKitchen}
            onChange={handleChange}
            icon="countertops"
          />
          <CheckboxField
            label="Mutfak Doğalgazı"
            name="kitchenGas"
            checked={formData.kitchenGas}
            onChange={handleChange}
            icon="local_fire_department"
          />
          <CheckboxField
            label="Panjur/Jaluzi"
            name="blinds"
            checked={formData.blinds}
            onChange={handleChange}
            icon="blinds"
          />
          <CheckboxField
            label="Parke Zemin"
            name="parquetFlooring"
            checked={formData.parquetFlooring}
            onChange={handleChange}
            icon="grid_view"
          />
          <CheckboxField
            label="PVC Doğrama"
            name="pvcFrames"
            checked={formData.pvcFrames}
            onChange={handleChange}
            icon="window"
          />
          <CheckboxField
            label="Seramik Zemin"
            name="ceramicFlooring"
            checked={formData.ceramicFlooring}
            onChange={handleChange}
            icon="grid_on"
          />
          <CheckboxField
            label="Set Üstü Ocak"
            name="cooktop"
            checked={formData.cooktop}
            onChange={handleChange}
            icon="stove"
          />
          <CheckboxField
            label="Spot Aydınlatma"
            name="spotLighting"
            checked={formData.spotLighting}
            onChange={handleChange}
            icon="lightbulb"
          />
          <CheckboxField
            label="Şofben"
            name="waterHeater"
            checked={formData.waterHeater}
            onChange={handleChange}
            icon="water_heater"
          />
          <CheckboxField
            label="Şömine"
            name="fireplace"
            checked={formData.fireplace}
            onChange={handleChange}
            icon="fireplace"
          />
          <CheckboxField
            label="Teras"
            name="terrace"
            checked={formData.terrace}
            onChange={handleChange}
            icon="deck"
          />
          <CheckboxField
            label="Termosifon"
            name="thermosiphon"
            checked={formData.thermosiphon}
            onChange={handleChange}
            icon="solar_power"
          />
        </div>
      </div>

      {/* Dış Özellikler */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="apartment" className="text-purple-400" /> Dış Özellikler
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Araç Şarj İstasyonu"
            name="chargingStation"
            checked={formData.chargingStation}
            onChange={handleChange}
            icon="ev_station"
          />
          <CheckboxField
            label="24 Saat Güvenlik"
            name="security24"
            checked={formData.security24}
            onChange={handleChange}
            icon="shield"
          />
          <CheckboxField
            label="Apartman Görevlisi"
            name="buildingAttendant"
            checked={formData.buildingAttendant}
            onChange={handleChange}
            icon="person"
          />
          <CheckboxField
            label="Çocuk Oyun Parkı"
            name="playground"
            checked={formData.playground}
            onChange={handleChange}
            icon="playground"
          />
          <CheckboxField
            label="Isı Yalıtımı"
            name="thermalInsulation"
            checked={formData.thermalInsulation}
            onChange={handleChange}
            icon="thermostat"
          />
          <CheckboxField
            label="Jeneratör"
            name="generator"
            checked={formData.generator}
            onChange={handleChange}
            icon="power"
          />
          <CheckboxField
            label="Müstakil Havuzlu"
            name="privatePool"
            checked={formData.privatePool}
            onChange={handleChange}
            icon="pool"
          />
          <CheckboxField
            label="Sauna"
            name="sauna"
            checked={formData.sauna}
            onChange={handleChange}
            icon="spa"
          />
          <CheckboxField
            label="Siding"
            name="siding"
            checked={formData.siding}
            onChange={handleChange}
            icon="home_repair_service"
          />
          <CheckboxField
            label="Spor Alanı"
            name="sportsArea"
            checked={formData.sportsArea}
            onChange={handleChange}
            icon="sports_soccer"
          />
          <CheckboxField
            label="Su Deposu"
            name="waterTank"
            checked={formData.waterTank}
            onChange={handleChange}
            icon="water_drop"
          />
          <CheckboxField
            label="Yangın Merdiveni"
            name="fireEscape"
            checked={formData.fireEscape}
            onChange={handleChange}
            icon="stairs"
          />
          <CheckboxField
            label="Yüzme Havuzu (Açık)"
            name="outdoorPool"
            checked={formData.outdoorPool}
            onChange={handleChange}
            icon="pool"
          />
          <CheckboxField
            label="Yüzme Havuzu (Kapalı)"
            name="indoorPool"
            checked={formData.indoorPool}
            onChange={handleChange}
            icon="pool"
          />
        </div>
      </div>

      {/* Muhit */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="location_city" className="text-amber-400" /> Muhit (Çevre)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Alışveriş Merkezi"
            name="shoppingMall"
            checked={formData.shoppingMall}
            onChange={handleChange}
            icon="shopping_cart"
          />
          <CheckboxField
            label="Belediye"
            name="municipality"
            checked={formData.municipality}
            onChange={handleChange}
            icon="account_balance"
          />
          <CheckboxField
            label="Cami"
            name="mosque"
            checked={formData.mosque}
            onChange={handleChange}
            icon="mosque"
          />
          <CheckboxField
            label="Cemevi"
            name="cemevi"
            checked={formData.cemevi}
            onChange={handleChange}
            icon="temple_buddhist"
          />
          <CheckboxField
            label="Denize Sıfır"
            name="beachfront"
            checked={formData.beachfront}
            onChange={handleChange}
            icon="beach_access"
          />
          <CheckboxField
            label="Eczane"
            name="pharmacy"
            checked={formData.pharmacy}
            onChange={handleChange}
            icon="local_pharmacy"
          />
          <CheckboxField
            label="Eğlence Merkezi"
            name="entertainmentCenter"
            checked={formData.entertainmentCenter}
            onChange={handleChange}
            icon="celebration"
          />
          <CheckboxField
            label="Hastane"
            name="hospital"
            checked={formData.hospital}
            onChange={handleChange}
            icon="local_hospital"
          />
          <CheckboxField
            label="İlkokul-Ortaokul"
            name="primarySchool"
            checked={formData.primarySchool}
            onChange={handleChange}
            icon="school"
          />
          <CheckboxField
            label="İtfaiye"
            name="fireStation"
            checked={formData.fireStation}
            onChange={handleChange}
            icon="fire_truck"
          />
          <CheckboxField
            label="Lise"
            name="highSchool"
            checked={formData.highSchool}
            onChange={handleChange}
            icon="school"
          />
          <CheckboxField
            label="Market"
            name="market"
            checked={formData.market}
            onChange={handleChange}
            icon="store"
          />
          <CheckboxField
            label="Park"
            name="park"
            checked={formData.park}
            onChange={handleChange}
            icon="park"
          />
          <CheckboxField
            label="Polis Merkezi"
            name="policeStation"
            checked={formData.policeStation}
            onChange={handleChange}
            icon="local_police"
          />
          <CheckboxField
            label="Sağlık Ocağı"
            name="healthCenter"
            checked={formData.healthCenter}
            onChange={handleChange}
            icon="medical_services"
          />
          <CheckboxField
            label="Semt Pazarı"
            name="weeklyMarket"
            checked={formData.weeklyMarket}
            onChange={handleChange}
            icon="storefront"
          />
          <CheckboxField
            label="Spor Salonu"
            name="sportsCenter"
            checked={formData.sportsCenter}
            onChange={handleChange}
            icon="fitness_center"
          />
          <CheckboxField
            label="Şehir Merkezi"
            name="cityCenter"
            checked={formData.cityCenter}
            onChange={handleChange}
            icon="location_city"
          />
          <CheckboxField
            label="Üniversite"
            name="university"
            checked={formData.university}
            onChange={handleChange}
            icon="school"
          />
        </div>
      </div>

      {/* Ulaşım */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="directions_bus" className="text-cyan-400" /> Ulaşım
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Anayol"
            name="mainRoad"
            checked={formData.mainRoad}
            onChange={handleChange}
            icon="route"
          />
          <CheckboxField
            label="Cadde"
            name="avenue"
            checked={formData.avenue}
            onChange={handleChange}
            icon="signpost"
          />
          <CheckboxField
            label="Dolmuş"
            name="dolmus"
            checked={formData.dolmus}
            onChange={handleChange}
            icon="local_taxi"
          />
          <CheckboxField
            label="E-5"
            name="e5"
            checked={formData.e5}
            onChange={handleChange}
            icon="highway"
          />
          <CheckboxField
            label="Minibüs"
            name="minibus"
            checked={formData.minibus}
            onChange={handleChange}
            icon="airport_shuttle"
          />
          <CheckboxField
            label="Otobüs Durağı"
            name="busStop"
            checked={formData.busStop}
            onChange={handleChange}
            icon="directions_bus"
          />
          <CheckboxField
            label="TEM"
            name="tem"
            checked={formData.tem}
            onChange={handleChange}
            icon="highway"
          />
        </div>
      </div>

      {/* Konut Tipi */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="domain" className="text-pink-400" /> Konut Tipi
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Dubleks"
            name="duplex"
            checked={formData.duplex}
            onChange={handleChange}
            icon="stairs"
          />
          <CheckboxField
            label="En Üst Kat"
            name="topFloor"
            checked={formData.topFloor}
            onChange={handleChange}
            icon="vertical_align_top"
          />
          <CheckboxField
            label="Ara Kat"
            name="middleFloor"
            checked={formData.middleFloor}
            onChange={handleChange}
            icon="vertical_align_center"
          />
          <CheckboxField
            label="Ara Kat Dubleks"
            name="middleFloorDuplex"
            checked={formData.middleFloorDuplex}
            onChange={handleChange}
            icon="stairs"
          />
          <CheckboxField
            label="Bahçe Dubleksi"
            name="gardenDuplex"
            checked={formData.gardenDuplex}
            onChange={handleChange}
            icon="yard"
          />
          <CheckboxField
            label="Çatı Dubleksi"
            name="roofDuplex"
            checked={formData.roofDuplex}
            onChange={handleChange}
            icon="roofing"
          />
          <CheckboxField
            label="Forleks"
            name="fourplex"
            checked={formData.fourplex}
            onChange={handleChange}
            icon="apartment"
          />
          <CheckboxField
            label="Ters Dubleks"
            name="reverseDuplex"
            checked={formData.reverseDuplex}
            onChange={handleChange}
            icon="flip"
          />
          <CheckboxField
            label="Tripleks"
            name="triplex"
            checked={formData.triplex}
            onChange={handleChange}
            icon="layers"
          />
        </div>
      </div>
    </>
  );
}
