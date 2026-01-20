"use client";

import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";

interface AppointmentTypeConfig {
  key: string;
  label: string;
  icon: string;
  description: string;
  duration: string;
  isActive?: boolean;
}

interface PageContent {
  heroTitle?: string;
  heroHighlight?: string;
  heroDescription?: string;
  successTitle?: string;
  successMessage?: string;
  brokerName?: string;
  brokerTitle?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  appointmentTypes?: AppointmentTypeConfig[];
}

const defaultContent: PageContent = {
  heroTitle: "Randevu",
  heroHighlight: "Oluşturun",
  heroDescription:
    "Mustafa Demir ile birebir görüşme için randevu alın. Gayrimenkul yatırımlarınızı birlikte planlayalım.",
  successTitle: "Randevunuz Alındı!",
  successMessage:
    "En kısa sürede sizinle iletişime geçeceğiz. Randevu detayları e-posta adresinize gönderildi.",
  brokerName: "Mustafa Demir",
  brokerTitle: "Kurucu & Gayrimenkul Danışmanı",
  brokerPhone: "0264 XXX XX XX",
  brokerEmail: "mustafa@demirgayrimenkul.com",
  appointmentTypes: [
    {
      key: "kahve",
      label: "Kahve Sohbeti",
      icon: "coffee",
      description: "Tanışma ve genel danışmanlık",
      duration: "30 dk",
      isActive: true,
    },
    {
      key: "property_visit",
      label: "Mülk Gezisi",
      icon: "home",
      description: "Yerinde mülk inceleme",
      duration: "1 saat",
      isActive: true,
    },
    {
      key: "valuation",
      label: "Değerleme Randevusu",
      icon: "calculate",
      description: "Detaylı mülk değerleme",
      duration: "45 dk",
      isActive: true,
    },
    {
      key: "consultation",
      label: "Yatırım Danışmanlığı",
      icon: "trending_up",
      description: "Yatırım stratejisi görüşmesi",
      duration: "1 saat",
      isActive: true,
    },
  ],
};

export default function RandevuPage() {
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/content/appointment_page");
        if (res.ok) {
          const { data } = await res.json();
          if (data?.data) {
            setContent({ ...defaultContent, ...data.data });
          }
        }
      } catch (error) {
        console.error("İçerik yüklenemedi:", error);
      }
    }
    fetchContent();
  }, []);

  const activeAppointmentTypes =
    (content.appointmentTypes || defaultContent.appointmentTypes)?.filter(
      (t) => t.isActive !== false
    ) || [];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          ...formData,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Randevu oluşturma hatası:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (isSuccess) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 py-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
              <Icon
                name="check_circle"
                className="text-green-500 text-5xl"
                filled
              />
            </div>
            <h1 className="text-3xl font-bold text-[var(--demir-slate)] mb-4">
              {content.successTitle}
            </h1>
            <p className="text-gray-600 mb-8">{content.successMessage}</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--demir-slate)] text-white rounded-xl font-semibold hover:bg-[var(--terracotta)] transition-colors"
            >
              <Icon name="home" />
              Ana Sayfaya Dön
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)]">
        {/* Header */}
        <section className="bg-white border-b border-gray-200 py-12">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--terracotta)]/10 text-[var(--terracotta)] text-xs font-bold tracking-wider uppercase mb-4">
              <Icon name="coffee" className="text-sm" />
              Kahve Eşliğinde
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-[var(--demir-slate)] leading-tight mb-4">
              {content.heroTitle}{" "}
              <span className="text-[var(--terracotta)]">
                {content.heroHighlight}
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {content.heroDescription}
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Appointment Type Selection */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[var(--demir-slate)] mb-6">
                  Randevu Tipi Seçin
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeAppointmentTypes.map((type) => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setSelectedType(type.key)}
                      className={`p-5 rounded-2xl border-2 transition-all text-left ${
                        selectedType === type.key
                          ? "border-[var(--terracotta)] bg-[var(--terracotta)]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedType === type.key
                              ? "bg-[var(--terracotta)]/10"
                              : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            name={type.icon}
                            className={`text-2xl ${
                              selectedType === type.key
                                ? "text-[var(--terracotta)]"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[var(--demir-slate)]">
                            {type.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {type.description}
                          </p>
                          <p className="text-xs text-[var(--terracotta)] font-medium mt-1">
                            {type.duration}
                          </p>
                        </div>
                        {selectedType === type.key && (
                          <Icon
                            name="check_circle"
                            className="text-[var(--terracotta)] text-xl"
                            filled
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[var(--demir-slate)] mb-6">
                  İletişim Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tercih Edilen Tarih *
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      required
                      min={minDate}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tercih Edilen Saat
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                    >
                      <option value="">Saat Seçin (Opsiyonel)</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesajınız
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--terracotta)] transition-colors resize-none"
                      placeholder="Görüşmek istediğiniz konuları kısaca belirtebilirsiniz..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedType || isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-[var(--demir-slate)] text-white rounded-xl font-bold hover:bg-[var(--terracotta)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="sync" className="animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Icon name="calendar_month" />
                      Randevu Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Contact Info Card */}
            <div className="mt-12 bg-gradient-to-r from-[var(--demir-slate)] to-[var(--demir-charcoal)] rounded-3xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-5xl" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">
                    {content.brokerName}
                  </h3>
                  <p className="text-gray-300 mb-4">{content.brokerTitle}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {content.brokerPhone && (
                      <a
                        href={`tel:${content.brokerPhone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-[var(--terracotta)] hover:text-[var(--terracotta-light)]"
                      >
                        <Icon name="call" />
                        {content.brokerPhone}
                      </a>
                    )}
                    {content.brokerEmail && (
                      <a
                        href={`mailto:${content.brokerEmail}`}
                        className="flex items-center gap-2 text-[var(--terracotta)] hover:text-[var(--terracotta-light)]"
                      >
                        <Icon name="mail" />
                        {content.brokerEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
