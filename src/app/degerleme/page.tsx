"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { MapLocationPicker } from "@/components/valuation/MapLocationPicker";

type PropertyType = "konut" | "sanayi" | "tarim" | "isyeri" | "arsa";
type Step = 1 | 2 | 3 | 4;

const propertyTypes: {
  key: PropertyType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "konut",
    label: "Konut",
    icon: "home",
    description: "Villa, daire, müstakil ev",
  },
  {
    key: "arsa",
    label: "Arsa",
    icon: "landscape",
    description: "İmar arsası, tarla",
  },
  {
    key: "isyeri",
    label: "İşyeri",
    icon: "store",
    description: "Dükkan, ofis, plaza",
  },
  {
    key: "sanayi",
    label: "Sanayi",
    icon: "factory",
    description: "Fabrika, depo, OSB",
  },
  {
    key: "tarim",
    label: "Tarım",
    icon: "park",
    description: "Fındık bahçesi, sera",
  },
];

export default function DegerlemePage() {
  const [step, setStep] = useState<Step>(1);
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
    ilce?: string;
    mahalle?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    area: "",
    roomCount: "",
    buildingAge: "",
    floor: "",
    totalFloors: "",
    hasElevator: false,
    hasParking: false,
    hasBalcony: false,
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleTypeSelect = (type: PropertyType) => {
    setPropertyType(type);
    setStep(2);
  };

  const handleLocationSelect = (loc: any) => {
    setLocation(loc);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyType || !location) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/valuation/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          features: {
            propertyType,
            area: parseInt(formData.area),
            roomCount: formData.roomCount
              ? parseInt(formData.roomCount)
              : undefined,
            buildingAge: formData.buildingAge
              ? parseInt(formData.buildingAge)
              : undefined,
            floor: formData.floor ? parseInt(formData.floor) : undefined,
            totalFloors: formData.totalFloors
              ? parseInt(formData.totalFloors)
              : undefined,
            hasElevator: formData.hasElevator,
            hasParking: formData.hasParking,
            hasBalcony: formData.hasBalcony,
          },
          userInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setStep(4);
      } else {
        alert(data.error || "Değerleme yapılırken bir hata oluştu");
      }
    } catch (error) {
      console.error("Valuation error:", error);
      alert("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-[var(--demir-charcoal)] to-[var(--demir-slate)]">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--terracotta)]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold tracking-wider uppercase mb-6">
              <Icon
                name="auto_awesome"
                className="text-[var(--terracotta)]"
                filled
              />
              Gerçek Veri Analizi
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Mülkünüzün{" "}
              <span className="text-[var(--terracotta)]">Gerçek Değerini</span>{" "}
              Öğrenin
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Sahibinden.com'daki binlerce ilan analizi + Konum bazlı puanlama +
              AI değerlendirme
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-[var(--terracotta)] text-white"
                      : "bg-white/10 text-gray-500"
                  }`}
                >
                  {step > s ? <Icon name="check" className="text-lg" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 h-1 rounded ${
                      step > s ? "bg-[var(--terracotta)]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 lg:p-12">
            {/* Step 1: Property Type Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Mülk Tipini Seçin
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => handleTypeSelect(type.key)}
                      className="p-6 rounded-2xl border-2 transition-all text-left hover:scale-105 border-white/10 hover:border-white/30 bg-white/5"
                    >
                      <Icon
                        name={type.icon}
                        className="text-[var(--terracotta)] text-3xl mb-3"
                      />
                      <h3 className="text-white font-bold mb-1">
                        {type.label}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Location Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Mülkün Konumunu Seçin
                </h2>

                <MapLocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={location || undefined}
                />

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-colors"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!location}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-light)] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[var(--terracotta)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Devam Et
                    <Icon name="arrow_forward" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Property Details Form */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Mülk Bilgilerini Girin
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Alan (m²) *
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="Örn: 500"
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>

                  {propertyType === "konut" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Oda Sayısı
                        </label>
                        <input
                          type="number"
                          name="roomCount"
                          value={formData.roomCount}
                          onChange={handleInputChange}
                          placeholder="Örn: 3"
                          min="1"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bina Yaşı
                        </label>
                        <input
                          type="number"
                          name="buildingAge"
                          value={formData.buildingAge}
                          onChange={handleInputChange}
                          placeholder="Örn: 5"
                          min="0"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bulunduğu Kat
                        </label>
                        <input
                          type="number"
                          name="floor"
                          value={formData.floor}
                          onChange={handleInputChange}
                          placeholder="Örn: 3"
                          min="0"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Özellikler
                        </label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="hasElevator"
                              checked={formData.hasElevator}
                              onChange={handleInputChange}
                              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[var(--terracotta)] focus:ring-[var(--terracotta)]"
                            />
                            <span className="text-white">Asansör</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="hasParking"
                              checked={formData.hasParking}
                              onChange={handleInputChange}
                              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[var(--terracotta)] focus:ring-[var(--terracotta)]"
                            />
                            <span className="text-white">Otopark</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="hasBalcony"
                              checked={formData.hasBalcony}
                              onChange={handleInputChange}
                              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[var(--terracotta)] focus:ring-[var(--terracotta)]"
                            />
                            <span className="text-white">Balkon</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Adınız Soyadınız"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ornek@email.com"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="05XX XXX XX XX"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-colors"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-light)] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[var(--terracotta)]/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="sync" className="animate-spin" />
                        AI Analiz Yapılıyor...
                      </>
                    ) : (
                      <>
                        <Icon name="auto_awesome" filled />
                        Değerleme Yap
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Results */}
            {step === 4 && result && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <Icon
                    name="check_circle"
                    className="text-green-400 text-5xl"
                    filled
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Değerleme Tamamlandı!
                  </h2>
                  <p className="text-gray-400">
                    {result.comparableProperties?.length || 0} benzer ilan
                    analiz edildi
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-8">
                  <p className="text-gray-400 text-sm mb-2">Tahmini Değer</p>
                  <p className="text-5xl font-bold text-white mb-2">
                    ₺{(result.estimatedValue / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Aralık: ₺{(result.priceRange.min / 1000000).toFixed(2)}M - ₺
                    {(result.priceRange.max / 1000000).toFixed(2)}M
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Icon name="verified" filled />
                    <span className="font-semibold">
                      %{result.confidenceScore} Güven Oranı
                    </span>
                  </div>
                </div>

                {/* Location Score */}
                <div className="bg-white/5 rounded-2xl p-6 text-left">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon
                      name="location_on"
                      className="text-[var(--terracotta)]"
                    />
                    Konum Skoru: {result.locationScore.total}/100
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Ulaşım</p>
                      <p className="text-white font-semibold">
                        {result.locationScore.breakdown.transportation}/20
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Eğitim</p>
                      <p className="text-white font-semibold">
                        {result.locationScore.breakdown.education}/15
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Sosyal Tesisler</p>
                      <p className="text-white font-semibold">
                        {result.locationScore.breakdown.amenities}/20
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Sağlık</p>
                      <p className="text-white font-semibold">
                        {result.locationScore.breakdown.health}/10
                      </p>
                    </div>
                  </div>
                  {result.locationScore.advantages.length > 0 && (
                    <div className="text-sm">
                      <p className="text-green-400 font-medium mb-1">
                        ✓ Avantajlar:
                      </p>
                      <ul className="text-gray-400 space-y-1">
                        {result.locationScore.advantages.map(
                          (adv: string, i: number) => (
                            <li key={i}>• {adv}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI Insights */}
                <div className="bg-white/5 rounded-2xl p-6 text-left">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Icon
                      name="auto_awesome"
                      className="text-[var(--terracotta)]"
                      filled
                    />
                    AI Değerlendirme
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.aiInsights}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setPropertyType(null);
                    setLocation(null);
                  }}
                  className="px-8 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Yeni Değerleme Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
