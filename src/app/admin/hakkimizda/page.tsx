"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ImageUpload } from "@/components/ui/image-upload";

interface FounderProfile {
  id?: string;
  name: string;
  title: string;
  image: string;
  badgeText: string;
  heroTitle: string;
  heroTitleHighlight: string;
  narrativeTitle: string;
  narrativeParagraph1: string;
  narrativeParagraph2: string;
  narrativeDividerText: string;
  heritageTitle: string;
  heritageText: string;
  visionTitle: string;
  visionText: string;
}

interface VisionPillar {
  id: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

interface CompanyPrinciple {
  id: string;
  icon: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
}

interface ManifestoData {
  id?: string;
  shortTitle: string;
  shortText: string;
  fullTitle: string;
  fullText: string;
  signature: string;
}

type ActiveTab = "founder" | "manifesto" | "pillars" | "principles";

export default function AdminHakkimizdaPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("founder");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [founder, setFounder] = useState<FounderProfile>({
    name: "Mustafa Demir",
    title: "Kurucu & Genel Müdür",
    image: "",
    badgeText: "Kurucu Vizyonu",
    heroTitle: "Hendek'in Toprağından,",
    heroTitleHighlight: "Geleceğin Teknolojisine.",
    narrativeTitle: '"Amatör Ruh & Profesyonel Veri"',
    narrativeParagraph1: "",
    narrativeParagraph2: "",
    narrativeDividerText: "Hendek'in Toprağından, Geleceğin Teknolojisine.",
    heritageTitle: "Mirasımız",
    heritageText:
      "Demir Gayrimenkul'ün kurucusu ve sahibi olarak, proje geliştirme ve emlak sektöründeki yılların tecrübesini masaya koyuyoruz. Bölgenin toprağını, insanını ve dinamiklerini tanıyoruz.",
    visionTitle: "Vizyonumuz",
    visionText:
      "Geleneksel emlakçılık anlayışını, günümüz modern teknolojileri ile birleştiriyoruz. Amacımız sadece mülk satmak değil, bölgenin gelişimine modern araçlarla liderlik etmektir.",
  });

  const [manifesto, setManifesto] = useState<ManifestoData>({
    shortTitle: "Manifesto",
    shortText: "",
    fullTitle: "Manifesto",
    fullText: "",
    signature: "— Mustafa Demir",
  });

  const [pillars, setPillars] = useState<VisionPillar[]>([]);
  const [principles, setPrinciples] = useState<CompanyPrinciple[]>([]);

