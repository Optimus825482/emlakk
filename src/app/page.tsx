"use client";

import { useEffect, useState } from "react";
import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  InvestmentGuideHero,
  FeaturedListings,
  CategoryListings,
  AIValuationCTA,
  ManifestoSection,
} from "@/components/home";

interface HomepageSection {
  key: string;
  isVisible: boolean;
}

export default function HomePage() {
  const [sections, setSections] = useState<Record<string, boolean>>({
    hero: true,
    manifesto: true,
    investment_guide: true,
    featured_listings: true,
    category_listings: true,
    ai_valuation_cta: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/homepage-sections")
      .then((res) => res.json())
      .then((data: HomepageSection[]) => {
        if (Array.isArray(data)) {
          const visibilityMap: Record<string, boolean> = {};
          data.forEach((s) => {
            visibilityMap[s.key] = s.isVisible;
          });
          setSections((prev) => ({ ...prev, ...visibilityMap }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <>
      {/* Navigation (MarketTicker içinde) */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section - Her zaman görünür */}
        <HeroSection />

        {/* Manifesto - Vizyon Beyanı */}
        {sections.manifesto && <ManifestoSection />}

        {/* Hendek Yatırım Rehberi Hero */}
        {sections.investment_guide && <InvestmentGuideHero />}

        {/* Featured Listings - Öne Çıkan İlanlar */}
        {sections.featured_listings && <FeaturedListings />}

        {/* Category Listings - Sanayi, Tarım, Konut */}
        {sections.category_listings && <CategoryListings />}

        {/* AI Valuation CTA */}
        {sections.ai_valuation_cta && <AIValuationCTA />}
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
