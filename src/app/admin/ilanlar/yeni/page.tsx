"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { ListingAIAssistant } from "@/components/admin/ListingAIAssistant";
import { ListingType, TransactionType, ListingFormData } from "./_types";
import {
  DISTRICTS,
  HEATING_OPTIONS,
  FACADE_OPTIONS,
  FLOOR_TYPES,
  ZONING_STATUS,
  DEED_STATUS,
  SOIL_TYPES,
  CROP_TYPES,
} from "./_constants";
import {
  InputField,
  SelectField,
  CheckboxField,
} from "./_components/FormFields";
import { KonutFormSection } from "./_components/KonutFormSection";
import { SanayiFormSection } from "./_components/SanayiFormSection";
import { TarimFormSection } from "./_components/TarimFormSection";
import { TicariFormSection } from "./_components/TicariFormSection";
import { ArsaFormSection } from "./_components/ArsaFormSection";

const DRAFT_STORAGE_KEY = "listing-draft";
const DRAFT_IMAGES_KEY = "listing-draft-images";

export default function YeniIlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    const savedImages = localStorage.getItem(DRAFT_IMAGES_KEY);

    if (savedDraft) {
      setHasDraft(true);
      const shouldRestore = confirm(
        "Kaydedilmemiş bir taslak bulundu. Kaldığınız yerden devam etmek ister misiniz?",
      );

      if (shouldRestore) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          if (savedImages) {
            setImages(JSON.parse(savedImages));
          }
          setLastSaved(new Date());
        } catch (error) {
          console.error("Taslak yüklenemedi:", error);
        }
      } else {
        // Clear draft if user doesn't want to restore
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_IMAGES_KEY);
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "konut" as ListingType,
    transactionType: "sale" as TransactionType,
    address: "",
    district: "Hendek",
    neighborhood: "",
    area: "",
    price: "",
    zoningStatus: "",
    deedStatus: "",
    parcelNo: "",
    blockNo: "",
    rooms: "",
    livingRooms: "",
    bathrooms: "",
    balconies: "",
    floorNumber: "",
    totalFloors: "",
    buildingAge: "",
    grossArea: "",
    netArea: "",
    heating: "",
    facade: "",
    floorType: "",
    furnished: false,
    parking: false,
    parkingCount: "",
    garden: false,
    gardenArea: "",
    pool: false,
    elevator: false,
    security: false,
    doorman: false,
    intercom: false,
    satellite: false,
    cableTV: false,
    internet: false,
    airConditioning: false,
    fireplace: false,
    jacuzzi: false,
    sauna: false,
    gym: false,
    playroom: false,
    cellar: false,
    terrace: false,
    balcony: false,
    dressing: false,
    laundryRoom: false,
    parentBathroom: false,
    kitchenType: "",
    windowType: "",
    infrastructure: false,
    electricity: false,
    electricityPower: "",
    threePhase: false,
    water: false,
    naturalGas: false,
    sewage: false,
    roadAccess: "",
    roadType: "",
    ceilingHeight: "",
    loadingRamp: false,
    craneSystem: false,
    craneCapacity: "",
    officeArea: "",
    openArea: "",
    closedArea: "",
    securityRoom: false,
    fireSystem: false,
    treeCount: "",
    treeAge: "",
    cropType: "",
    irrigation: false,
    irrigationType: "",
    waterSource: "",
    organic: false,
    organicCertificate: "",
    soilType: "",
    slope: "",
    fenced: false,
    warehouse: false,
    warehouseArea: "",
    well: false,
    wellDepth: "",
    annualYield: "",
    shopWidth: "",
    shopDepth: "",
    showcaseCount: "",
    cornerShop: false,
    mainStreet: false,
    mallLocation: false,
    suitableFor: "",
    currentTenant: "",
    monthlyRent: "",
    depositAmount: "",
    // Arsa özellikleri
    landTopography: "",
    landShape: "",
    frontage: "",
    depth: "",
    cornerPlot: false,
    splitAllowed: false,
    buildingPermit: false,
    projectReady: false,
    electricityNearby: false,
    waterNearby: false,
    gasNearby: false,
    sewerNearby: false,
    viewType: "",
    distanceToCenter: "",
    distanceToHighway: "",
    distanceToSchool: "",
    distanceToHospital: "",
    metaTitle: "",
    metaDescription: "",
    isFeatured: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if there's meaningful data
      if (formData.title || formData.description || formData.price) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem(DRAFT_IMAGES_KEY, JSON.stringify(images));
        setLastSaved(new Date());
      }
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timer);
  }, [formData, images]);

  const generateAIDescription = async () => {
    if (!formData.title || !formData.area || !formData.price) {
      alert("AI açıklama üretmek için başlık, alan ve fiyat gereklidir.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          area: parseInt(formData.area),
          price: parseInt(formData.price),
        }),
      });
      if (!response.ok) throw new Error("AI açıklama üretilemedi");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, description: data.description }));
    } catch (error) {
      console.error("AI hatası:", error);
      alert("AI açıklama üretilirken hata oluştu.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const buildFeatures = () => {
    const features: Record<string, unknown> = {
      zoningStatus: formData.zoningStatus || undefined,
      deedStatus: formData.deedStatus || undefined,
      parcelNo: formData.parcelNo || undefined,
      blockNo: formData.blockNo || undefined,
    };
    if (formData.type === "konut") {
      Object.assign(features, {
        rooms: formData.rooms || undefined,
        livingRooms: formData.livingRooms
          ? parseInt(formData.livingRooms)
          : undefined,
        bathrooms: formData.bathrooms
          ? parseInt(formData.bathrooms)
          : undefined,
        balconies: formData.balconies
          ? parseInt(formData.balconies)
          : undefined,
        floorNumber: formData.floorNumber
          ? parseInt(formData.floorNumber)
          : undefined,
        totalFloors: formData.totalFloors
          ? parseInt(formData.totalFloors)
          : undefined,
        buildingAge: formData.buildingAge
          ? parseInt(formData.buildingAge)
          : undefined,
        grossArea: formData.grossArea
          ? parseInt(formData.grossArea)
          : undefined,
        netArea: formData.netArea ? parseInt(formData.netArea) : undefined,
        heating: formData.heating || undefined,
        facade: formData.facade || undefined,
        floorType: formData.floorType || undefined,
        kitchenType: formData.kitchenType || undefined,
        windowType: formData.windowType || undefined,
        furnished: formData.furnished,
        parking: formData.parking,
        parkingCount: formData.parkingCount
          ? parseInt(formData.parkingCount)
          : undefined,
        garden: formData.garden,
        gardenArea: formData.gardenArea
          ? parseInt(formData.gardenArea)
          : undefined,
        pool: formData.pool,
        elevator: formData.elevator,
        security: formData.security,
        doorman: formData.doorman,
        intercom: formData.intercom,
        satellite: formData.satellite,
        cableTV: formData.cableTV,
        internet: formData.internet,
        airConditioning: formData.airConditioning,
        fireplace: formData.fireplace,
        jacuzzi: formData.jacuzzi,
        sauna: formData.sauna,
        gym: formData.gym,
        playroom: formData.playroom,
        cellar: formData.cellar,
        terrace: formData.terrace,
        balcony: formData.balcony,
        dressing: formData.dressing,
        laundryRoom: formData.laundryRoom,
        parentBathroom: formData.parentBathroom,
      });
    } else if (formData.type === "sanayi") {
      Object.assign(features, {
        infrastructure: formData.infrastructure,
        electricity: formData.electricity,
        electricityPower: formData.electricityPower || undefined,
        threePhase: formData.threePhase,
        water: formData.water,
        naturalGas: formData.naturalGas,
        sewage: formData.sewage,
        roadAccess: formData.roadAccess || undefined,
        roadType: formData.roadType || undefined,
        ceilingHeight: formData.ceilingHeight
          ? parseFloat(formData.ceilingHeight)
          : undefined,
        loadingRamp: formData.loadingRamp,
        craneSystem: formData.craneSystem,
        craneCapacity: formData.craneCapacity || undefined,
        officeArea: formData.officeArea
          ? parseInt(formData.officeArea)
          : undefined,
        openArea: formData.openArea ? parseInt(formData.openArea) : undefined,
        closedArea: formData.closedArea
          ? parseInt(formData.closedArea)
          : undefined,
        securityRoom: formData.securityRoom,
        fireSystem: formData.fireSystem,
      });
    } else if (formData.type === "tarim") {
      Object.assign(features, {
        treeCount: formData.treeCount
          ? parseInt(formData.treeCount)
          : undefined,
        treeAge: formData.treeAge ? parseInt(formData.treeAge) : undefined,
        cropType: formData.cropType || undefined,
        irrigation: formData.irrigation,
        irrigationType: formData.irrigationType || undefined,
        waterSource: formData.waterSource || undefined,
        organic: formData.organic,
        organicCertificate: formData.organicCertificate || undefined,
        soilType: formData.soilType || undefined,
        slope: formData.slope || undefined,
        fenced: formData.fenced,
        warehouse: formData.warehouse,
        warehouseArea: formData.warehouseArea
          ? parseInt(formData.warehouseArea)
          : undefined,
        well: formData.well,
        wellDepth: formData.wellDepth
          ? parseInt(formData.wellDepth)
          : undefined,
        annualYield: formData.annualYield || undefined,
      });
    } else if (formData.type === "ticari") {
      Object.assign(features, {
        shopWidth: formData.shopWidth
          ? parseFloat(formData.shopWidth)
          : undefined,
        shopDepth: formData.shopDepth
          ? parseFloat(formData.shopDepth)
          : undefined,
        showcaseCount: formData.showcaseCount
          ? parseInt(formData.showcaseCount)
          : undefined,
        cornerShop: formData.cornerShop,
        mainStreet: formData.mainStreet,
        mallLocation: formData.mallLocation,
        suitableFor: formData.suitableFor || undefined,
        currentTenant: formData.currentTenant || undefined,
        monthlyRent: formData.monthlyRent || undefined,
        depositAmount: formData.depositAmount || undefined,
        parking: formData.parking,
        elevator: formData.elevator,
        security: formData.security,
        totalFloors: formData.totalFloors
          ? parseInt(formData.totalFloors)
          : undefined,
        floorNumber: formData.floorNumber
          ? parseInt(formData.floorNumber)
          : undefined,
      });
    } else if (formData.type === "arsa") {
      Object.assign(features, {
        landTopography: formData.landTopography || undefined,
        landShape: formData.landShape || undefined,
        frontage: formData.frontage ? parseFloat(formData.frontage) : undefined,
        depth: formData.depth ? parseFloat(formData.depth) : undefined,
        cornerPlot: formData.cornerPlot,
        splitAllowed: formData.splitAllowed,
        buildingPermit: formData.buildingPermit,
        projectReady: formData.projectReady,
        electricityNearby: formData.electricityNearby,
        waterNearby: formData.waterNearby,
        gasNearby: formData.gasNearby,
        sewerNearby: formData.sewerNearby,
        viewType: formData.viewType || undefined,
        distanceToCenter: formData.distanceToCenter || undefined,
        distanceToHighway: formData.distanceToHighway || undefined,
        distanceToSchool: formData.distanceToSchool || undefined,
        distanceToHospital: formData.distanceToHospital || undefined,
        roadAccess: formData.roadAccess || undefined,
        roadType: formData.roadType || undefined,
      });
    }
    return features;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          transactionType: formData.transactionType,
          address: formData.address,
          district: formData.district,
          neighborhood: formData.neighborhood,
          area: parseInt(formData.area),
          price: formData.price,
          images,
          thumbnail: images[0] || null,
          metaTitle: formData.metaTitle || formData.title,
          metaDescription:
            formData.metaDescription || formData.description?.slice(0, 160),
          isFeatured: formData.isFeatured,
          features: buildFeatures(),
        }),
      });
      if (response.ok) {
        // Clear draft after successful submission
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_IMAGES_KEY);
        router.push("/admin/ilanlar");
      } else {
        const error = await response.json();
        console.error("Validation error:", error);

        // Validation hatalarını kullanıcıya göster
        if (error.details?.fieldErrors) {
          const fieldErrors = Object.entries(error.details.fieldErrors)
            .map(
              ([field, errors]) =>
                `${field}: ${(errors as string[]).join(", ")}`,
            )
            .join("\n");
          alert(`Geçersiz veri:\n\n${fieldErrors}`);
        } else {
          alert(error.error || "İlan oluşturulurken hata oluştu");
        }
      }
    } catch (error) {
      console.error("İlan oluşturma hatası:", error);
      alert("İlan oluşturulurken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Görseller */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="info" className="text-emerald-400" /> Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="İlan Başlığı"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Örn: Hendek OSB Sanayi Arsası"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                İlan Tipi *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="konut">🏠 Konut</option>
                <option value="sanayi">🏭 Sanayi</option>
                <option value="tarim">🌾 Tarım</option>
                <option value="ticari">🏢 Ticari</option>
                <option value="arsa">📐 Arsa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                İşlem Tipi *
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="sale">Satılık</option>
                <option value="rent">Kiralık</option>
              </select>
            </div>
          </div>
        </div>

        {/* Konum */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="location_on" className="text-emerald-400" /> Konum
            Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="Adres"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Tam adres"
              />
            </div>
            <SelectField
              label="İlçe"
              name="district"
              value={formData.district}
              onChange={handleChange}
              options={DISTRICTS}
            />
            <InputField
              label="Mahalle/Köy"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              placeholder="Mahalle adı"
            />
          </div>
        </div>

        {/* Fiyat & Alan */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="payments" className="text-emerald-400" /> Fiyat & Alan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Fiyat (₺)"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="21500000"
            />
            <InputField
              label="Alan (m²)"
              name="area"
              value={formData.area}
              onChange={handleChange}
              type="number"
              required
              placeholder="5000"
            />
          </div>
        </div>

        {/* Tapu & İmar */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="description" className="text-emerald-400" /> Tapu & İmar
            Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SelectField
              label="İmar Durumu"
              name="zoningStatus"
              value={formData.zoningStatus}
              onChange={handleChange}
              options={ZONING_STATUS}
            />
            <SelectField
              label="Tapu Durumu"
              name="deedStatus"
              value={formData.deedStatus}
              onChange={handleChange}
              options={DEED_STATUS}
            />
            <InputField
              label="Ada No"
              name="blockNo"
              value={formData.blockNo}
              onChange={handleChange}
              placeholder="123"
            />
            <InputField
              label="Parsel No"
              name="parcelNo"
              value={formData.parcelNo}
              onChange={handleChange}
              placeholder="45"
            />
          </div>
        </div>

        {/* KONUT */}
        {formData.type === "konut" && (
          <KonutFormSection formData={formData} handleChange={handleChange} />
        )}
        {/* SANAYİ */}
        {formData.type === "sanayi" && (
          <SanayiFormSection formData={formData} handleChange={handleChange} />
        )}

        {/* TARIM */}
        {formData.type === "tarim" && (
          <TarimFormSection formData={formData} handleChange={handleChange} />
        )}

        {/* TİCARİ */}
        {formData.type === "ticari" && (
          <TicariFormSection formData={formData} handleChange={handleChange} />
        )}

        {/* ARSA */}
        {formData.type === "arsa" && (
          <ArsaFormSection formData={formData} handleChange={handleChange} />
        )}

        {/* Açıklama + AI */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
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
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="İlan açıklaması... (AI ile otomatik oluşturabilirsiniz)"
          />
          <p className="text-xs text-slate-500 mt-2">
            💡 Tüm bilgileri girdikten sonra AI ile profesyonel açıklama
            oluşturabilirsiniz.
          </p>
        </div>

        {/* SEO & Seçenekler */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="tune" className="text-emerald-400" /> SEO & Seçenekler
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <InputField
              label="Meta Başlık"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              placeholder="SEO için özel başlık"
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Meta Açıklama
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="SEO için özel açıklama"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-amber-500 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              <Icon name="star" className="text-amber-400" filled />
              <div>
                <span className="text-white font-medium">Öne Çıkan İlan</span>
                <p className="text-xs text-slate-400">
                  Ana sayfada ve listelerde öncelikli gösterilir
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/ilanlar"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <>
                <Icon name="sync" className="animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Icon name="save" /> İlanı Kaydet
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Co-pilot Assistant */}
      <ListingAIAssistant
        listingData={formData}
        onUpdateField={(name, value) => {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }}
      />
    </div>
  );
}