  // Edit states
  const [editingPillar, setEditingPillar] = useState<VisionPillar | null>(null);
  const [editingPrinciple, setEditingPrinciple] =
    useState<CompanyPrinciple | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aboutRes, manifestoRes] = await Promise.all([
        fetch("/api/about"),
        fetch("/api/manifesto"),
      ]);

      const aboutData = await aboutRes.json();
      const manifestoData = await manifestoRes.json();

      if (aboutData.founder) setFounder(aboutData.founder);
      if (aboutData.pillars) setPillars(aboutData.pillars);
      if (aboutData.principles) setPrinciples(aboutData.principles);
      if (manifestoData) setManifesto(manifestoData);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveFounder = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founder }),
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kaydetme hatası");
      }

      alert("Kurucu bilgileri kaydedildi!");
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert(
        "Kaydetme hatası: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata")
      );
    } finally {
      setSaving(false);
    }
  };

  const saveManifesto = async () => {
    setSaving(true);
    try {
      await fetch("/api/manifesto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifesto),
      });
      alert("Manifesto kaydedildi!");
    } catch (error) {
      alert("Kaydetme hatası!");
    } finally {
      setSaving(false);
    }
  };

  const savePillar = async (pillar: VisionPillar) => {
    setSaving(true);
    try {
      if (pillar.id) {
        await fetch("/api/about/pillars", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pillar),
        });
      } else {
        await fetch("/api/about/pillars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pillar),
        });
      }
      await loadData();
      setEditingPillar(null);
    } catch (error) {
      alert("Kaydetme hatası!");
    } finally {
      setSaving(false);
    }
  };

  const deletePillar = async (id: string) => {
    if (!confirm("Bu temeli silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/about/pillars?id=${id}`, { method: "DELETE" });
      await loadData();
    } catch (error) {
      alert("Silme hatası!");
    }
  };

  const savePrinciple = async (principle: CompanyPrinciple) => {
    setSaving(true);
    try {
      if (principle.id) {
        await fetch("/api/about/principles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(principle),
        });
      } else {
        await fetch("/api/about/principles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(principle),
        });
      }
      await loadData();
      setEditingPrinciple(null);
    } catch (error) {
      alert("Kaydetme hatası!");
    } finally {
      setSaving(false);
    }
  };

  const deletePrinciple = async (id: string) => {
    if (!confirm("Bu ilkeyi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/about/principles?id=${id}`, { method: "DELETE" });
      await loadData();
    } catch (error) {
      alert("Silme hatası!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const tabs = [
    { id: "founder" as const, label: "Kurucu Profili", icon: "person" },
    { id: "manifesto" as const, label: "Manifesto", icon: "format_quote" },
    { id: "pillars" as const, label: "Vizyon Temelleri", icon: "foundation" },
    { id: "principles" as const, label: "Şirket İlkeleri", icon: "verified" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hakkımızda Sayfası</h1>
          <p className="text-slate-400 text-sm mt-1">
            Kurucu profili, manifesto ve şirket değerlerini yönetin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Icon name={tab.icon} className="text-lg" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        {/* Founder Tab */}
        {activeTab === "founder" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={founder.name}
                  onChange={(e) =>
                    setFounder({ ...founder, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ünvan
                </label>
                <input
                  type="text"
                  value={founder.title}
                  onChange={(e) =>
                    setFounder({ ...founder, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <ImageUpload
              value={founder.image}
              onChange={(url) => setFounder({ ...founder, image: url })}
              folder="founder"
              aspectRatio="3:4"
              recommendedSize="600x800"
              label="Kurucu Fotoğrafı"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Badge Metni
                </label>
                <input
                  type="text"
                  value={founder.badgeText}
                  onChange={(e) =>
                    setFounder({ ...founder, badgeText: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bölüm Ayırıcı Metin
                </label>
                <input
                  type="text"
                  value={founder.narrativeDividerText}
                  onChange={(e) =>
                    setFounder({
                      ...founder,
                      narrativeDividerText: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hero Başlık
              </label>
              <input
                type="text"
                value={founder.heroTitle}
                onChange={(e) =>
                  setFounder({ ...founder, heroTitle: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hero Başlık Vurgu (Gri renkte görünür)
              </label>
              <input
                type="text"
                value={founder.heroTitleHighlight}
                onChange={(e) =>
                  setFounder({ ...founder, heroTitleHighlight: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hikaye Başlığı
              </label>
              <input
                type="text"
                value={founder.narrativeTitle}
                onChange={(e) =>
                  setFounder({ ...founder, narrativeTitle: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hikaye Paragraf 1
              </label>
              <textarea
                value={founder.narrativeParagraph1}
                onChange={(e) =>
                  setFounder({
                    ...founder,
                    narrativeParagraph1: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hikaye Paragraf 2
              </label>
              <textarea
                value={founder.narrativeParagraph2}
                onChange={(e) =>
                  setFounder({
                    ...founder,
                    narrativeParagraph2: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
              />
            </div>

            {/* Mirasımız & Vizyonumuz Kartları */}
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon name="view_agenda" className="text-emerald-400" />
                Mirasımız & Vizyonumuz Kartları
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Bu kartlar bölüm ayırıcı metnin altında yan yana görünür.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mirasımız */}
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="history" className="text-[var(--terracotta)]" />
                    <label className="text-sm font-medium text-slate-300">
                      Mirasımız Başlık
                    </label>
                  </div>
                  <input
                    type="text"
                    value={founder.heritageTitle || ""}
                    onChange={(e) =>
                      setFounder({ ...founder, heritageTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white mb-3"
                  />
                  <label className="block text-sm text-slate-400 mb-1">
                    Mirasımız Açıklama
                  </label>
                  <textarea
                    value={founder.heritageText || ""}
                    onChange={(e) =>
                      setFounder({ ...founder, heritageText: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>

                {/* Vizyonumuz */}
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="visibility" className="text-[var(--forest)]" />
                    <label className="text-sm font-medium text-slate-300">
                      Vizyonumuz Başlık
                    </label>
                  </div>
                  <input
                    type="text"
                    value={founder.visionTitle || ""}
                    onChange={(e) =>
                      setFounder({ ...founder, visionTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white mb-3"
                  />
                  <label className="block text-sm text-slate-400 mb-1">
                    Vizyonumuz Açıklama
                  </label>
                  <textarea
                    value={founder.visionText || ""}
                    onChange={(e) =>
                      setFounder({ ...founder, visionText: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveFounder}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <Icon name={saving ? "hourglass_empty" : "save"} />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        )}

        {/* Manifesto Tab */}
        {activeTab === "manifesto" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <Icon name="info" className="inline mr-2" />
                Kısa versiyon ana sayfada, uzun versiyon hakkımızda sayfasında
                görünür.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kısa Başlık (Ana Sayfa)
                </label>
                <input
                  type="text"
                  value={manifesto.shortTitle}
                  onChange={(e) =>
                    setManifesto({ ...manifesto, shortTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Uzun Başlık (Hakkımızda)
                </label>
                <input
                  type="text"
                  value={manifesto.fullTitle}
                  onChange={(e) =>
                    setManifesto({ ...manifesto, fullTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Kısa Metin (Ana Sayfa - 1-2 cümle)
              </label>
              <textarea
                value={manifesto.shortText}
                onChange={(e) =>
                  setManifesto({ ...manifesto, shortText: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                placeholder="Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Uzun Metin (Hakkımızda - Detaylı)
              </label>
              <textarea
                value={manifesto.fullText}
                onChange={(e) =>
                  setManifesto({ ...manifesto, fullText: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                placeholder="Teknolojiyi benimsemiyoruz; onu yerel uzmanlığımızı ölçeklendirmek için kullanıyoruz. Hendek'in toprağını biliyoruz, şimdi bu toprağa dijital geleceği getiriyoruz. Her veri noktası, nesiller boyu biriken tecrübenin dijital yansımasıdır."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                İmza
              </label>
              <input
                type="text"
                value={manifesto.signature}
                onChange={(e) =>
                  setManifesto({ ...manifesto, signature: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                placeholder="— Mustafa Demir"
              />
            </div>

            <button
              onClick={saveManifesto}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <Icon name={saving ? "hourglass_empty" : "save"} />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        )}

        {/* Pillars Tab */}
        {activeTab === "pillars" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm">
                Hakkımızda sayfasında "Vizyonumuzun Temelleri" bölümünde görünür
              </p>
              <button
                onClick={() =>
                  setEditingPillar({
                    id: "",
                    icon: "star",
                    title: "",
                    description: "",
                    sortOrder: pillars.length,
                    isActive: true,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
              >
                <Icon name="add" />
                Yeni Temel Ekle
              </button>
            </div>

            {/* Pillar List */}
            <div className="space-y-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Icon name={pillar.icon} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{pillar.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-1">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingPillar(pillar)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      onClick={() => deletePillar(pillar.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Modal */}
            {editingPillar && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {editingPillar.id ? "Temel Düzenle" : "Yeni Temel"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={editingPillar.icon}
                        onChange={(e) =>
                          setEditingPillar({
                            ...editingPillar,
                            icon: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                        placeholder="forest, neurology, handshake..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Başlık
                      </label>
                      <input
                        type="text"
                        value={editingPillar.title}
                        onChange={(e) =>
                          setEditingPillar({
                            ...editingPillar,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        value={editingPillar.description}
                        onChange={(e) =>
                          setEditingPillar({
                            ...editingPillar,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingPillar(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => savePillar(editingPillar)}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Principles Tab */}
        {activeTab === "principles" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm">
                Hakkımızda sayfasının alt kısmında "Demir Gayrimenkul İlkeleri"
                olarak görünür
              </p>
              <button
                onClick={() =>
                  setEditingPrinciple({
                    id: "",
                    icon: "verified",
                    title: "",
                    sortOrder: principles.length,
                    isActive: true,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
              >
                <Icon name="add" />
                Yeni İlke Ekle
              </button>
            </div>

            {/* Principle List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {principles.map((principle) => (
                <div
                  key={principle.id}
                  className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-center group"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon
                      name={principle.icon}
                      className="text-2xl text-white"
                    />
                  </div>
                  <p className="text-sm font-medium text-white">
                    {principle.title}
                  </p>
                  <div className="flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingPrinciple(principle)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Icon name="edit" className="text-sm" />
                    </button>
                    <button
                      onClick={() => deletePrinciple(principle.id)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Icon name="delete" className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Modal */}
            {editingPrinciple && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {editingPrinciple.id ? "İlke Düzenle" : "Yeni İlke"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={editingPrinciple.icon}
                        onChange={(e) =>
                          setEditingPrinciple({
                            ...editingPrinciple,
                            icon: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                        placeholder="verified, query_stats, location_on..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        Başlık
                      </label>
                      <input
                        type="text"
                        value={editingPrinciple.title}
                        onChange={(e) =>
                          setEditingPrinciple({
                            ...editingPrinciple,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingPrinciple(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => savePrinciple(editingPrinciple)}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
