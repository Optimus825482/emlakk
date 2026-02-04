"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import dynamic from "next/dynamic";

const ListingAIAssistant = dynamic(() => import("@/components/admin/ListingAIAssistant").then(mod => mod.ListingAIAssistant), {
  ssr: false,
});

import { ListingType, TransactionType, ListingFormData } from "../_types";
import { createListingSchema } from "@/lib/validations";
import { apiFetch } from "@/lib/api-client";
import {
  DISTRICTS,
  HEATING_OPTIONS,
  FACADE_OPTIONS,
  FLOOR_TYPES,
  ZONING_STATUS,
  DEED_STATUS,
  SOIL_TYPES,
  CROP_TYPES,
} from "../_constants";
import {
  InputField,
  SelectField,
  CheckboxField,
} from "../_components/FormFields";
import { KonutFormSection } from "../_components/KonutFormSection";
import { SanayiFormSection } from "../_components/SanayiFormSection";
import { TarimFormSection } from "../_components/TarimFormSection";
import { TicariFormSection } from "../_components/TicariFormSection";
import { ArsaFormSection } from "../_components/ArsaFormSection";

const DRAFT_STORAGE_KEY = "listing-draft";
const DRAFT_IMAGES_KEY = "listing-draft-images";

export default function YeniIlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "konut",
      transactionType: "sale",
      status: "active",
      address: "",
      district: "Hendek",
      neighborhood: "",
      area: "",
      price: "",
      isFeatured: false,
      // ... default values for all other fields could be added here
    },
  });

  const formData = watch();

  const handleUpdateField = useCallback((name: string, value: string) => {
    setValue(name as any, value);
  }, [setValue]);

  // Load draft from localStorage on mount
  useEffect(() => {
    // Client-side only check
    if (typeof window === "undefined") return;

    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    const savedImages = localStorage.getItem(DRAFT_IMAGES_KEY);

    if (savedDraft) {
      setHasDraft(true);
      toast.info("Kaydedilmemiş taslak bulundu", {
        description: "Kaldığınız yerden devam etmek ister misiniz?",
        action: {
          label: "Evet, Yükle",
          onClick: () => {
            try {
              const draft = JSON.parse(savedDraft);
              reset(draft);
              if (savedImages) {
                setImages(JSON.parse(savedImages));
              }
              setLastSaved(new Date());
              toast.success("Taslak yüklendi");
            } catch (error) {
              console.error("Taslak yüklenemedi:", error);
              toast.error("Taslak yüklenirken hata oluştu");
            }
          },
        },
        cancel: {
          label: "Hayır, Sil",
          onClick: () => {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_IMAGES_KEY);
            setHasDraft(false);
            toast.dismiss();
          },
        },
        duration: 8000,
      });
    }
  }, [reset]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setValue(name as any, type === "checkbox" ? (e.target as HTMLInputElement).checked : value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if there's meaningful data and form is dirty
      const currentValues = watch();
      if (currentValues.title || currentValues.description || currentValues.price) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(currentValues));
        localStorage.setItem(DRAFT_IMAGES_KEY, JSON.stringify(images));
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, images, watch]);

  const generateAIDescription = async () => {
    if (!formData.title || !formData.area || !formData.price) {
      toast.error("Eksik bilgi", { description: "AI açıklama üretmek için başlık, alan ve fiyat gereklidir." });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await apiFetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          area: parseInt(formData.area),
          price: parseInt(formData.price),
        }),
      });
      if (!response.success) throw new Error(response.error?.message || "AI hatası");
      const data = response.data as any;
      setValue("description", data.description, { shouldValidate: true });
      toast.success("AI açıklama üretildi");
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") return;
      console.error("AI hatası:", error);
      toast.error("AI hatası", { description: "Açıklama üretilirken bir hata oluştu." });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const buildFeatures = (data: ListingFormData) => {
    const features: Record<string, unknown> = {
      zoningStatus: data.zoningStatus || undefined,
      deedStatus: data.deedStatus || undefined,
      parcelNo: data.parcelNo || undefined,
      blockNo: data.blockNo || undefined,
    };
    if (data.type === "konut") {
      Object.assign(features, {
        rooms: data.rooms || undefined,
        livingRooms: data.livingRooms
          ? parseInt(data.livingRooms)
          : undefined,
        bathrooms: data.bathrooms
          ? parseInt(data.bathrooms)
          : undefined,
        balconies: data.balconies
          ? parseInt(data.balconies)
          : undefined,
        floorNumber: data.floorNumber
          ? parseInt(data.floorNumber)
          : undefined,
        totalFloors: data.totalFloors
          ? parseInt(data.totalFloors)
          : undefined,
        buildingAge: data.buildingAge
          ? parseInt(data.buildingAge)
          : undefined,
        grossArea: data.grossArea
          ? parseInt(data.grossArea)
          : undefined,
        netArea: data.netArea ? parseInt(data.netArea) : undefined,
        heating: data.heating || undefined,
        facade: data.facade || undefined,
        floorType: data.floorType || undefined,
        kitchenType: data.kitchenType || undefined,
        windowType: data.windowType || undefined,
        furnished: data.furnished,
        parking: data.parking,
        parkingCount: data.parkingCount
          ? parseInt(data.parkingCount)
          : undefined,
        garden: data.garden,
        gardenArea: data.gardenArea
          ? parseInt(data.gardenArea)
          : undefined,
        pool: data.pool,
        elevator: data.elevator,
        security: data.security,
        doorman: data.doorman,
        intercom: data.intercom,
        satellite: data.satellite,
        cableTV: data.cableTV,
        internet: data.internet,
        airConditioning: data.airConditioning,
        fireplace: data.fireplace,
        jacuzzi: data.jacuzzi,
        sauna: data.sauna,
        gym: data.gym,
        playroom: data.playroom,
        cellar: data.cellar,
        terrace: data.terrace,
        balcony: data.balcony,
        dressing: data.dressing,
        laundryRoom: data.laundryRoom,
        parentBathroom: data.parentBathroom,
        // Yeni özellikler
        facadeWest: data.facadeWest,
        facadeEast: data.facadeEast,
        facadeSouth: data.facadeSouth,
        facadeNorth: data.facadeNorth,
        aluminumFrames: data.aluminumFrames,
        americanDoor: data.americanDoor,
        builtInOven: data.builtInOven,
        barbecue: data.barbecue,
        whiteGoods: data.whiteGoods,
        painted: data.painted,
        dishwasher: data.dishwasher,
        refrigerator: data.refrigerator,
        dryingMachine: data.dryingMachine,
        washingMachine: data.washingMachine,
        steelDoor: data.steelDoor,
        showerCabin: data.showerCabin,
        wallpaper: data.wallpaper,
        oven: data.oven,
        builtInWardrobe: data.builtInWardrobe,
        videoIntercom: data.videoIntercom,
        intercomSystem: data.intercomSystem,
        doubleGlazing: data.doubleGlazing,
        molding: data.molding,
        pantry: data.pantry,
        bathtub: data.bathtub,
        laminateFlooring: data.laminateFlooring,
        furniture: data.furniture,
        builtInKitchen: data.builtInKitchen,
        laminateKitchen: data.laminateKitchen,
        kitchenGas: data.kitchenGas,
        blinds: data.blinds,
        parquetFlooring: data.parquetFlooring,
        pvcFrames: data.pvcFrames,
        ceramicFlooring: data.ceramicFlooring,
        cooktop: data.cooktop,
        spotLighting: data.spotLighting,
        waterHeater: data.waterHeater,
        thermosiphon: data.thermosiphon,
        chargingStation: data.chargingStation,
        security24: data.security24,
        buildingAttendant: data.buildingAttendant,
        playground: data.playground,
        thermalInsulation: data.thermalInsulation,
        generator: data.generator,
        privatePool: data.privatePool,
        siding: data.siding,
        sportsArea: data.sportsArea,
        waterTank: data.waterTank,
        fireEscape: data.fireEscape,
        outdoorPool: data.outdoorPool,
        indoorPool: data.indoorPool,
        shoppingMall: data.shoppingMall,
        municipality: data.municipality,
        mosque: data.mosque,
        cemevi: data.cemevi,
        beachfront: data.beachfront,
        pharmacy: data.pharmacy,
        entertainmentCenter: data.entertainmentCenter,
        hospital: data.hospital,
        primarySchool: data.primarySchool,
        fireStation: data.fireStation,
        highSchool: data.highSchool,
        market: data.market,
        park: data.park,
        policeStation: data.policeStation,
        healthCenter: data.healthCenter,
        weeklyMarket: data.weeklyMarket,
        sportsCenter: data.sportsCenter,
        cityCenter: data.cityCenter,
        university: data.university,
        mainRoad: data.mainRoad,
        avenue: data.avenue,
        dolmus: data.dolmus,
        e5: data.e5,
        minibus: data.minibus,
        busStop: data.busStop,
        tem: data.tem,
        duplex: data.duplex,
        topFloor: data.topFloor,
        middleFloor: data.middleFloor,
        middleFloorDuplex: data.middleFloorDuplex,
        gardenDuplex: data.gardenDuplex,
        roofDuplex: data.roofDuplex,
        fourplex: data.fourplex,
        reverseDuplex: data.reverseDuplex,
        triplex: data.triplex,
      });
    } else if (data.type === "sanayi") {
      Object.assign(features, {
        infrastructure: data.infrastructure,
        electricity: data.electricity,
        electricityPower: data.electricityPower || undefined,
        threePhase: data.threePhase,
        water: data.water,
        naturalGas: data.naturalGas,
        sewage: data.sewage,
        roadAccess: data.roadAccess || undefined,
        roadType: data.roadType || undefined,
        ceilingHeight: data.ceilingHeight
          ? parseFloat(data.ceilingHeight)
          : undefined,
        loadingRamp: data.loadingRamp,
        craneSystem: data.craneSystem,
        craneCapacity: data.craneCapacity || undefined,
        officeArea: data.officeArea
          ? parseInt(data.officeArea)
          : undefined,
        openArea: data.openArea ? parseInt(data.openArea) : undefined,
        closedArea: data.closedArea
          ? parseInt(data.closedArea)
          : undefined,
        securityRoom: data.securityRoom,
        fireSystem: data.fireSystem,
      });
    } else if (data.type === "tarim") {
      Object.assign(features, {
        treeCount: data.treeCount
          ? parseInt(data.treeCount)
          : undefined,
        treeAge: data.treeAge ? parseInt(data.treeAge) : undefined,
        cropType: data.cropType || undefined,
        irrigation: data.irrigation,
        irrigationType: data.irrigationType || undefined,
        waterSource: data.waterSource || undefined,
        organic: data.organic,
        organicCertificate: data.organicCertificate || undefined,
        soilType: data.soilType || undefined,
        slope: data.slope || undefined,
        fenced: data.fenced,
        warehouse: data.warehouse,
        warehouseArea: data.warehouseArea
          ? parseInt(data.warehouseArea)
          : undefined,
        well: data.well,
        wellDepth: data.wellDepth
          ? parseInt(data.wellDepth)
          : undefined,
        annualYield: data.annualYield || undefined,
      });
    } else if (data.type === "ticari") {
      Object.assign(features, {
        shopWidth: data.shopWidth
          ? parseFloat(data.shopWidth)
          : undefined,
        shopDepth: data.shopDepth
          ? parseFloat(data.shopDepth)
          : undefined,
        showcaseCount: data.showcaseCount
          ? parseInt(data.showcaseCount)
          : undefined,
        cornerShop: data.cornerShop,
        mainStreet: data.mainStreet,
        mallLocation: data.mallLocation,
        suitableFor: data.suitableFor || undefined,
        currentTenant: data.currentTenant || undefined,
        monthlyRent: data.monthlyRent || undefined,
        depositAmount: data.depositAmount || undefined,
        parking: data.parking,
        elevator: data.elevator,
        security: data.security,
        totalFloors: data.totalFloors
          ? parseInt(data.totalFloors)
          : undefined,
        floorNumber: data.floorNumber
          ? parseInt(data.floorNumber)
          : undefined,
      });
    } else if (data.type === "arsa") {
      Object.assign(features, {
        landTopography: data.landTopography || undefined,
        landShape: data.landShape || undefined,
        frontage: data.frontage ? parseFloat(data.frontage) : undefined,
        depth: data.depth ? parseFloat(data.depth) : undefined,
        cornerPlot: data.cornerPlot,
        splitAllowed: data.splitAllowed,
        buildingPermit: data.buildingPermit,
        projectReady: data.projectReady,
        electricityNearby: data.electricityNearby,
        waterNearby: data.waterNearby,
        gasNearby: data.gasNearby,
        sewerNearby: data.sewerNearby,
        viewType: data.viewType || undefined,
        distanceToCenter: data.distanceToCenter || undefined,
        distanceToHighway: data.distanceToHighway || undefined,
        distanceToSchool: data.distanceToSchool || undefined,
        distanceToHospital: data.distanceToHospital || undefined,
        roadAccess: data.roadAccess || undefined,
        roadType: data.roadType || undefined,
      });
    }
    return features;
  };

  const onFormSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          transactionType: data.transactionType,
          address: data.address,
          district: data.district,
          neighborhood: data.neighborhood,
          area: parseInt(data.area),
          price: data.price,
          images,
          thumbnail: images[0] || null,
          status: data.status,
          metaTitle: data.metaTitle || data.title,
          metaDescription:
            data.metaDescription || data.description?.slice(0, 160),
          isFeatured: data.isFeatured,
          features: buildFeatures(data),
        }),
      });

      toast.success("İlan başarıyla oluşturuldu");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_IMAGES_KEY);
      router.push("/admin/ilanlar");
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") return;

      console.error("İlan oluşturma hatası:", error);

      if (error.details?.fieldErrors) {
        const fieldErrors = Object.entries(error.details.fieldErrors)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`)
          .join("\n");
        toast.error("Geçersiz veri", { description: fieldErrors });
      } else {
        toast.error(error.error || "İlan oluşturulurken hata oluştu");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ... header remains similar ... */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ilanlar"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
              Yeni İlan Oluştur
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Detaylı gayrimenkul ilanı ekleyin
            </p>
          </div>
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
            <Icon name="check_circle" className="text-lg" />
            <span>
              Taslak kaydedildi:{" "}
              {lastSaved.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Görseller */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="photo_library" className="text-emerald-400" /> İlan
            Görselleri
          </h3>
          <MultiImageUpload
            value={images}
            onChange={setImages}
            folder="listings"
            maxImages={15}
            label=""
          />
        </div>

        {/* Temel Bilgiler */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="info" className="text-emerald-400" /> Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="İlan Başlığı"
                {...register("title")}
                error={errors.title?.message}
                required
                placeholder="Örn: Hendek OSB Sanayi Arsası"
              />
            </div>
            <div>
              <SelectField
                label="İlan Tipi"
                {...register("type")}
                error={errors.type?.message}
                required
                options={[
                  { value: "konut", label: "🏠 Konut" },
                  { value: "sanayi", label: "🏭 Sanayi" },
                  { value: "tarim", label: "🌾 Tarım" },
                  { value: "ticari", label: "🏢 Ticari" },
                  { value: "arsa", label: "📐 Arsa" },
                ]}
              />
            </div>
            <div>
              <SelectField
                label="İşlem Tipi"
                {...register("transactionType")}
                error={errors.transactionType?.message}
                required
                options={[
                  { value: "sale", label: "Satılık" },
                  { value: "rent", label: "Kiralık" },
                ]}
              />
            </div>
            <div>
              <SelectField
                label="İlan Durumu"
                {...register("status")}
                error={errors.status?.message}
                required
                options={[
                  { value: "active", label: "Aktif (Sitede Görünür)" },
                  { value: "draft", label: "Taslak (Gizli)" },
                  { value: "pending", label: "Beklemede" },
                  { value: "sold", label: "Satıldı" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="location_on" className="text-emerald-400" /> Konum
            Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="Adres"
                {...register("address")}
                error={errors.address?.message}
                required
                placeholder="Tam adres"
              />
            </div>
            <SelectField
              label="İlçe"
              {...register("district")}
              error={errors.district?.message}
              options={DISTRICTS}
            />
            <InputField
              label="Mahalle/Köy"
              {...register("neighborhood")}
              error={errors.neighborhood?.message}
              placeholder="Mahalle adı"
            />
          </div>
        </div>

        {/* Fiyat & Alan */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="payments" className="text-emerald-400" /> Fiyat & Alan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Fiyat (₺)"
              {...register("price")}
              error={errors.price?.message}
              required
              placeholder="21500000"
            />
            <InputField
              label="Alan (m²)"
              {...register("area")}
              error={errors.area?.message}
              type="number"
              required
              placeholder="5000"
            />
          </div>
        </div>

        {/* Tapu & İmar */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="description" className="text-emerald-400" /> Tapu & İmar
            Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SelectField
              label="İmar Durumu"
              {...register("zoningStatus")}
              error={errors.zoningStatus?.message}
              options={ZONING_STATUS}
            />
            <SelectField
              label="Tapu Durumu"
              {...register("deedStatus")}
              error={errors.deedStatus?.message}
              options={DEED_STATUS}
            />
            <InputField
              label="Ada No"
              {...register("blockNo")}
              error={errors.blockNo?.message}
              placeholder="123"
            />
            <InputField
              label="Parsel No"
              {...register("parcelNo")}
              error={errors.parcelNo?.message}
              placeholder="45"
            />
          </div>
        </div>

        {/* Dynamic Sections */}
        {formData.type === "konut" && (
          <KonutFormSection register={register} errors={errors} watch={watch} control={control} />
        )}
        {formData.type === "sanayi" && (
          <SanayiFormSection register={register} errors={errors} watch={watch} control={control} />
        )}
        {formData.type === "tarim" && (
          <TarimFormSection register={register} errors={errors} watch={watch} control={control} />
        )}
        {formData.type === "ticari" && (
          <TicariFormSection register={register} errors={errors} watch={watch} control={control} />
        )}
        {formData.type === "arsa" && (
          <ArsaFormSection register={register} errors={errors} watch={watch} control={control} />
        )}

        {/* Açıklama + AI */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon name="edit_note" className="text-emerald-400" /> İlan
              Açıklaması
            </h3>
            <button
              type="button"
              onClick={generateAIDescription}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg"
            >
              {isGeneratingAI ? (
                <>
                  <Icon name="sync" className="animate-spin" /> AI Üretiyor...
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" /> AI ile Oluştur
                </>
              )}
            </button>
          </div>
          <textarea
            {...register("description")}
            rows={6}
            className={cn(
              "w-full bg-slate-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all resize-none",
              errors.description
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
            )}
            placeholder="İlan açıklaması... (AI ile otomatik oluşturabilirsiniz)"
          />
          {errors.description && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.description.message}</p>
          )}
          <p className="text-xs text-slate-500 mt-2 italic">
            💡 Tüm bilgileri girdikten sonra AI ile profesyonel açıklama
            oluşturabilirsiniz.
          </p>
        </div>

        {/* SEO & Seçenekler */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="tune" className="text-emerald-400" /> SEO & Seçenekler
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <InputField
              label="Meta Başlık"
              {...register("metaTitle")}
              error={errors.metaTitle?.message}
              placeholder="SEO için özel başlık"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Meta Açıklama
              </label>
              <textarea
                {...register("metaDescription")}
                rows={2}
                className={cn(
                  "w-full bg-slate-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all resize-none",
                  errors.metaDescription
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
                )}
                placeholder="SEO için özel açıklama"
              />
              {errors.metaDescription && (
                <p className="text-xs font-medium text-red-500">{errors.metaDescription.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl transition-all hover:border-amber-500/40 group">
              <input
                type="checkbox"
                id="isFeatured"
                {...register("isFeatured")}
                className="w-5 h-5 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="flex items-center gap-3 cursor-pointer flex-1">
                <Icon name="star" className="text-amber-400 group-hover:scale-110 transition-transform" filled />
                <div>
                  <span className="text-white font-bold text-sm tracking-wide">ÖNE ÇIKAN İLAN</span>
                  <p className="text-xs text-slate-500">
                    Ana sayfada ve listelerde öncelikli gösterilir
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/admin/ilanlar"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all active:scale-95"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Icon name="sync" className="animate-spin" /> İŞLENİYOR...
              </>
            ) : (
              <>
                <Icon name="save" /> İLANI KAYDET
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Co-pilot Assistant */}
      <ListingAIAssistant
        listingData={formData}
        onUpdateField={handleUpdateField}
      />
    </div>
  );
}
