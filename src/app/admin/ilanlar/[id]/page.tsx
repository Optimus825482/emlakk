"use client";

import { useState, useEffect, use, useCallback } from "react";
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditIlanPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [selectedPlatform, setSelectedPlatform] = useState<
    "instagram" | "twitter" | "linkedin" | "facebook"
  >("instagram");
  const [generatedContent, setGeneratedContent] = useState<{
    content: string;
    hashtags: string[];
    seoTags: string[];
  } | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  const [marketResearch, setMarketResearch] = useState<{
    summary: string;
    priceAnalysis: { trend: string; averageRange: string };
    demandAnalysis: { level: string; hotAreas: string[] };
    opportunities: string[];
    recommendations: string[];
    source: string;
  } | null>(null);
  const [showResearchModal, setShowResearchModal] = useState(false);

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
  });

  const formData = watch();

  const handleUpdateField = useCallback((name: string, value: string) => {
    setValue(name as any, value);
  }, [setValue]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiFetch(`/api/listings/${id}`);
        if (!response.success) {
          throw new Error(response.error?.message || "İlan yüklenemedi");
        }
        const data = response.data as any;
        const f = data.features || {};

        const mappedData: Partial<ListingFormData> = {
          title: data.title || "",
          description: data.description || "",
          type: data.type || "konut",
          status: data.status || "draft",
          transactionType: data.transactionType || "sale",
          address: data.address || "",
          district: data.district || "Hendek",
          neighborhood: data.neighborhood || "",
          area: data.area?.toString() || "",
          price: data.price?.toString() || "",
          zoningStatus: f.zoningStatus || "",
          deedStatus: f.deedStatus || "",
          parcelNo: f.ParcelNo || "",
          blockNo: f.blockNo || "",
          rooms: f.rooms || "",
          livingRooms: f.livingRooms?.toString() || "",
          bathrooms: f.bathrooms?.toString() || "",
          balconies: f.balconies?.toString() || "",
          floorNumber: f.floorNumber?.toString() || "",
          totalFloors: f.totalFloors?.toString() || "",
          buildingAge: f.buildingAge?.toString() || "",
          grossArea: f.grossArea?.toString() || "",
          netArea: f.netArea?.toString() || "",
          heating: f.heating || "",
          facade: f.facade || "",
          floorType: f.floorType || "",
          kitchenType: f.kitchenType || "",
          windowType: f.windowType || "",
          furnished: !!f.furnished,
          parking: !!f.parking,
          parkingCount: f.parkingCount?.toString() || "",
          garden: !!f.garden,
          gardenArea: f.gardenArea?.toString() || "",
          pool: !!f.pool,
          elevator: !!f.elevator,
          security: !!f.security,
          doorman: !!f.doorman,
          intercom: !!f.intercom,
          satellite: !!f.satellite,
          cableTV: !!f.cableTV,
          internet: !!f.internet,
          airConditioning: !!f.airConditioning,
          fireplace: !!f.fireplace,
          jacuzzi: !!f.jacuzzi,
          sauna: !!f.sauna,
          gym: !!f.gym,
          playroom: !!f.playroom,
          cellar: !!f.cellar,
          terrace: !!f.terrace,
          balcony: !!f.balcony,
          dressing: !!f.dressing,
          laundryRoom: !!f.laundryRoom,
          parentBathroom: !!f.parentBathroom,

          // Yeni özellikler (OZZ.HTML'den)
          facadeWest: !!f.facadeWest,
          facadeEast: !!f.facadeEast,
          facadeSouth: !!f.facadeSouth,
          facadeNorth: !!f.facadeNorth,
          aluminumFrames: !!f.aluminumFrames,
          americanDoor: !!f.americanDoor,
          builtInOven: !!f.builtInOven,
          barbecue: !!f.barbecue,
          whiteGoods: !!f.whiteGoods,
          painted: !!f.painted,
          dishwasher: !!f.dishwasher,
          refrigerator: !!f.refrigerator,
          dryingMachine: !!f.dryingMachine,
          washingMachine: !!f.washingMachine,
          steelDoor: !!f.steelDoor,
          showerCabin: !!f.showerCabin,
          wallpaper: !!f.wallpaper,
          oven: !!f.oven,
          builtInWardrobe: !!f.builtInWardrobe,
          videoIntercom: !!f.videoIntercom,
          intercomSystem: !!f.intercomSystem,
          doubleGlazing: !!f.doubleGlazing,
          molding: !!f.molding,
          pantry: !!f.pantry,
          bathtub: !!f.bathtub,
          laminateFlooring: !!f.laminateFlooring,
          furniture: !!f.furniture,
          builtInKitchen: !!f.builtInKitchen,
          laminateKitchen: !!f.laminateKitchen,
          kitchenGas: !!f.kitchenGas,
          blinds: !!f.blinds,
          parquetFlooring: !!f.parquetFlooring,
          pvcFrames: !!f.pvcFrames,
          ceramicFlooring: !!f.ceramicFlooring,
          cooktop: !!f.cooktop,
          spotLighting: !!f.spotLighting,
          waterHeater: !!f.waterHeater,
          thermosiphon: !!f.thermosiphon,
          chargingStation: !!f.chargingStation,
          security24: !!f.security24,
          buildingAttendant: !!f.buildingAttendant,
          playground: !!f.playground,
          thermalInsulation: !!f.thermalInsulation,
          generator: !!f.generator,
          privatePool: !!f.privatePool,
          siding: !!f.siding,
          sportsArea: !!f.sportsArea,
          waterTank: !!f.waterTank,
          fireEscape: !!f.fireEscape,
          outdoorPool: !!f.outdoorPool,
          indoorPool: !!f.indoorPool,
          shoppingMall: !!f.shoppingMall,
          municipality: !!f.municipality,
          mosque: !!f.mosque,
          cemevi: !!f.cemevi,
          beachfront: !!f.beachfront,
          pharmacy: !!f.pharmacy,
          entertainmentCenter: !!f.entertainmentCenter,
          hospital: !!f.hospital,
          primarySchool: !!f.primarySchool,
          fireStation: !!f.fireStation,
          highSchool: !!f.highSchool,
          market: !!f.market,
          park: !!f.park,
          policeStation: !!f.policeStation,
          healthCenter: !!f.healthCenter,
          weeklyMarket: !!f.weeklyMarket,
          sportsCenter: !!f.sportsCenter,
          cityCenter: !!f.cityCenter,
          university: !!f.university,
          mainRoad: !!f.mainRoad,
          avenue: !!f.avenue,
          dolmus: !!f.dolmus,
          e5: !!f.e5,
          minibus: !!f.minibus,
          busStop: !!f.busStop,
          tem: !!f.tem,
          duplex: !!f.duplex,
          topFloor: !!f.topFloor,
          middleFloor: !!f.middleFloor,
          middleFloorDuplex: !!f.middleFloorDuplex,
          gardenDuplex: !!f.gardenDuplex,
          roofDuplex: !!f.roofDuplex,
          fourplex: !!f.fourplex,
          reverseDuplex: !!f.reverseDuplex,
          triplex: !!f.triplex,

          infrastructure: !!f.infrastructure,
          electricity: !!f.electricity,
          electricityPower: f.electricityPower || "",
          threePhase: !!f.threePhase,
          water: !!f.water,
          naturalGas: !!f.naturalGas,
          sewage: !!f.sewage,
          roadAccess: f.roadAccess || "",
          roadType: f.roadType || "",
          ceilingHeight: f.ceilingHeight?.toString() || "",
          loadingRamp: !!f.loadingRamp,
          craneSystem: !!f.craneSystem,
          craneCapacity: f.craneCapacity || "",
          officeArea: f.officeArea?.toString() || "",
          openArea: f.openArea?.toString() || "",
          closedArea: f.closedArea?.toString() || "",
          securityRoom: !!f.securityRoom,
          fireSystem: !!f.fireSystem,
          treeCount: f.treeCount?.toString() || "",
          treeAge: f.treeAge?.toString() || "",
          cropType: f.cropType || "",
          irrigation: !!f.irrigation,
          irrigationType: f.irrigationType || "",
          waterSource: f.waterSource || "",
          organic: !!f.organic,
          organicCertificate: f.organicCertificate || "",
          soilType: f.soilType || "",
          slope: f.slope || "",
          fenced: !!f.fenced,
          warehouse: !!f.warehouse,
          warehouseArea: f.warehouseArea?.toString() || "",
          well: !!f.well,
          wellDepth: f.wellDepth?.toString() || "",
          annualYield: f.annualYield || "",
          shopWidth: f.shopWidth?.toString() || "",
          shopDepth: f.shopDepth?.toString() || "",
          showcaseCount: f.showcaseCount?.toString() || "",
          cornerShop: !!f.cornerShop,
          mainStreet: !!f.mainStreet,
          mallLocation: !!f.mallLocation,
          suitableFor: f.suitableFor || "",
          currentTenant: f.currentTenant || "",
          monthlyRent: f.monthlyRent || "",
          depositAmount: f.depositAmount || "",
          landTopography: f.landTopography || "",
          landShape: f.landShape || "",
          frontage: f.frontage?.toString() || "",
          depth: f.depth?.toString() || "",
          cornerPlot: !!f.cornerPlot,
          splitAllowed: !!f.splitAllowed,
          buildingPermit: !!f.buildingPermit,
          projectReady: !!f.projectReady,
          electricityNearby: !!f.electricityNearby,
          waterNearby: !!f.waterNearby,
          gasNearby: !!f.gasNearby,
          sewerNearby: !!f.sewerNearby,
          viewType: f.viewType || "",
          distanceToCenter: f.distanceToCenter || "",
          distanceToHighway: f.distanceToHighway || "",
          distanceToSchool: f.distanceToSchool || "",
          distanceToHospital: f.distanceToHospital || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          isFeatured: !!data.isFeatured,
        };

        reset(mappedData);
        setImages(data.images || []);
      } catch (error: any) {
        if (error.message === "RATE_LIMIT_EXCEEDED") return;
        console.error("İlan yüklenirken hata:", error);
        toast.error("İlan yüklenemedi");
        router.push("/admin/ilanlar");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, router, reset]);

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
      toast.error("AI hatası");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateSocialContent = async () => {
    if (!formData.title || !formData.price) {
      toast.error("Eksik bilgi", { description: "İçerik üretmek için en az başlık ve fiyat gereklidir." });
      return;
    }
    setIsGeneratingContent(true);
    setGeneratedContent(null);
    try {
      const response = await apiFetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingTitle: formData.title,
          listingDescription: formData.description,
          price: parseInt(formData.price),
          location: `${formData.neighborhood || ""} ${formData.district}`.trim(),
          propertyType: formData.type,
          platform: selectedPlatform,
          features: [
            formData.area ? `${formData.area} m²` : null,
            formData.rooms ? `${formData.rooms} oda` : null,
            formData.zoningStatus || null,
          ].filter(Boolean),
        }),
      });
      if (!response.success) throw new Error(response.error?.message || "İçerik üretilemedi");
      const data = response.data as any;
      setGeneratedContent({
        content: data.content,
        hashtags: data.hashtags,
        seoTags: data.seoTags,
      });
      setShowContentModal(true);
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") return;
      console.error("Content Agent hatası:", error);
      toast.error("İçerik üretilemedi");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const runMarketResearch = async () => {
    setIsResearching(true);
    setMarketResearch(null);
    try {
      const response = await apiFetch("/api/ai/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: `${formData.neighborhood || ""} ${formData.district}`.trim() || "Hendek, Sakarya",
          propertyType: formData.type,
          focusAreas: ["fiyat", "trend", "talep", "rekabet"],
          mode: "auto",
        }),
      });
      if (!response.success) throw new Error(response.error?.message || "Pazar araştırması başarısız");
      const data = response.data as any;
      setMarketResearch({
        summary: data.analysis?.summary || "Analiz tamamlandı",
        priceAnalysis: data.analysis?.priceAnalysis || { trend: "-", averageRange: "-" },
        demandAnalysis: data.analysis?.demandAnalysis || { level: "orta", hotAreas: [] },
        opportunities: data.analysis?.opportunities || [],
        recommendations: data.analysis?.recommendations || [],
        source: data.source || "unknown",
      });
      setShowResearchModal(true);
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") return;
      console.error("Pazar araştırması hatası:", error);
      toast.error("Pazar araştırması başarısız");
    } finally {
      setIsResearching(false);
    }
  };

  const buildFeatures = (data: ListingFormData) => {
    const features: Record<string, unknown> = {
      zoningStatus: data.zoningStatus || undefined,
      deedStatus: data.deedStatus || undefined,
      parcelNo: data.parcelNo || undefined,
      blockNo: data.blockNo || undefined,
    };

    // Type specific logic from yeni/page.tsx
    if (data.type === "konut") {
      Object.assign(features, {
        rooms: data.rooms || undefined,
        livingRooms: data.livingRooms ? parseInt(data.livingRooms) : undefined,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : undefined,
        balconies: data.balconies ? parseInt(data.balconies) : undefined,
        floorNumber: data.floorNumber ? parseInt(data.floorNumber) : undefined,
        totalFloors: data.totalFloors ? parseInt(data.totalFloors) : undefined,
        buildingAge: data.buildingAge ? parseInt(data.buildingAge) : undefined,
        grossArea: data.grossArea ? parseInt(data.grossArea) : undefined,
        netArea: data.netArea ? parseInt(data.netArea) : undefined,
        heating: data.heating || undefined,
        facade: data.facade || undefined,
        floorType: data.floorType || undefined,
        kitchenType: data.kitchenType || undefined,
        windowType: data.windowType || undefined,
        furnished: data.furnished,
        parking: data.parking,
        parkingCount: data.parkingCount ? parseInt(data.parkingCount) : undefined,
        garden: data.garden,
        gardenArea: data.gardenArea ? parseInt(data.gardenArea) : undefined,
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
        ceilingHeight: data.ceilingHeight ? parseFloat(data.ceilingHeight) : undefined,
        loadingRamp: data.loadingRamp,
        craneSystem: data.craneSystem,
        craneCapacity: data.craneCapacity || undefined,
        officeArea: data.officeArea ? parseInt(data.officeArea) : undefined,
        openArea: data.openArea ? parseInt(data.openArea) : undefined,
        closedArea: data.closedArea ? parseInt(data.closedArea) : undefined,
        securityRoom: data.securityRoom,
        fireSystem: data.fireSystem,
      });
    } else if (data.type === "tarim") {
      Object.assign(features, {
        treeCount: data.treeCount ? parseInt(data.treeCount) : undefined,
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
        warehouseArea: data.warehouseArea ? parseInt(data.warehouseArea) : undefined,
        well: data.well,
        wellDepth: data.wellDepth ? parseInt(data.wellDepth) : undefined,
        annualYield: data.annualYield || undefined,
      });
    } else if (data.type === "ticari") {
      Object.assign(features, {
        shopWidth: data.shopWidth ? parseFloat(data.shopWidth) : undefined,
        shopDepth: data.shopDepth ? parseFloat(data.shopDepth) : undefined,
        showcaseCount: data.showcaseCount ? parseInt(data.showcaseCount) : undefined,
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
        totalFloors: data.totalFloors ? parseInt(data.totalFloors) : undefined,
        floorNumber: data.floorNumber ? parseInt(data.floorNumber) : undefined,
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
      await apiFetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          transactionType: data.transactionType,
          address: data.address,
          district: data.district,
          neighborhood: data.neighborhood,
          area: parseInt(data.area),
          price: data.price,
          images,
          thumbnail: images[0] || null,
          metaTitle: data.metaTitle || data.title,
          metaDescription: data.metaDescription || data.description?.slice(0, 160),
          isFeatured: data.isFeatured,
          features: buildFeatures(data),
        }),
      });

      toast.success("İlan başarıyla güncellendi");
      router.push("/admin/ilanlar");
      router.refresh();
    } catch (error: any) {
      if (error.message === "RATE_LIMIT_EXCEEDED") return;
      console.error("İlan güncelleme hatası:", error);
      toast.error(error.error || "İlan güncellenirken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon name="sync" className="text-emerald-400 text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
              İlan Düzenle
            </h2>
            <p className="text-slate-400 text-sm mt-1">{formData.title}</p>
          </div>
        </div>
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
                label="İlan Durumu"
                {...register("status")}
                error={errors.status?.message}
                required
                options={[
                  { value: "active", label: "Aktif" },
                  { value: "draft", label: "Taslak" },
                  { value: "pending", label: "Beklemede" },
                  { value: "sold", label: "Satıldı" },
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
            />
            <InputField
              label="Alan (m²)"
              {...register("area")}
              error={errors.area?.message}
              type="number"
              required
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
            />
            <InputField
              label="Parsel No"
              {...register("parcelNo")}
              error={errors.parcelNo?.message}
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
            placeholder="İlan açıklaması..."
          />
          {errors.description && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* 🤖 Content Agent - Sosyal Medya İçerik Üretimi */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="auto_awesome" className="text-purple-400" />
            AI Content Agent - Sosyal Medya İçeriği
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Bu ilan için otomatik sosyal medya paylaşım içeriği oluşturun
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { id: "instagram", label: "Instagram", icon: "photo_camera", color: "pink" },
              { id: "twitter", label: "Twitter/X", icon: "alternate_email", color: "sky" },
              { id: "linkedin", label: "LinkedIn", icon: "work", color: "blue" },
              { id: "facebook", label: "Facebook", icon: "groups", color: "indigo" },
            ].map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => setSelectedPlatform(platform.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                  selectedPlatform === platform.id
                    ? "bg-slate-700 border-white/20 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <Icon name={platform.icon} className="text-sm" />
                {platform.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={generateSocialContent}
            disabled={isGeneratingContent || !formData.title}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {isGeneratingContent ? (
              <><Icon name="sync" className="animate-spin" /> İçerik Üretiliyor...</>
            ) : (
              <><Icon name="auto_fix_high" /> {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} İçeriği Üret</>
            )}
          </button>
        </div>

        {/* 📊 Pazar Araştırması */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="insights" className="text-cyan-400" />
            Pazar Araştırması - Sosyal Medya Analizi
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {formData.district || "Hendek"} bölgesi için sosyal medya ve emlak sitelerinden güncel pazar analizi yapın
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runMarketResearch}
              disabled={isResearching}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {isResearching ? (
                <><Icon name="sync" className="animate-spin" /> Araştırılıyor...</>
              ) : (
                <><Icon name="travel_explore" /> Pazar Analizi Yap</>
              )}
            </button>

            {marketResearch && (
              <button
                type="button"
                onClick={() => setShowResearchModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                <Icon name="visibility" /> Son Raporu Göster
              </button>
            )}
          </div>
        </div>

        {/* SEO Optimizasyonu */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon name="search" className="text-blue-400" /> SEO & Meta Optimizasyonu
              </h3>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!formData.title || !formData.description) {
                  toast.error("Başlık ve açıklama gereklidir");
                  return;
                }
                setIsGeneratingAI(true);
                try {
                  const response = await apiFetch("/api/ai/generate-seo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: formData.title,
                      description: formData.description,
                      type: formData.type,
                      location: `${formData.neighborhood || ""} ${formData.district}`.trim(),
                      price: formData.price,
                      area: formData.area,
                    }),
                  });
                  if (!response.success) throw new Error(response.error?.message || "SEO üretilemedi");
                  const data = response.data as any;
                  setValue("metaTitle", data.metaTitle);
                  setValue("metaDescription", data.metaDescription);
                  toast.success("SEO içerikleri üretildi");
                } catch (error: any) {
                  if (error.message === "RATE_LIMIT_EXCEEDED") return;
                  toast.error("SEO üretilemedi");
                } finally {
                  setIsGeneratingAI(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Icon name="auto_awesome" /> AI SEO Oluştur
            </button>
          </div>

          <div className="space-y-4">
            <InputField label="Meta Başlık" {...register("metaTitle")} placeholder="SEO Başlığı" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Meta Açıklama</label>
              <textarea
                {...register("metaDescription")}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="SEO Açıklaması"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-all">
              <input
                type="checkbox"
                {...register("isFeatured")}
                className="w-5 h-5 rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              <Icon name="star" className="text-amber-400" filled />
              <div>
                <span className="text-white font-bold text-sm">ÖNE ÇIKAN İLAN</span>
                <p className="text-xs text-slate-500">Ana sayfada ve listelerde öncelikli gösterilir</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/admin/ilanlar"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <><Icon name="sync" className="animate-spin" /> İŞLENİYOR...</>
            ) : (
              <><Icon name="save" /> DEĞİŞİKLİKLERİ KAYDET</>
            )}
          </button>
        </div>
      </form>

      {/* Modals - Simplified for brevity but keeping logic */}
      {showContentModal && generatedContent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon name="auto_awesome" className="text-purple-400" /> {selectedPlatform.toUpperCase()} İçeriği
              </h3>
              <button onClick={() => setShowContentModal(false)} className="text-slate-400 hover:text-white"><Icon name="close" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <p className="text-white whitespace-pre-wrap">{generatedContent.content}</p>
                <p className="text-purple-400 mt-4">{generatedContent.hashtags.map(h => `#${h}`).join(" ")}</p>
              </div>
              <button
                onClick={() => copyToClipboard(generatedContent.content + "\n\n" + generatedContent.hashtags.map(h => `#${h}`).join(" "))}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold"
              >
                Tümünü Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {showResearchModal && marketResearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Pazar Analizi: {formData.district}</h3>
              <button onClick={() => setShowResearchModal(false)} className="text-slate-400 hover:text-white"><Icon name="close" /></button>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-900 p-4 rounded-lg"><h4 className="text-cyan-400 font-bold mb-2">Özet</h4><p className="text-slate-300">{marketResearch.summary}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg"><p className="text-slate-500 text-xs">Fiyat Trendi</p><p className="text-lg font-bold text-emerald-400">{marketResearch.priceAnalysis.trend}</p></div>
                <div className="bg-slate-900 p-4 rounded-lg"><p className="text-slate-500 text-xs">Talep</p><p className="text-lg font-bold text-blue-400">{marketResearch.demandAnalysis.level}</p></div>
              </div>
              {marketResearch.opportunities.length > 0 && (
                <div><h4 className="text-emerald-400 font-bold mb-2">Fırsatlar</h4><ul className="list-disc list-inside text-slate-300">{marketResearch.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Co-pilot Assistant */}
      <ListingAIAssistant
        listingData={formData}
        onUpdateField={handleUpdateField}
      />
    </div>
  );
}