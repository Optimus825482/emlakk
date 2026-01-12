"use client";

import { useEffect, useRef, useCallback } from "react";

interface ListingTrackerProps {
  listingId: string;
}

/**
 * İlan Görüntüleme Tracker
 * Sayfa görüntüleme, süre, scroll ve aksiyonları takip eder
 */
export function ListingTracker({ listingId }: ListingTrackerProps) {
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const hasSentView = useRef(false);
  const actions = useRef({
    clickedPhone: false,
    clickedWhatsapp: false,
    clickedEmail: false,
    clickedMap: false,
    clickedGallery: false,
    clickedShare: false,
    addedToFavorites: false,
    requestedAppointment: false,
  });

  // Visitor ID (cookie'den veya yeni oluştur)
  const getVisitorId = useCallback(() => {
    if (typeof window === "undefined") return null;

    let visitorId = localStorage.getItem("demir_visitor_id");
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("demir_visitor_id", visitorId);
    }
    return visitorId;
  }, []);

  // Session ID
  const getSessionId = useCallback(() => {
    if (typeof window === "undefined") return null;

    let sessionId = sessionStorage.getItem("demir_session_id");
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("demir_session_id", sessionId);
    }
    return sessionId;
  }, []);

  // Veri gönder
  const sendAnalytics = useCallback(
    async (isUnload = false) => {
      // Çerez izni kontrolü
      const consent = localStorage.getItem("cookie_consent");
      if (consent !== "accepted" && consent !== "settings_analytics") {
        return;
      }

      const duration = Math.round((Date.now() - startTime.current) / 1000);

      const data = {
        listingId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        duration,
        scrollDepth: maxScrollDepth.current,
        ...actions.current,
        referrer: document.referrer,
        utmSource: new URLSearchParams(window.location.search).get(
          "utm_source"
        ),
        utmMedium: new URLSearchParams(window.location.search).get(
          "utm_medium"
        ),
        utmCampaign: new URLSearchParams(window.location.search).get(
          "utm_campaign"
        ),
      };

      if (isUnload) {
        // Sayfa kapanırken beacon API kullan
        navigator.sendBeacon("/api/listing-analytics", JSON.stringify(data));
      } else {
        try {
          await fetch("/api/listing-analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        } catch {
          // Sessizce başarısız ol
        }
      }
    },
    [listingId, getVisitorId, getSessionId]
  );

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScrollDepth.current) {
        maxScrollDepth.current = scrollPercent;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // İlk görüntüleme ve sayfa kapanma
  useEffect(() => {
    // İlk görüntüleme (5 saniye sonra - bounce olmadığından emin ol)
    const viewTimer = setTimeout(() => {
      if (!hasSentView.current) {
        hasSentView.current = true;
        sendAnalytics();
      }
    }, 5000);

    // Sayfa kapanırken
    const handleUnload = () => {
      sendAnalytics(true);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearTimeout(viewTimer);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [sendAnalytics]);

  // Global action tracker
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      const button = target.closest("button");

      // Telefon tıklaması
      if (link?.href?.startsWith("tel:")) {
        actions.current.clickedPhone = true;
        sendAnalytics();
      }

      // WhatsApp tıklaması
      if (link?.href?.includes("whatsapp") || link?.href?.includes("wa.me")) {
        actions.current.clickedWhatsapp = true;
        sendAnalytics();
      }

      // Email tıklaması
      if (link?.href?.startsWith("mailto:")) {
        actions.current.clickedEmail = true;
        sendAnalytics();
      }

      // Harita tıklaması
      if (
        link?.href?.includes("maps") ||
        target.closest("[data-action='map']")
      ) {
        actions.current.clickedMap = true;
        sendAnalytics();
      }

      // Galeri tıklaması
      if (
        target.closest("[data-action='gallery']") ||
        target.closest(".gallery-trigger")
      ) {
        actions.current.clickedGallery = true;
        sendAnalytics();
      }

      // Paylaş tıklaması
      if (
        target.closest("[data-action='share']") ||
        button?.textContent?.includes("Paylaş")
      ) {
        actions.current.clickedShare = true;
        sendAnalytics();
      }

      // Favori tıklaması
      if (target.closest("[data-action='favorite']")) {
        actions.current.addedToFavorites = true;
        sendAnalytics();
      }

      // Randevu tıklaması
      if (
        target.closest("[data-action='appointment']") ||
        link?.href?.includes("randevu")
      ) {
        actions.current.requestedAppointment = true;
        sendAnalytics();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [sendAnalytics]);

  return null; // Bu component görsel render etmez
}
