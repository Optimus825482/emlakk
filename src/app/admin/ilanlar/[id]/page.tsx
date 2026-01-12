"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";

type ListingType = "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
type TransactionType = "sale" | "rent";
type ListingStatus = "active" | "sold" | "pending" | "draft";

const DISTRICTS = [
  "Hendek",
  "Adapazarı",
  "Akyazı",
  "Arifiye",
  "Erenler",
  "Ferizli",
  "Geyve",
  "Karapürçek",
  "Karasu",
  "Kaynarca",
  "Kocaali",
  "Pamukova",
  "Sapanca",
  "Serdivan",
  "Söğütlü",
  "Taraklı",
];

const HEATING_OPTIONS = [
  "Doğalgaz (Kombi)",
  "Merkezi Sistem",
  "Yerden Isıtma",
  "Klima",
  "Soba",
  "Şömine",
  "Güneş Enerjisi",
  "Isı Pompası",
  "Yok",
];
const FACADE_OPTIONS = [
  "Kuzey",
  "Güney",
  "Doğu",
  "Batı",
  "Güneydoğu",
  "Güneybatı",
  "Kuzeydoğu",
  "Kuzeybatı",
];
const FLOOR_TYPES = [
  "Laminat",
  "Seramik",
  "Parke",
  "Mermer",
  "Granit",
  "Halı",
  "Beton",
  "Epoksi",
];
const ZONING_STATUS = [
  "Konut İmarlı",
  "Ticari İmarlı",
  "Sanayi İmarlı",
  "Tarım Arazisi",
  "2B",
  "Orman",
  "Sit Alanı",
  "İmarsız",
];
const DEED_STATUS = [
  "Kat Mülkiyetli",
  "Kat İrtifaklı",
  "Hisseli Tapu",
  "Müstakil Tapu",
  "Kooperatif",
];
const SOIL_TYPES = [
  "Verimli Toprak",
  "Kumlu",
  "Killi",
  "Humuslu",
  "Tınlı",
  "Çakıllı",
  "Kireçli",
];
const CROP_TYPES = [
  "Fındık",
  "Ceviz",
  "Zeytin",
  "Meyve Bahçesi",
  "Sera",
  "Tarla",
  "Çayır/Mera",
  "Orman",
];

// Komponentler DIŞARIDA tanımlanmalı - her renderda yeniden oluşturulmasını önler
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">Seçiniz</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: string;
}

