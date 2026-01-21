"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  Landmark,
  Store,
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Trash2,
  Database,
  Globe,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

// Kategori tanımları
const CATEGORIES = [
  {
    id: "konut",
    label: "Konut",
    icon: Home,
    color: "blue",
    transactions: [
      { id: "konut_satilik", label: "Satılık", type: "satilik" },
      { id: "konut_kiralik", label: "Kiralık", type: "kiralik" },
    ],
  },
  {
    id: "arsa",
    label: "Arsa",
    icon: Landmark,
    color: "green",
    transactions: [{ id: "arsa_satilik", label: "Satılık", type: "satilik" }],
  },
  {
    id: "isyeri",
    label: "İşyeri",
    icon: Store,
    color: "purple",
    transactions: [
      { id: "isyeri_satilik", label: "Satılık", type: "satilik" },
      { id: "isyeri_kiralik", label: "Kiralık", type: "kiralik" },
    ],
  },
  {
    id: "bina",
    label: "Bina",
    icon: Building2,
    color: "orange",
    transactions: [{ id: "bina", label: "Satılık", type: "satilik" }],
  },
];

interface CategoryData {
  comparison: {
    sahibinden: number;
    database: number;
    diff: number;
    status: "new" | "removed" | "synced";
  };
  newListings: any[];
  removedListings: any[];
  lastUpdate: string;
  isLoading: boolean;
}

