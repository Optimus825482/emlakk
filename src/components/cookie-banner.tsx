"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ConsentType = "accepted" | "rejected" | "settings_analytics" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentType>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cookie_consent") as ConsentType;
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setConsent("accepted");
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setConsent("rejected");
  };

  const handleSaveSettings = () => {
    const value = analyticsEnabled ? "settings_analytics" : "rejected";
    localStorage.setItem("cookie_consent", value);
    setConsent(value as ConsentType);
    setShowSettings(false);
  };

  if (!mounted || consent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-blue-600 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white text-sm md:text-base text-center md:text-left">
              Web sitemizde size daha iyi hizmet verebilmek için çerezler
              kullanılmaktadır. Kabul Et seçeneği ile tüm çerezleri kabul
              edebilir, Reddet seçeneği ile zorunlu çerezler haricindeki tüm
              çerezleri reddedebilir veya Çerez Ayarları seçeneği ile çerezler
              hakkında daha fazla bilgi alıp tercihlerinizi yönetebilirsiniz.{" "}
              <Link href="/cerez-politikasi" className="underline font-medium">
                Çerez Politikası
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-semibold
                  hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
              >
                Kabul Et
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2.5 bg-transparent border-2 border-white text-white
                  rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
              >
                Reddet
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-2.5 bg-transparent border-2 border-white text-white
                  rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
              >
                Ayarlar
              </button>
            </div>
          </div>
        ) : (
          <Settings
            analyticsEnabled={analyticsEnabled}
            setAnalyticsEnabled={setAnalyticsEnabled}
            onSave={handleSaveSettings}
            onBack={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

interface SettingsProps {
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (v: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

function Settings({
  analyticsEnabled,
  setAnalyticsEnabled,
  onSave,
  onBack,
}: SettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Çerez Ayarları</h3>
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white text-sm"
        >
          ← Geri
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
          <div>
            <p className="text-white font-medium">Zorunlu Çerezler</p>
            <p className="text-white/70 text-sm">
              Site işlevselliği için gerekli
            </p>
          </div>
          <span className="text-emerald-300 text-sm font-medium">
            Her zaman aktif
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
          <div>
            <p className="text-white font-medium">Analitik Çerezler</p>
            <p className="text-white/70 text-sm">
              Site kullanımını anlamamıza yardımcı olur
            </p>
          </div>
          <button
            onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              analyticsEnabled ? "bg-emerald-500" : "bg-slate-500"
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                analyticsEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={onSave}
        className="w-full py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
      >
        Ayarları Kaydet
      </button>
    </div>
  );
}