function CheckboxField({
  label,
  name,
  checked,
  onChange,
  icon,
}: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
      />
      <Icon name={icon} className="text-slate-400 text-sm" />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditIlanPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "konut" as ListingType,
    status: "draft" as ListingStatus,
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

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${id}`);
        if (!response.ok) {
          router.push("/admin/ilanlar");
          return;
        }
        const { data } = await response.json();
        const f = data.features || {};
        setFormData({
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
          parcelNo: f.parcelNo || "",
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
          furnished: f.furnished || false,
          parking: f.parking || false,
          parkingCount: f.parkingCount?.toString() || "",
          garden: f.garden || false,
          gardenArea: f.gardenArea?.toString() || "",
          pool: f.pool || false,
          elevator: f.elevator || false,
          security: f.security || false,
          doorman: f.doorman || false,
          intercom: f.intercom || false,
          satellite: f.satellite || false,
          cableTV: f.cableTV || false,
          internet: f.internet || false,
          airConditioning: f.airConditioning || false,
          fireplace: f.fireplace || false,
          jacuzzi: f.jacuzzi || false,
          sauna: f.sauna || false,
          gym: f.gym || false,
          playroom: f.playroom || false,
          cellar: f.cellar || false,
          terrace: f.terrace || false,
          balcony: f.balcony || false,
          dressing: f.dressing || false,
          laundryRoom: f.laundryRoom || false,
          parentBathroom: f.parentBathroom || false,
          infrastructure: f.infrastructure || false,
          electricity: f.electricity || false,
          electricityPower: f.electricityPower || "",
          threePhase: f.threePhase || false,
          water: f.water || false,
          naturalGas: f.naturalGas || false,
          sewage: f.sewage || false,
          roadAccess: f.roadAccess || "",
          roadType: f.roadType || "",
          ceilingHeight: f.ceilingHeight?.toString() || "",
          loadingRamp: f.loadingRamp || false,
          craneSystem: f.craneSystem || false,
          craneCapacity: f.craneCapacity || "",
          officeArea: f.officeArea?.toString() || "",
          openArea: f.openArea?.toString() || "",
          closedArea: f.closedArea?.toString() || "",
          securityRoom: f.securityRoom || false,
          fireSystem: f.fireSystem || false,
          treeCount: f.treeCount?.toString() || "",
          treeAge: f.treeAge?.toString() || "",
          cropType: f.cropType || "",
          irrigation: f.irrigation || false,
          irrigationType: f.irrigationType || "",
          waterSource: f.waterSource || "",
          organic: f.organic || false,
          organicCertificate: f.organicCertificate || "",
          soilType: f.soilType || "",
          slope: f.slope || "",
          fenced: f.fenced || false,
          warehouse: f.warehouse || false,
          warehouseArea: f.warehouseArea?.toString() || "",
          well: f.well || false,
          wellDepth: f.wellDepth?.toString() || "",
          annualYield: f.annualYield || "",
          shopWidth: f.shopWidth?.toString() || "",
          shopDepth: f.shopDepth?.toString() || "",
          showcaseCount: f.showcaseCount?.toString() || "",
          cornerShop: f.cornerShop || false,
          mainStreet: f.mainStreet || false,
          mallLocation: f.mallLocation || false,
          suitableFor: f.suitableFor || "",
          currentTenant: f.currentTenant || "",
          monthlyRent: f.monthlyRent || "",
          depositAmount: f.depositAmount || "",
          // Arsa özellikleri
          landTopography: f.landTopography || "",
          landShape: f.landShape || "",
          frontage: f.frontage?.toString() || "",
          depth: f.depth?.toString() || "",
          cornerPlot: f.cornerPlot || false,
          splitAllowed: f.splitAllowed || false,
          buildingPermit: f.buildingPermit || false,
          projectReady: f.projectReady || false,
          electricityNearby: f.electricityNearby || false,
          waterNearby: f.waterNearby || false,
          gasNearby: f.gasNearby || false,
          sewerNearby: f.sewerNearby || false,
          viewType: f.viewType || "",
          distanceToCenter: f.distanceToCenter || "",
          distanceToHighway: f.distanceToHighway || "",
          distanceToSchool: f.distanceToSchool || "",
          distanceToHospital: f.distanceToHospital || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          isFeatured: data.isFeatured || false,
        });
        setImages(data.images || []);
      } catch (error) {
        console.error("İlan yüklenirken hata:", error);
        router.push("/admin/ilanlar");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

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
      const response = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          status: formData.status,
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
        router.push("/admin/ilanlar");
      } else {
        const error = await response.json();
        alert(error.error || "İlan güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("İlan güncelleme hatası:", error);
      alert("İlan güncellenirken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
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
                Durum
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="draft">Taslak</option>
                <option value="active">Aktif</option>
                <option value="pending">Beklemede</option>
                <option value="sold">Satıldı</option>
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
            />
            <InputField
              label="Alan (m²)"
              name="area"
              value={formData.area}
              onChange={handleChange}
              type="number"
              required
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
            />
            <InputField
              label="Parsel No"
              name="parcelNo"
              value={formData.parcelNo}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* KONUT */}
        {formData.type === "konut" && (
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
              />
              <InputField
                label="Banyo"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Balkon"
                name="balconies"
                value={formData.balconies}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Bulunduğu Kat"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Bina Kat Sayısı"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Bina Yaşı"
                name="buildingAge"
                value={formData.buildingAge}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Brüt m²"
                name="grossArea"
                value={formData.grossArea}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Net m²"
                name="netArea"
                value={formData.netArea}
                onChange={handleChange}
                type="number"
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
              />
              <InputField
                label="Bahçe m²"
                name="gardenArea"
                value={formData.gardenArea}
                onChange={handleChange}
                type="number"
              />
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                İç Özellikler
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <CheckboxField
                  label="Eşyalı"
                  name="furnished"
                  checked={formData.furnished}
                  onChange={handleChange}
                  icon="chair"
                />
                <CheckboxField
                  label="Klima"
                  name="airConditioning"
                  checked={formData.airConditioning}
                  onChange={handleChange}
                  icon="ac_unit"
                />
                <CheckboxField
                  label="Şömine"
                  name="fireplace"
                  checked={formData.fireplace}
                  onChange={handleChange}
                  icon="fireplace"
                />
                <CheckboxField
                  label="Jakuzi"
                  name="jacuzzi"
                  checked={formData.jacuzzi}
                  onChange={handleChange}
                  icon="hot_tub"
                />
                <CheckboxField
                  label="Giyinme Odası"
                  name="dressing"
                  checked={formData.dressing}
                  onChange={handleChange}
                  icon="checkroom"
                />
                <CheckboxField
                  label="Çamaşır Odası"
                  name="laundryRoom"
                  checked={formData.laundryRoom}
                  onChange={handleChange}
                  icon="local_laundry_service"
                />
                <CheckboxField
                  label="Ebeveyn Banyosu"
                  name="parentBathroom"
                  checked={formData.parentBathroom}
                  onChange={handleChange}
                  icon="bathtub"
                />
                <CheckboxField
                  label="Kiler"
                  name="cellar"
                  checked={formData.cellar}
                  onChange={handleChange}
                  icon="inventory_2"
                />
                <CheckboxField
                  label="Teras"
                  name="terrace"
                  checked={formData.terrace}
                  onChange={handleChange}
                  icon="deck"
                />
                <CheckboxField
                  label="Balkon"
                  name="balcony"
                  checked={formData.balcony}
                  onChange={handleChange}
                  icon="balcony"
                />
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Dış & Bina
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <CheckboxField
                  label="Otopark"
                  name="parking"
                  checked={formData.parking}
                  onChange={handleChange}
                  icon="local_parking"
                />
                <CheckboxField
                  label="Bahçe"
                  name="garden"
                  checked={formData.garden}
                  onChange={handleChange}
                  icon="yard"
                />
                <CheckboxField
                  label="Havuz"
                  name="pool"
                  checked={formData.pool}
                  onChange={handleChange}
                  icon="pool"
                />
                <CheckboxField
                  label="Asansör"
                  name="elevator"
                  checked={formData.elevator}
                  onChange={handleChange}
                  icon="elevator"
                />
                <CheckboxField
                  label="Güvenlik"
                  name="security"
                  checked={formData.security}
                  onChange={handleChange}
                  icon="security"
                />
                <CheckboxField
                  label="Kapıcı"
                  name="doorman"
                  checked={formData.doorman}
                  onChange={handleChange}
                  icon="person"
                />
                <CheckboxField
                  label="Sauna"
                  name="sauna"
                  checked={formData.sauna}
                  onChange={handleChange}
                  icon="spa"
                />
                <CheckboxField
                  label="Spor Salonu"
                  name="gym"
                  checked={formData.gym}
                  onChange={handleChange}
                  icon="fitness_center"
                />
                <CheckboxField
                  label="Oyun Odası"
                  name="playroom"
                  checked={formData.playroom}
                  onChange={handleChange}
                  icon="sports_esports"
                />
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Teknoloji
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <CheckboxField
                  label="İnternet"
                  name="internet"
                  checked={formData.internet}
                  onChange={handleChange}
                  icon="wifi"
                />
                <CheckboxField
                  label="Uydu"
                  name="satellite"
                  checked={formData.satellite}
                  onChange={handleChange}
                  icon="satellite_alt"
                />
                <CheckboxField
                  label="Kablolu TV"
                  name="cableTV"
                  checked={formData.cableTV}
                  onChange={handleChange}
                  icon="tv"
                />
                <CheckboxField
                  label="Görüntülü Diafon"
                  name="intercom"
                  checked={formData.intercom}
                  onChange={handleChange}
                  icon="videocam"
                />
              </div>
            </div>
          </div>
        )}

        {/* SANAYİ */}
        {formData.type === "sanayi" && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="factory" className="text-emerald-400" /> Sanayi
              Detayları
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField
                label="Kapalı Alan (m²)"
                name="closedArea"
                value={formData.closedArea}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Açık Alan (m²)"
                name="openArea"
                value={formData.openArea}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Ofis Alanı (m²)"
                name="officeArea"
                value={formData.officeArea}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Tavan Yüksekliği (m)"
                name="ceilingHeight"
                value={formData.ceilingHeight}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Elektrik Gücü (kVA)"
                name="electricityPower"
                value={formData.electricityPower}
                onChange={handleChange}
              />
              <InputField
                label="Vinç Kapasitesi (ton)"
                name="craneCapacity"
                value={formData.craneCapacity}
                onChange={handleChange}
              />
              <SelectField
                label="Yol Tipi"
                name="roadType"
                value={formData.roadType}
                onChange={handleChange}
                options={["Asfalt", "Parke Taşı", "Stabilize", "Toprak Yol"]}
              />
              <InputField
                label="Yol Cephesi (m)"
                name="roadAccess"
                value={formData.roadAccess}
                onChange={handleChange}
              />
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Altyapı
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Elektrik"
                  name="electricity"
                  checked={formData.electricity}
                  onChange={handleChange}
                  icon="bolt"
                />
                <CheckboxField
                  label="3 Faz"
                  name="threePhase"
                  checked={formData.threePhase}
                  onChange={handleChange}
                  icon="electrical_services"
                />
                <CheckboxField
                  label="Su"
                  name="water"
                  checked={formData.water}
                  onChange={handleChange}
                  icon="water_drop"
                />
                <CheckboxField
                  label="Doğalgaz"
                  name="naturalGas"
                  checked={formData.naturalGas}
                  onChange={handleChange}
                  icon="local_fire_department"
                />
                <CheckboxField
                  label="Kanalizasyon"
                  name="sewage"
                  checked={formData.sewage}
                  onChange={handleChange}
                  icon="plumbing"
                />
                <CheckboxField
                  label="Altyapı Hazır"
                  name="infrastructure"
                  checked={formData.infrastructure}
                  onChange={handleChange}
                  icon="construction"
                />
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Tesis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Yükleme Rampası"
                  name="loadingRamp"
                  checked={formData.loadingRamp}
                  onChange={handleChange}
                  icon="local_shipping"
                />
                <CheckboxField
                  label="Vinç Sistemi"
                  name="craneSystem"
                  checked={formData.craneSystem}
                  onChange={handleChange}
                  icon="precision_manufacturing"
                />
                <CheckboxField
                  label="Güvenlik Kulübesi"
                  name="securityRoom"
                  checked={formData.securityRoom}
                  onChange={handleChange}
                  icon="shield"
                />
                <CheckboxField
                  label="Yangın Sistemi"
                  name="fireSystem"
                  checked={formData.fireSystem}
                  onChange={handleChange}
                  icon="fire_extinguisher"
                />
              </div>
            </div>
          </div>
        )}

        {/* TARIM */}
        {formData.type === "tarim" && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="agriculture" className="text-emerald-400" /> Tarım
              Detayları
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SelectField
                label="Arazi Tipi"
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                options={CROP_TYPES}
              />
              <SelectField
                label="Toprak Yapısı"
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                options={SOIL_TYPES}
              />
              <InputField
                label="Ağaç Sayısı"
                name="treeCount"
                value={formData.treeCount}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Ağaç Yaşı"
                name="treeAge"
                value={formData.treeAge}
                onChange={handleChange}
                type="number"
              />
              <SelectField
                label="Sulama Tipi"
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleChange}
                options={["Damla Sulama", "Yağmurlama", "Salma Sulama", "Yok"]}
              />
              <SelectField
                label="Su Kaynağı"
                name="waterSource"
                value={formData.waterSource}
                onChange={handleChange}
                options={["Kuyu", "Dere/Çay", "Gölet", "Şebeke Suyu", "Yok"]}
              />
              <InputField
                label="Kuyu Derinliği (m)"
                name="wellDepth"
                value={formData.wellDepth}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Depo Alanı (m²)"
                name="warehouseArea"
                value={formData.warehouseArea}
                onChange={handleChange}
                type="number"
              />
              <SelectField
                label="Arazi Eğimi"
                name="slope"
                value={formData.slope}
                onChange={handleChange}
                options={["Düz", "Hafif Eğimli", "Orta Eğimli", "Dik"]}
              />
              <InputField
                label="Yıllık Verim (kg)"
                name="annualYield"
                value={formData.annualYield}
                onChange={handleChange}
              />
              <InputField
                label="Organik Sertifika No"
                name="organicCertificate"
                value={formData.organicCertificate}
                onChange={handleChange}
              />
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Arazi Özellikleri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Sulama Sistemi"
                  name="irrigation"
                  checked={formData.irrigation}
                  onChange={handleChange}
                  icon="water_drop"
                />
                <CheckboxField
                  label="Organik Sertifikalı"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleChange}
                  icon="eco"
                />
                <CheckboxField
                  label="Çevrili/Çitli"
                  name="fenced"
                  checked={formData.fenced}
                  onChange={handleChange}
                  icon="fence"
                />
                <CheckboxField
                  label="Depo/Ambar"
                  name="warehouse"
                  checked={formData.warehouse}
                  onChange={handleChange}
                  icon="warehouse"
                />
                <CheckboxField
                  label="Kuyu Mevcut"
                  name="well"
                  checked={formData.well}
                  onChange={handleChange}
                  icon="water"
                />
              </div>
            </div>
          </div>
        )}

        {/* TİCARİ */}
        {formData.type === "ticari" && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="store" className="text-emerald-400" /> Ticari Detaylar
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField
                label="Cephe Genişliği (m)"
                name="shopWidth"
                value={formData.shopWidth}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Derinlik (m)"
                name="shopDepth"
                value={formData.shopDepth}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Vitrin Sayısı"
                name="showcaseCount"
                value={formData.showcaseCount}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Bulunduğu Kat"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                type="number"
              />
              <InputField
                label="Bina Kat Sayısı"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                type="number"
              />
              <SelectField
                label="Uygun Sektör"
                name="suitableFor"
                value={formData.suitableFor}
                onChange={handleChange}
                options={[
                  "Mağaza",
                  "Ofis",
                  "Restoran/Cafe",
                  "Market",
                  "Showroom",
                  "Depo",
                  "Atölye",
                ]}
              />
              <InputField
                label="Mevcut Kiracı"
                name="currentTenant"
                value={formData.currentTenant}
                onChange={handleChange}
              />
              <InputField
                label="Aylık Kira (₺)"
                name="monthlyRent"
                value={formData.monthlyRent}
                onChange={handleChange}
              />
              <InputField
                label="Depozito (₺)"
                name="depositAmount"
                value={formData.depositAmount}
                onChange={handleChange}
              />
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Konum Özellikleri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Köşe Dükkan"
                  name="cornerShop"
                  checked={formData.cornerShop}
                  onChange={handleChange}
                  icon="storefront"
                />
                <CheckboxField
                  label="Ana Cadde"
                  name="mainStreet"
                  checked={formData.mainStreet}
                  onChange={handleChange}
                  icon="add_road"
                />
                <CheckboxField
                  label="AVM İçi"
                  name="mallLocation"
                  checked={formData.mallLocation}
                  onChange={handleChange}
                  icon="local_mall"
                />
                <CheckboxField
                  label="Otopark"
                  name="parking"
                  checked={formData.parking}
                  onChange={handleChange}
                  icon="local_parking"
                />
                <CheckboxField
                  label="Asansör"
                  name="elevator"
                  checked={formData.elevator}
                  onChange={handleChange}
                  icon="elevator"
                />
                <CheckboxField
                  label="Güvenlik"
                  name="security"
                  checked={formData.security}
                  onChange={handleChange}
                  icon="security"
                />
              </div>
            </div>
          </div>
        )}

        {/* ARSA */}
        {formData.type === "arsa" && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="landscape" className="text-amber-400" /> Arsa
              Özellikleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField
                label="Arazi Topoğrafyası"
                name="landTopography"
                value={formData.landTopography}
                onChange={handleChange}
                options={[
                  "Düz",
                  "Hafif Eğimli",
                  "Eğimli",
                  "Teraslı",
                  "Dalgalı",
                ]}
              />
              <SelectField
                label="Arsa Şekli"
                name="landShape"
                value={formData.landShape}
                onChange={handleChange}
                options={[
                  "Dikdörtgen",
                  "Kare",
                  "L Şeklinde",
                  "Üçgen",
                  "Düzensiz",
                ]}
              />
              <SelectField
                label="Manzara"
                name="viewType"
                value={formData.viewType}
                onChange={handleChange}
                options={[
                  "Deniz",
                  "Göl",
                  "Dağ",
                  "Şehir",
                  "Orman",
                  "Doğa",
                  "Yok",
                ]}
              />
              <InputField
                label="Cephe (m)"
                name="frontage"
                value={formData.frontage}
                onChange={handleChange}
              />
              <InputField
                label="Derinlik (m)"
                name="depth"
                value={formData.depth}
                onChange={handleChange}
              />
              <SelectField
                label="Yol Erişimi"
                name="roadAccess"
                value={formData.roadAccess}
                onChange={handleChange}
                options={[
                  "Ana Yol",
                  "Ara Yol",
                  "Tali Yol",
                  "Toprak Yol",
                  "Yok",
                ]}
              />
              <SelectField
                label="Yol Tipi"
                name="roadType"
                value={formData.roadType}
                onChange={handleChange}
                options={["Asfalt", "Parke", "Stabilize", "Toprak", "Beton"]}
              />
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Mesafeler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InputField
                  label="Merkeze (km)"
                  name="distanceToCenter"
                  value={formData.distanceToCenter}
                  onChange={handleChange}
                />
                <InputField
                  label="Otoyola (km)"
                  name="distanceToHighway"
                  value={formData.distanceToHighway}
                  onChange={handleChange}
                />
                <InputField
                  label="Okula (km)"
                  name="distanceToSchool"
                  value={formData.distanceToSchool}
                  onChange={handleChange}
                />
                <InputField
                  label="Hastaneye (km)"
                  name="distanceToHospital"
                  value={formData.distanceToHospital}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Altyapı Durumu
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Elektrik Yakın"
                  name="electricityNearby"
                  checked={formData.electricityNearby}
                  onChange={handleChange}
                  icon="bolt"
                />
                <CheckboxField
                  label="Su Yakın"
                  name="waterNearby"
                  checked={formData.waterNearby}
                  onChange={handleChange}
                  icon="water_drop"
                />
                <CheckboxField
                  label="Doğalgaz Yakın"
                  name="gasNearby"
                  checked={formData.gasNearby}
                  onChange={handleChange}
                  icon="local_fire_department"
                />
                <CheckboxField
                  label="Kanalizasyon Yakın"
                  name="sewerNearby"
                  checked={formData.sewerNearby}
                  onChange={handleChange}
                  icon="water"
                />
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Arsa Özellikleri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CheckboxField
                  label="Köşe Parsel"
                  name="cornerPlot"
                  checked={formData.cornerPlot}
                  onChange={handleChange}
                  icon="crop_square"
                />
                <CheckboxField
                  label="İfraz Edilebilir"
                  name="splitAllowed"
                  checked={formData.splitAllowed}
                  onChange={handleChange}
                  icon="call_split"
                />
                <CheckboxField
                  label="İnşaat İzni Var"
                  name="buildingPermit"
                  checked={formData.buildingPermit}
                  onChange={handleChange}
                  icon="construction"
                />
                <CheckboxField
                  label="Proje Hazır"
                  name="projectReady"
                  checked={formData.projectReady}
                  onChange={handleChange}
                  icon="architecture"
                />
              </div>
            </div>
          </div>
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
            placeholder="İlan açıklaması..."
          />
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
                <Icon name="save" /> Değişiklikleri Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
