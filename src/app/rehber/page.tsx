"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import { Icon } from "@/components/ui/icon";

interface HendekStat {
  key: string;
  label: string;
  value: string;
  unit?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface PageContent {
  title?: string;
  subtitle?: string;
  description?: string;
  comingSoonText?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

const defaultContent: PageContent = {
  title: "Hendek Yatırım Rehberi",
  subtitle: "Veriye Dayalı Akıllı Yatırım Kararları",
  description: `Demir Gayrimenkul'ün onlarca yıllık yerel tecrübesi ve derin bilgi birikimi, modern veri işleme teknikleri ile harmanlanarak sizler için kapsamlı bir yatırım rehberi hazırlanmaktadır.

Bu rehber, Hendek ve çevresindeki gayrimenkul piyasasını derinlemesine analiz ederek, yatırım kararlarınızda nokta atışı isabetli öngörüler sunmayı hedeflemektedir. Bölgesel dinamikler, pazar trendleri, fiyat hareketleri ve gelecek projeksiyonları ile fikirlerinizi katma değerli projelere dönüştürmenizde size rehberlik edecektir.`,
  comingSoonText:
    "Rehberimiz son rötuşlarını alıyor. Belirli aralıklarla güncellenecek içeriklerimizle en kısa sürede sizlerle buluşacağız.",
  features: [
    {
      icon: "analytics",
      title: "Pazar Analizi",
      description:
        "Hendek gayrimenkul piyasasının detaylı analizi ve trend raporları",
    },
    {
      icon: "trending_up",
      title: "Fiyat Projeksiyonları",
      description:
        "AI destekli fiyat tahminleri ve yatırım getiri hesaplamaları",
    },
    {
      icon: "location_city",
      title: "Bölge Rehberi",
      description: "Mahalle bazlı değerlendirmeler ve yaşam kalitesi skorları",
    },
    {
      icon: "factory",
      title: "OSB & Sanayi",
      description: "Organize sanayi bölgesi gelişmeleri ve yatırım fırsatları",
    },
    {
      icon: "agriculture",
      title: "Tarım Arazileri",
      description: "Fındık bahçeleri ve tarım arazisi yatırım rehberi",
    },
    {
      icon: "school",
      title: "Eğitim & Sosyal",
      description: "Üniversite etkisi ve sosyal altyapı değerlendirmesi",
    },
  ],
};

export default function RehberPage() {
  const [content, setContent] = useState<PageContent>(defaultContent);
  const [stats, setStats] = useState<HendekStat[]>([]);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // İçerik çek
        const contentRes = await fetch("/api/content/investment_guide_page");
        if (contentRes.ok) {
          const { data } = await contentRes.json();
          if (data?.data) {
            setContent({ ...defaultContent, ...data.data });
          }
        }

        // İstatistikleri çek
        const statsRes = await fetch("/api/hendek-stats");
        if (statsRes.ok) {
          const { data } = await statsRes.json();
          if (data) setStats(data);
        }
      } catch (error) {
        console.error("Veri yüklenemedi:", error);
      }
    }
    fetchData();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Newsletter API entegrasyonu
    setIsSubscribed(true);
    setEmail("");
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)]">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--demir-charcoal)] via-[var(--demir-slate)] to-[var(--demir-charcoal)]" />
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
          </div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-[var(--terracotta)]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]" />

          <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--terracotta)]/20 border border-[var(--terracotta)]/30 mb-6">
                <Icon
                  name="construction"
                  className="text-[var(--terracotta)]"
                />
                <span className="text-sm font-semibold text-[var(--terracotta)]">
                  Yakında Yayında
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                {content.title}
              </h1>
              <p className="text-xl lg:text-2xl text-[var(--terracotta)] font-semibold mb-6">
                {content.subtitle}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                {content.description}
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Card */}
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left - Info */}
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--hazelnut)] flex items-center justify-center">
                      <Icon
                        name="auto_awesome"
                        className="text-white text-2xl"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--demir-slate)]">
                        Hazırlanıyor
                      </h2>
                      <p className="text-sm text-gray-500">
                        Son rötuşlar atılıyor
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-8">
                    {content.comingSoonText}
                  </p>

                  {/* Progress Indicators */}
                  <div className="space-y-4 mb-8">
                    <ProgressItem label="Pazar Araştırması" progress={100} />
                    <ProgressItem label="Veri Analizi" progress={85} />
                    <ProgressItem label="İçerik Hazırlığı" progress={60} />
                    <ProgressItem label="Tasarım & Geliştirme" progress={40} />
                  </div>

                  {/* Newsletter */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-[var(--demir-slate)] mb-2">
                      Yayınlandığında Haberdar Olun
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      E-posta adresinizi bırakın, rehber yayınlandığında ilk siz
                      öğrenin.
                    </p>
                    {isSubscribed ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Icon name="check_circle" filled />
                        <span className="font-medium">Kaydınız alındı!</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubscribe} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="E-posta adresiniz"
                          required
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--terracotta)] focus:border-transparent outline-none"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 bg-[var(--demir-slate)] hover:bg-[var(--terracotta)] text-white font-bold rounded-xl transition-colors"
                        >
                          Bildir
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right - Features Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
                  <h3 className="text-lg font-bold text-[var(--demir-slate)] mb-6">
                    Rehberde Neler Olacak?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.features?.map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--terracotta)]/10 flex items-center justify-center mb-3">
                          <Icon
                            name={feature.icon}
                            className="text-[var(--terracotta)]"
                          />
                        </div>
                        <h4 className="font-bold text-[var(--demir-slate)] text-sm mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        {stats.length > 0 && (
          <section className="py-12 px-6 lg:px-8 bg-white border-t border-gray-100">
            <div className="max-w-[1280px] mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[var(--demir-slate)]">
                  Rakamlarla Hendek
                </h3>
                <p className="text-gray-500">
                  Rehberde detaylı analiz edilecek veriler
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.slice(0, 4).map((stat) => (
                  <div
                    key={stat.key}
                    className="text-center p-6 rounded-2xl bg-gray-50"
                  >
                    <p className="text-3xl font-black text-[var(--demir-slate)]">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-[1280px] mx-auto text-center">
            <h3 className="text-2xl font-bold text-[var(--demir-slate)] mb-4">
              Şimdilik Yardımcı Olabilir miyiz?
            </h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Rehber hazırlanırken, gayrimenkul danışmanlarımız sorularınızı
              yanıtlamak için hazır.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--demir-slate)] hover:bg-[var(--terracotta)] text-white font-bold rounded-2xl transition-colors"
              >
                <Icon name="call" />
                Bize Ulaşın
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProgressItem({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-[var(--demir-slate)]">
          {progress}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress === 100
              ? "bg-green-500"
              : "bg-gradient-to-r from-[var(--terracotta)] to-[var(--hazelnut)]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
