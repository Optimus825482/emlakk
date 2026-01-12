"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";

interface SiteSettings {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  mapEmbedUrl?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio?: string;
  image?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
  };
}

export default function IletisimPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [broker, setBroker] = useState<TeamMember | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Site ayarlarını çek
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const { data } = await settingsRes.json();
          setSettings(data || {});
        }

        // Ekip üyelerini çek (ilk üye broker olarak gösterilecek)
        const teamRes = await fetch("/api/team");
        if (teamRes.ok) {
          const { data } = await teamRes.json();
          if (data && data.length > 0) {
            setBroker(data[0]);
          }
        }
      } catch (error) {
        console.error("Veri yüklenemedi:", error);
      }
    }
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: "", phone: "", email: "", message: "" });
      }
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp numarasını formatlama
  const whatsappNumber = settings.whatsapp?.replace(/\D/g, "") || "";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)]">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-6 lg:px-8 max-w-[1280px] mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--demir-slate)] mb-6">
              Bize Ulaşın
            </h1>
            <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl">
              Sakarya, Hendek'teki ofisimizde sizi ağırlamaktan mutluluk
              duyarız. Gayrimenkul ihtiyaçlarınız için bir kahve içmeye
              bekleriz.
            </p>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="pb-24 px-6 lg:px-8 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            {/* Left Column: Map & Form */}
            <div className="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1">
              {/* Map */}
              <div className="w-full h-[500px] bg-gray-100 rounded-2xl overflow-hidden shadow-sm relative group">
                {settings.mapEmbedUrl ? (
                  <iframe
                    src={settings.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div
                    className="w-full h-full bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-500"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2sAwNGG3i70r90MyYlEXENaJjXJoQUp8LZqscxzMryhudWg5AOfUkUMh4nFdOn5y7CUuqX5PRiiIrw9AYiGhmcx1upeXqo7eaX1fy3bOb-SkS7W_-LGrp9dhYDreNVdDxsxKLa6MRfyLzVOGNz6kX3SlXECtYWSVhak327dmOMSRJyLYMyUBiKAoeAJMc1R_-V2oZsVuoIyjPY9-BCo3CEhP4os4yBi83tnAdSpBkwdoSMci93weKQJqVph_aggCL5Zya--0XRrie')",
                    }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-3">
                    <Icon
                      name="location_on"
                      className="text-[var(--terracotta)] text-3xl"
                    />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                        Ofis Konumu
                      </p>
                      <p className="font-semibold text-[var(--demir-slate)]">
                        Hendek, Sakarya
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gray-50 rounded-2xl p-8 lg:p-10 mt-4">
                <h3 className="text-2xl font-bold text-[var(--demir-slate)] mb-2">
                  Bize Mesaj Gönderin
                </h3>
                <p className="text-gray-500 mb-8">
                  Formu doldurun, en kısa sürede size dönüş yapalım.
                </p>

                {isSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Icon
                        name="check_circle"
                        className="text-green-500 text-3xl"
                        filled
                      />
                    </div>
                    <h4 className="text-xl font-bold text-[var(--demir-slate)] mb-2">
                      Mesajınız Alındı!
                    </h4>
                    <p className="text-gray-500">
                      En kısa sürede sizinle iletişime geçeceğiz.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-[var(--demir-slate)]"
                        >
                          Adınız Soyadınız
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="İsim Giriniz"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[var(--demir-slate)] focus:ring-2 focus:ring-[var(--terracotta)] focus:border-transparent transition-shadow outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="text-sm font-medium text-[var(--demir-slate)]"
                        >
                          Telefon Numaranız
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          placeholder="05XX XXX XX XX"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[var(--demir-slate)] focus:ring-2 focus:ring-[var(--terracotta)] focus:border-transparent transition-shadow outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-[var(--demir-slate)]"
                      >
                        E-posta Adresiniz
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ornek@email.com"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[var(--demir-slate)] focus:ring-2 focus:ring-[var(--terracotta)] focus:border-transparent transition-shadow outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-sm font-medium text-[var(--demir-slate)]"
                      >
                        Mesajınız
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Size nasıl yardımcı olabiliriz?"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[var(--demir-slate)] focus:ring-2 focus:ring-[var(--terracotta)] focus:border-transparent transition-shadow outline-none resize-none"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-[var(--demir-slate)] hover:bg-[var(--terracotta)] text-white font-bold py-3.5 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Icon name="sync" className="animate-spin" />
                            Gönderiliyor...
                          </>
                        ) : (
                          <>
                            <span>Gönder</span>
                            <Icon name="arrow_forward" className="text-sm" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column: Contact Info & Broker Profile */}
            <div className="lg:col-span-5 flex flex-col gap-10 order-1 lg:order-2">
              {/* Contact Info Cards */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[var(--demir-slate)] mb-6">
                    Ofis ve İletişim
                  </h2>
                  <div className="space-y-6">
                    {/* Address */}
                    <div className="flex gap-4 items-start group">
                      <div className="flex-shrink-0 size-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[var(--terracotta)]/10 transition-colors">
                        <Icon
                          name="location_on"
                          className="text-[var(--demir-slate)] group-hover:text-[var(--terracotta)] transition-colors"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--demir-slate)] uppercase tracking-wide mb-1">
                          Adres
                        </h3>
                        <p className="text-gray-500 leading-relaxed">
                          {settings.address ||
                            "Kemaliye Mah. Cumhuriyet Meydanı No:12, Hendek / Sakarya"}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex gap-4 items-start group">
                      <div className="flex-shrink-0 size-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[var(--terracotta)]/10 transition-colors">
                        <Icon
                          name="call"
                          className="text-[var(--demir-slate)] group-hover:text-[var(--terracotta)] transition-colors"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--demir-slate)] uppercase tracking-wide mb-1">
                          Telefon
                        </h3>
                        <a
                          href={`tel:${
                            settings.phone?.replace(/\s/g, "") ||
                            "+902641234567"
                          }`}
                          className="text-gray-500 hover:text-[var(--terracotta)] transition-colors text-lg font-medium"
                        >
                          {settings.phone || "+90 264 123 45 67"}
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex gap-4 items-start group">
                      <div className="flex-shrink-0 size-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[var(--terracotta)]/10 transition-colors">
                        <Icon
                          name="mail"
                          className="text-[var(--demir-slate)] group-hover:text-[var(--terracotta)] transition-colors"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--demir-slate)] uppercase tracking-wide mb-1">
                          E-Posta
                        </h3>
                        <a
                          href={`mailto:${
                            settings.email || "info@demirgayrimenkul.com"
                          }`}
                          className="text-gray-500 hover:text-[var(--terracotta)] transition-colors"
                        >
                          {settings.email || "info@demirgayrimenkul.com"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Button */}
                {settings.whatsapp && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full group flex items-center justify-between p-4 bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/20 rounded-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="size-6 text-[#25D366] group-hover:text-white transition-colors"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-[#25D366] group-hover:text-white uppercase tracking-wide">
                          Direkt İletişim
                        </span>
                        <span className="text-lg font-bold text-[var(--demir-slate)] group-hover:text-white">
                          WhatsApp Hattı
                        </span>
                      </div>
                    </div>
                    <Icon
                      name="arrow_forward"
                      className="text-[var(--demir-slate)] group-hover:text-white transform group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Broker Profile Widget */}
              {broker && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-16 rounded-full overflow-hidden bg-gray-200 ring-2 ring-[var(--terracotta)]/20 p-0.5">
                      {broker.image ? (
                        <Image
                          src={broker.image}
                          alt={broker.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                          <Icon
                            name="person"
                            className="text-gray-500 text-2xl"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--demir-slate)]">
                        {broker.name}
                      </h4>
                      <p className="text-[var(--terracotta)] font-medium text-sm">
                        {broker.title}
                      </p>
                    </div>
                  </div>
                  {broker.bio && (
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                      "{broker.bio}"
                    </p>
                  )}
                  <div className="flex gap-3">
                    {broker.socialMedia?.linkedin && (
                      <a
                        href={broker.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 text-[var(--demir-slate)] hover:bg-[#0077b5] hover:text-white transition-colors text-sm font-semibold"
                      >
                        <svg
                          className="size-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                    {broker.socialMedia?.instagram && (
                      <a
                        href={broker.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 text-[var(--demir-slate)] hover:bg-[#E1306C] hover:text-white transition-colors text-sm font-semibold"
                      >
                        <svg
                          className="size-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Feature Strip */}
        <section className="border-t border-gray-200 py-12 bg-white">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center text-[var(--terracotta)]">
                <Icon name="verified" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--demir-slate)]">
                  Güvenilir Hizmet
                </h4>
                <p className="text-sm text-gray-500">
                  15 yıllık yerel tecrübe ve şeffaflık.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center text-[var(--terracotta)]">
                <Icon name="support_agent" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--demir-slate)]">
                  7/24 Destek
                </h4>
                <p className="text-sm text-gray-500">
                  WhatsApp hattımızdan her an ulaşın.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center text-[var(--terracotta)]">
                <Icon name="home_work" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--demir-slate)]">
                  Geniş Portföy
                </h4>
                <p className="text-sm text-gray-500">
                  Hayalinizdeki eve en hızlı erişim.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