export default function SahibindenIncelemePage() {
  const [activeCategory, setActiveCategory] = useState("konut");
  const [categoryData, setCategoryData] = useState<
    Record<string, CategoryData>
  >({});
  const [crawlerStatus, setCrawlerStatus] = useState<"idle" | "running">(
    "idle",
  );
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    [],
  );

  // İlk yükleme - sadece aktif kategori için
  React.useEffect(() => {
    loadCategoryData(activeCategory);
  }, [activeCategory]);

  // Kategori verilerini yükle - Crawler API kaldırıldı
  const loadCategoryData = async (categoryId: string) => {
    setCategoryData((prev) => ({
      ...prev,
      [categoryId]: {
        comparison: {
          sahibinden: 0,
          database: 0,
          diff: 0,
          status: "synced" as const,
        },
        newListings: [],
        removedListings: [],
        lastUpdate: new Date().toISOString(),
        isLoading: false,
      },
    }));

    // Crawler sistemi Flask Admin Panel'e taşındı
    console.warn("Crawler API kaldırıldı - Flask Admin Panel kullanın");
  };

  // Crawler başlat - API kaldırıldı
  const startCrawler = async () => {
    alert(
      "Crawler sistemi Flask Admin Panel'e taşındı. Lütfen Flask Admin Panel'i kullanın.",
    );
    return;
  };

  // Job durumunu takip et
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/crawler/jobs/${jobId}`);
        const result = await response.json();

        if (result.data?.status === "completed") {
          clearInterval(interval);
          setCrawlerStatus("idle");
          loadCategoryData(activeCategory);
          alert("Veri toplama tamamlandı!");
        } else if (result.data?.status === "failed") {
          clearInterval(interval);
          setCrawlerStatus("idle");
          alert("Veri toplama başarısız!");
        }
      } catch (error) {
        console.error("Job takip hatası:", error);
      }
    }, 3000);
  };

  // Kategori seçimi toggle
  const toggleTransaction = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId],
    );
  };

  const currentData = categoryData[activeCategory];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sahibinden İnceleme</h1>
          <p className="text-slate-300 mt-1 text-base">
            Emlak ilanlarını topla, karşılaştır ve analiz et
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`px-3 py-1.5 text-sm font-semibold ${
              crawlerStatus === "running"
                ? "bg-green-600 text-white border-green-500"
                : "bg-slate-700 text-slate-200 border-slate-600"
            }`}
          >
            {crawlerStatus === "running" ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Çalışıyor
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Hazır
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Kategori Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700 p-1">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300 font-medium"
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-6 mt-6"
          >
            {/* Kontrol Paneli */}
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-2 text-white text-xl">
                  <Play className="h-5 w-5 text-green-400" />
                  Veri Toplama Kontrolü
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Transaction Seçimi */}
                <div>
                  <label className="text-sm text-slate-200 mb-3 block font-semibold">
                    Toplanacak Kategoriler:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {category.transactions.map((transaction) => (
                      <Button
                        key={transaction.id}
                        size="sm"
                        onClick={() => toggleTransaction(transaction.id)}
                        className={
                          selectedTransactions.includes(transaction.id)
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 font-medium"
                        }
                      >
                        {transaction.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={startCrawler}
                    disabled={
                      crawlerStatus === "running" ||
                      selectedTransactions.length === 0
                    }
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-700 disabled:text-slate-500 font-semibold"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Veri Toplamayı Başlat
                  </Button>
                  <Button
                    onClick={() => loadCategoryData(category.id)}
                    disabled={currentData?.isLoading}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 font-semibold"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${currentData?.isLoading ? "animate-spin" : ""}`}
                    />
                    Verileri Yenile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Karşılaştırma */}
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="pt-6">
                  {!currentData ? (
                    <div className="text-center py-4 text-slate-400">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Veri yok</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-400" />
                          <span className="text-sm text-slate-200 font-medium">
                            Veritabanı
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-white">
                          {currentData?.comparison?.database || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-green-400" />
                          <span className="text-sm text-slate-200 font-medium">
                            Sahibinden
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-white">
                          {currentData?.comparison?.sahibinden || 0}
                        </span>
                      </div>
                      {currentData?.comparison && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300 font-medium">
                              Fark
                            </span>
                            <Badge
                              className={
                                currentData.comparison.status === "new"
                                  ? "bg-emerald-600 text-white"
                                  : currentData.comparison.status === "removed"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-700 text-slate-200"
                              }
                            >
                              {currentData.comparison.diff > 0 ? "+" : ""}
                              {currentData.comparison.diff}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Yeni İlanlar */}
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm text-slate-200 font-medium">
                          Yeni İlanlar
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-400">
                        {currentData?.newListings?.length || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-yellow-400/30" />
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    {currentData
                      ? "Son 2 gün içinde eklenen"
                      : "Veri yüklenmedi"}
                  </p>
                </CardContent>
              </Card>

              {/* Kaldırılan İlanlar */}
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        <span className="text-sm text-slate-200 font-medium">
                          Kaldırılan
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-red-400">
                        {currentData?.removedListings?.length || 0}
                      </p>
                    </div>
                    <TrendingDown className="h-10 w-10 text-red-400/30" />
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    {currentData ? "Artık mevcut değil" : "Veri yüklenmedi"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detaylı Listeler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Yeni İlanlar Listesi */}
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    Yeni Eklenen İlanlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {!currentData ? (
                    <div className="text-center py-12 text-slate-400">
                      <Sparkles className="h-16 w-16 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium mb-2">
                        Veri Yüklenmedi
                      </p>
                      <p className="text-sm">
                        "Verileri Yenile" butonuna tıklayın
                      </p>
                    </div>
                  ) : currentData?.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mb-3" />
                      <p className="text-slate-300">Yükleniyor...</p>
                    </div>
                  ) : currentData?.newListings?.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {currentData.newListings
                        .slice(0, 10)
                        .map((listing: any) => (
                          <div
                            key={listing.id}
                            className="border border-slate-700 rounded-lg p-3 hover:border-yellow-500/50 transition-colors bg-slate-900/50"
                          >
                            <div className="flex gap-3">
                              {listing.resim && (
                                <img
                                  src={listing.resim}
                                  alt={listing.baslik}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white line-clamp-1">
                                  {listing.baslik}
                                </h4>
                                <p className="text-xs text-slate-300 mt-1">
                                  {listing.konum}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-bold text-green-400">
                                    {new Intl.NumberFormat("tr-TR", {
                                      style: "currency",
                                      currency: "TRY",
                                      minimumFractionDigits: 0,
                                    }).format(listing.fiyat)}
                                  </span>
                                  <a
                                    href={listing.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Yeni ilan bulunmuyor</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kaldırılan İlanlar Listesi */}
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    Kaldırılan İlanlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {!currentData ? (
                    <div className="text-center py-12 text-slate-400">
                      <Trash2 className="h-16 w-16 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium mb-2">
                        Veri Yüklenmedi
                      </p>
                      <p className="text-sm">
                        "Verileri Yenile" butonuna tıklayın
                      </p>
                    </div>
                  ) : currentData?.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-red-400 mb-3" />
                      <p className="text-slate-300">Yükleniyor...</p>
                    </div>
                  ) : currentData?.removedListings?.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {currentData.removedListings
                        .slice(0, 10)
                        .map((listing: any) => (
                          <div
                            key={listing.id}
                            className="border border-slate-700 rounded-lg p-3 hover:border-red-500/50 transition-colors opacity-75 bg-slate-900/50"
                          >
                            <div className="flex gap-3">
                              {listing.resim && (
                                <img
                                  src={listing.resim}
                                  alt={listing.baslik}
                                  className="w-16 h-16 object-cover rounded grayscale"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white line-clamp-1">
                                  {listing.baslik}
                                </h4>
                                <p className="text-xs text-slate-300 mt-1">
                                  {listing.konum}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-bold text-slate-400">
                                    {new Intl.NumberFormat("tr-TR", {
                                      style: "currency",
                                      currency: "TRY",
                                      minimumFractionDigits: 0,
                                    }).format(
                                      listing.fiyat || listing.last_price,
                                    )}
                                  </span>
                                  <Badge className="text-xs bg-red-600/20 text-red-400 border-red-600">
                                    Kaldırıldı
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Trash2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Kaldırılan ilan bulunmuyor</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Son Güncelleme */}
            {currentData?.lastUpdate && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>
                  Son güncelleme:{" "}
                  {new Date(currentData.lastUpdate).toLocaleString("tr-TR")}
                </span>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
