"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";

type PropertyType = "konut" | "sanayi" | "tarim" | "ticari";
type Step = 1 | 2 | 3;

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
    key: "sanayi",
    label: "Sanayi",
    icon: "factory",
    description: "Fabrika, depo, OSB arsası",
  },
  {
    key: "tarim",
    label: "Tarım",
    icon: "park",
    description: "Fındık bahçesi, tarla, sera",
  },
  {
    key: "ticari",
    label: "Ticari",
    icon: "store",
    description: "Dükkan, ofis, plaza",
  },
];

export default function DegerlemePage() {
  const [step, setStep] = useState<Step>(1);
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    area: "",
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    min: number;
    max: number;
    confidence: number;
  } | null>(null);

  const handleTypeSelect = (type: PropertyType) => {
    setPropertyType(type);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyType) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result based on area
    const area = parseInt(formData.area) || 100;
    const basePrice =
      propertyType === "sanayi"
        ? 4000
        : propertyType === "tarim"
        ? 350
        : propertyType === "konut"
        ? 15000
        : 8000;
    const estimatedValue = area * basePrice;

    setResult({
      min: Math.round(estimatedValue * 0.9),
      max: Math.round(estimatedValue * 1.1),
      confidence: 94,
    });

    setIsSubmitting(false);
    setStep(3);
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

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold tracking-wider uppercase mb-6">
              <Icon
                name="auto_awesome"
                className="text-[var(--terracotta)]"
                filled
              />
              Yapay Zeka Destekli
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Mülkünüzün{" "}
              <span className="text-[var(--terracotta)]">Değerini</span> Öğrenin
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              30 saniyede ücretsiz AI değerleme. 10.000+ işlem verisi analizi
              ile %94 doğruluk.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
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
                {s < 3 && (
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => handleTypeSelect(type.key)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left hover:scale-105 ${
                        propertyType === type.key
                          ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10"
                          : "border-white/10 hover:border-white/30 bg-white/5"
                      }`}
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

            {/* Step 2: Property Details Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                  Mülk Bilgilerini Girin
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Adres
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Örn: Hendek Merkez, Atatürk Cad."
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Alan (m²)
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ad Soyad
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
                      E-posta
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
                      Telefon
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
                    onClick={() => setStep(1)}
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

            {/* Step 3: Results */}
            {step === 3 && result && (
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
                    AI motorumuz mülkünüzü analiz etti.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-8">
                  <p className="text-gray-400 text-sm mb-2">
                    Tahmini Değer Aralığı
                  </p>
                  <p className="text-5xl font-bold text-white mb-2">
                    ₺{(result.min / 1000000).toFixed(1)}M - ₺
                    {(result.max / 1000000).toFixed(1)}M
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Icon name="verified" filled />
                    <span className="font-semibold">
                      %{result.confidence} Güven Oranı
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <Icon
                      name="location_on"
                      className="text-[var(--terracotta)] text-2xl mb-2"
                    />
                    <p className="text-white font-semibold">Konum</p>
                    <p className="text-gray-400 text-sm">Analiz Edildi</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <Icon
                      name="analytics"
                      className="text-blue-400 text-2xl mb-2"
                    />
                    <p className="text-white font-semibold">Piyasa</p>
                    <p className="text-gray-400 text-sm">Karşılaştırıldı</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <Icon
                      name="trending_up"
                      className="text-green-400 text-2xl mb-2"
                    />
                    <p className="text-white font-semibold">Trend</p>
                    <p className="text-gray-400 text-sm">Hesaplandı</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm">
                  Detaylı rapor için sizinle iletişime geçeceğiz.
                </p>

                <button
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setPropertyType(null);
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
