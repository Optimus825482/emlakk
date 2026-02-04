import { Icon } from "@/components/ui/icon";
import { InputField, SelectField, CheckboxField } from "./FormFields";
import { HEATING_OPTIONS, FACADE_OPTIONS, FLOOR_TYPES } from "../_constants";
import { FormSectionProps } from "../_types";

export function KonutFormSection({ register, errors }: FormSectionProps) {
  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="home" className="text-emerald-400" /> Konut Detayları
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InputField
            label="Oda Sayısı"
            {...register("rooms")}
            error={errors.rooms?.message}
            placeholder="3+1"
          />
          <InputField
            label="Salon"
            type="number"
            {...register("livingRooms")}
            error={errors.livingRooms?.message}
            placeholder="1"
          />
          <InputField
            label="Banyo"
            type="number"
            {...register("bathrooms")}
            error={errors.bathrooms?.message}
            placeholder="2"
          />
          <InputField
            label="Balkon"
            type="number"
            {...register("balconies")}
            error={errors.balconies?.message}
            placeholder="2"
          />
          <InputField
            label="Bulunduğu Kat"
            type="number"
            {...register("floorNumber")}
            error={errors.floorNumber?.message}
            placeholder="3"
          />
          <InputField
            label="Bina Kat Sayısı"
            type="number"
            {...register("totalFloors")}
            error={errors.totalFloors?.message}
            placeholder="5"
          />
          <InputField
            label="Bina Yaşı"
            type="number"
            {...register("buildingAge")}
            error={errors.buildingAge?.message}
            placeholder="0"
          />
          <InputField
            label="Brüt m²"
            type="number"
            {...register("grossArea")}
            error={errors.grossArea?.message}
            placeholder="150"
          />
          <InputField
            label="Net m²"
            type="number"
            {...register("netArea")}
            error={errors.netArea?.message}
            placeholder="130"
          />
          <SelectField
            label="Isıtma"
            {...register("heating")}
            error={errors.heating?.message}
            options={HEATING_OPTIONS}
          />
          <SelectField
            label="Cephe"
            {...register("facade")}
            error={errors.facade?.message}
            options={FACADE_OPTIONS}
          />
          <SelectField
            label="Zemin"
            {...register("floorType")}
            error={errors.floorType?.message}
            options={FLOOR_TYPES}
          />
          <InputField
            label="Otopark Sayısı"
            type="number"
            {...register("parkingCount")}
            error={errors.parkingCount?.message}
            placeholder="1"
          />
          <InputField
            label="Bahçe m²"
            type="number"
            {...register("gardenArea")}
            error={errors.gardenArea?.message}
            placeholder="100"
          />
        </div>
      </div>

      {/* Cephe Yönleri */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="explore" className="text-blue-400" /> Cephe Yönleri
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField
            label="Batı"
            {...register("facadeWest")}
            icon="wb_twilight"
          />
          <CheckboxField
            label="Doğu"
            {...register("facadeEast")}
            icon="wb_sunny"
          />
          <CheckboxField
            label="Güney"
            {...register("facadeSouth")}
            icon="light_mode"
          />
          <CheckboxField
            label="Kuzey"
            {...register("facadeNorth")}
            icon="ac_unit"
          />
        </div>
      </div>

      {/* İç Özellikler */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="meeting_room" className="text-emerald-400" /> İç
          Özellikler
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Alüminyum Doğrama"
            {...register("aluminumFrames")}
            icon="window"
          />
          <CheckboxField
            label="Amerikan Kapı"
            {...register("americanDoor")}
            icon="door_front"
          />
          <CheckboxField
            label="Ankastre Fırın"
            {...register("builtInOven")}
            icon="oven"
          />
          <CheckboxField
            label="Barbekü"
            {...register("barbecue")}
            icon="outdoor_grill"
          />
          <CheckboxField
            label="Beyaz Eşya"
            {...register("whiteGoods")}
            icon="kitchen"
          />
          <CheckboxField
            label="Boyalı"
            {...register("painted")}
            icon="format_paint"
          />
          <CheckboxField
            label="Bulaşık Makinesi"
            {...register("dishwasher")}
            icon="dishwasher"
          />
          <CheckboxField
            label="Buzdolabı"
            {...register("refrigerator")}
            icon="kitchen"
          />
          <CheckboxField
            label="Çamaşır Kurutma"
            {...register("dryingMachine")}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çamaşır Makinesi"
            {...register("washingMachine")}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çamaşır Odası"
            {...register("laundryRoom")}
            icon="local_laundry_service"
          />
          <CheckboxField
            label="Çelik Kapı"
            {...register("steelDoor")}
            icon="door_front"
          />
          <CheckboxField
            label="Duşakabin"
            {...register("showerCabin")}
            icon="shower"
          />
          <CheckboxField
            label="Duvar Kağıdı"
            {...register("wallpaper")}
            icon="wallpaper"
          />
          <CheckboxField
            label="Ebeveyn Banyosu"
            {...register("parentBathroom")}
            icon="bathtub"
          />
          <CheckboxField
            label="Fırın"
            {...register("oven")}
            icon="oven"
          />
          <CheckboxField
            label="Giyinme Odası"
            {...register("dressing")}
            icon="checkroom"
          />
          <CheckboxField
            label="Gömme Dolap"
            {...register("builtInWardrobe")}
            icon="shelves"
          />
          <CheckboxField
            label="Görüntülü Diyafon"
            {...register("videoIntercom")}
            icon="videocam"
          />
          <CheckboxField
            label="Intercom Sistemi"
            {...register("intercomSystem")}
            icon="doorbell"
          />
          <CheckboxField
            label="Isıcam"
            {...register("doubleGlazing")}
            icon="window"
          />
          <CheckboxField
            label="Jakuzi"
            {...register("jacuzzi")}
            icon="hot_tub"
          />
          <CheckboxField
            label="Kartonpiyer"
            {...register("molding")}
            icon="architecture"
          />
          <CheckboxField
            label="Kiler"
            {...register("pantry")}
            icon="inventory_2"
          />
          <CheckboxField
            label="Klima"
            {...register("airConditioning")}
            icon="ac_unit"
          />
          <CheckboxField
            label="Küvet"
            {...register("bathtub")}
            icon="bathtub"
          />
          <CheckboxField
            label="Laminat Zemin"
            {...register("laminateFlooring")}
            icon="layers"
          />
          <CheckboxField
            label="Mobilya"
            {...register("furniture")}
            icon="chair"
          />
          <CheckboxField
            label="Mutfak (Ankastre)"
            {...register("builtInKitchen")}
            icon="countertops"
          />
          <CheckboxField
            label="Mutfak (Laminat)"
            {...register("laminateKitchen")}
            icon="countertops"
          />
          <CheckboxField
            label="Mutfak Doğalgazı"
            {...register("kitchenGas")}
            icon="local_fire_department"
          />
          <CheckboxField
            label="Panjur/Jaluzi"
            {...register("blinds")}
            icon="blinds"
          />
          <CheckboxField
            label="Parke Zemin"
            {...register("parquetFlooring")}
            icon="grid_view"
          />
          <CheckboxField
            label="PVC Doğrama"
            {...register("pvcFrames")}
            icon="window"
          />
          <CheckboxField
            label="Seramik Zemin"
            {...register("ceramicFlooring")}
            icon="grid_on"
          />
          <CheckboxField
            label="Set Üstü Ocak"
            {...register("cooktop")}
            icon="stove"
          />
          <CheckboxField
            label="Spot Aydınlatma"
            {...register("spotLighting")}
            icon="lightbulb"
          />
          <CheckboxField
            label="Şofben"
            {...register("waterHeater")}
            icon="water_heater"
          />
          <CheckboxField
            label="Şömine"
            {...register("fireplace")}
            icon="fireplace"
          />
          <CheckboxField
            label="Teras"
            {...register("terrace")}
            icon="deck"
          />
          <CheckboxField
            label="Termosifon"
            {...register("thermosiphon")}
            icon="solar_power"
          />
        </div>
      </div>

      {/* Dış Özellikler */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="apartment" className="text-purple-400" /> Dış Özellikler
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Araç Şarj İstasyonu"
            {...register("chargingStation")}
            icon="ev_station"
          />
          <CheckboxField
            label="24 Saat Güvenlik"
            {...register("security24")}
            icon="shield"
          />
          <CheckboxField
            label="Apartman Görevlisi"
            {...register("buildingAttendant")}
            icon="person"
          />
          <CheckboxField
            label="Çocuk Oyun Parkı"
            {...register("playground")}
            icon="playground"
          />
          <CheckboxField
            label="Isı Yalıtımı"
            {...register("thermalInsulation")}
            icon="thermostat"
          />
          <CheckboxField
            label="Jeneratör"
            {...register("generator")}
            icon="power"
          />
          <CheckboxField
            label="Müstakil Havuzlu"
            {...register("privatePool")}
            icon="pool"
          />
          <CheckboxField
            label="Sauna"
            {...register("sauna")}
            icon="spa"
          />
          <CheckboxField
            label="Siding"
            {...register("siding")}
            icon="home_repair_service"
          />
          <CheckboxField
            label="Spor Alanı"
            {...register("sportsArea")}
            icon="sports_soccer"
          />
          <CheckboxField
            label="Su Deposu"
            {...register("waterTank")}
            icon="water_drop"
          />
          <CheckboxField
            label="Yangın Merdiveni"
            {...register("fireEscape")}
            icon="stairs"
          />
          <CheckboxField
            label="Yüzme Havuzu (Açık)"
            {...register("outdoorPool")}
            icon="pool"
          />
          <CheckboxField
            label="Yüzme Havuzu (Kapalı)"
            {...register("indoorPool")}
            icon="pool"
          />
        </div>
      </div>

      {/* Muhit */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="location_city" className="text-amber-400" /> Muhit (Çevre)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Alışveriş Merkezi"
            {...register("shoppingMall")}
            icon="shopping_cart"
          />
          <CheckboxField
            label="Belediye"
            {...register("municipality")}
            icon="account_balance"
          />
          <CheckboxField
            label="Cami"
            {...register("mosque")}
            icon="mosque"
          />
          <CheckboxField
            label="Cemevi"
            {...register("cemevi")}
            icon="temple_buddhist"
          />
          <CheckboxField
            label="Denize Sıfır"
            {...register("beachfront")}
            icon="beach_access"
          />
          <CheckboxField
            label="Eczane"
            {...register("pharmacy")}
            icon="local_pharmacy"
          />
          <CheckboxField
            label="Eğlence Merkezi"
            {...register("entertainmentCenter")}
            icon="celebration"
          />
          <CheckboxField
            label="Hastane"
            {...register("hospital")}
            icon="local_hospital"
          />
          <CheckboxField
            label="İlkokul-Ortaokul"
            {...register("primarySchool")}
            icon="school"
          />
          <CheckboxField
            label="İtfaiye"
            {...register("fireStation")}
            icon="fire_truck"
          />
          <CheckboxField
            label="Lise"
            {...register("highSchool")}
            icon="school"
          />
          <CheckboxField
            label="Market"
            {...register("market")}
            icon="store"
          />
          <CheckboxField
            label="Park"
            {...register("park")}
            icon="park"
          />
          <CheckboxField
            label="Polis Merkezi"
            {...register("policeStation")}
            icon="local_police"
          />
          <CheckboxField
            label="Sağlık Ocağı"
            {...register("healthCenter")}
            icon="medical_services"
          />
          <CheckboxField
            label="Semt Pazarı"
            {...register("weeklyMarket")}
            icon="storefront"
          />
          <CheckboxField
            label="Spor Salonu"
            {...register("sportsCenter")}
            icon="fitness_center"
          />
          <CheckboxField
            label="Şehir Merkezi"
            {...register("cityCenter")}
            icon="location_city"
          />
          <CheckboxField
            label="Üniversite"
            {...register("university")}
            icon="school"
          />
        </div>
      </div>

      {/* Ulaşım */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="directions_bus" className="text-cyan-400" /> Ulaşım
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Anayol"
            {...register("mainRoad")}
            icon="route"
          />
          <CheckboxField
            label="Cadde"
            {...register("avenue")}
            icon="signpost"
          />
          <CheckboxField
            label="Dolmuş"
            {...register("dolmus")}
            icon="local_taxi"
          />
          <CheckboxField
            label="E-5"
            {...register("e5")}
            icon="highway"
          />
          <CheckboxField
            label="Minibüs"
            {...register("minibus")}
            icon="airport_shuttle"
          />
          <CheckboxField
            label="Otobüs Durağı"
            {...register("busStop")}
            icon="directions_bus"
          />
          <CheckboxField
            label="TEM"
            {...register("tem")}
            icon="highway"
          />
        </div>
      </div>

      {/* Konut Tipi */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Icon name="domain" className="text-pink-400" /> Konut Tipi
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <CheckboxField
            label="Dubleks"
            {...register("duplex")}
            icon="stairs"
          />
          <CheckboxField
            label="En Üst Kat"
            {...register("topFloor")}
            icon="vertical_align_top"
          />
          <CheckboxField
            label="Ara Kat"
            {...register("middleFloor")}
            icon="vertical_align_center"
          />
          <CheckboxField
            label="Ara Kat Dubleks"
            {...register("middleFloorDuplex")}
            icon="stairs"
          />
          <CheckboxField
            label="Bahçe Dubleksi"
            {...register("gardenDuplex")}
            icon="yard"
          />
          <CheckboxField
            label="Çatı Dubleksi"
            {...register("roofDuplex")}
            icon="roofing"
          />
          <CheckboxField
            label="Forleks"
            {...register("fourplex")}
            icon="apartment"
          />
          <CheckboxField
            label="Ters Dubleks"
            {...register("reverseDuplex")}
            icon="flip"
          />
          <CheckboxField
            label="Tripleks"
            {...register("triplex")}
            icon="layers"
          />
        </div>
      </div>
    </>
  );
}
