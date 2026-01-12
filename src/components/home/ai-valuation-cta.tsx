"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface AIValuationContent {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  ctaText?: string;
  feature1Title?: string;
  feature1Value?: string;
  feature2Title?: string;
  feature2Value?: string;
  aiName?: string;
  aiVersion?: string;
  estimatedRange?: string;
  trendText?: string;
}

const defaultContent: AIValuationContent = {
  badge: "Yapay Zeka Destekli",
  title: "Mülkünüzün Gerçek",
  titleHighlight: "Değerini",
  description:
    "Yapay zeka algoritmamız, Hendek bölgesindeki 10.000+ işlem verisini analiz ederek mülkünüzün piyasa değerini saniyeler içinde hesaplar.",
  ctaText: "Ücretsiz Değerleme Yap",
  feature1Title: "Anlık değerleme",
  feature1Value: "30 Saniye",
  feature2Title: "Piyasa uyumu",
  feature2Value: "%94 Doğruluk",
  aiName: "Demir AI",
  aiVersion: "Değerleme Motoru v2.4",
  estimatedRange: "₺4.2M - ₺4.8M",
  trendText: "Son 6 ayda %12 değer artışı",
};

export function AIValuationCTA() {
  const [content, setContent] = useState<AIValuationContent>(defaultContent);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch("/api/content/ai_valuation_cta");
        if (response.ok) {
          const { data } = await response.json();
          if (data?.data) {
            setContent({ ...defaultContent, ...data.data });
          }
        }
      } catch (error) {
        console.error("AI Değerleme içeriği yüklenemedi:", error);
      }
    }
    fetchContent();
  }, []);

  return (
    <section
      id="degerleme"
      className="py-24 bg-[var(--demir-charcoal)] relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--terracotta)]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold tracking-wider uppercase mb-6">
              <Icon
                name="auto_awesome"
                className="text-[var(--terracotta)]"
                filled
              />
              {content.badge}
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              {content.title}
              <br />
              <span className="text-[var(--terracotta)]">
                {content.titleHighlight}
              </span>{" "}
              Öğrenin
            </h2>
            <p className="text-gray-400 text-lg font-[var(--font-body)] mb-8 max-w-lg">
              {content.description}
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="speed" className="text-green-400" />
                  <span className="text-white font-semibold">
                    {content.feature1Value}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{content.feature1Title}</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="analytics" className="text-blue-400" />
                  <span className="text-white font-semibold">
                    {content.feature2Value}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{content.feature2Title}</p>
              </div>
            </div>

            <Link
              href="/degerleme"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--terracotta)] to-[var(--terracotta-light)] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[var(--terracotta)]/30 transition-all"
            >
              <Icon name="auto_awesome" filled />
              {content.ctaText}
              <Icon name="arrow_forward" />
            </Link>
          </div>

          {/* Right Content - AI Demo Card */}
          <div className="relative">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Icon name="smart_toy" className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-white font-bold">{content.aiName}</p>
                  <p className="text-gray-400 text-sm">{content.aiVersion}</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                <ProgressStep
                  label="Konum Analizi"
                  status="completed"
                  progress={100}
                />
                <ProgressStep
                  label="Piyasa Karşılaştırması"
                  status="completed"
                  progress={100}
                />
                <ProgressStep
                  label="Trend Projeksiyonu"
                  status="processing"
                  progress={75}
                />
              </div>

              {/* Result */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Tahmini Değer Aralığı
                </p>
                <p className="text-4xl font-bold text-white">
                  {content.estimatedRange}
                </p>
                <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                  <Icon name="trending_up" className="text-sm" />
                  {content.trendText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressStep({
  label,
  status,
  progress,
}: {
  label: string;
  status: "completed" | "processing";
  progress: number;
}) {
  const isCompleted = status === "completed";
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span
          className={`text-sm font-semibold ${
            isCompleted ? "text-green-400" : "text-blue-400"
          }`}
        >
          {isCompleted ? "Tamamlandı" : "İşleniyor..."}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            isCompleted ? "bg-green-400" : "bg-blue-400 animate-pulse"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
