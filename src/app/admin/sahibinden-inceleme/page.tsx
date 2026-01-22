"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Building2,
  Landmark,
  Store,
  RefreshCw,
  TrendingUp,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  ArrowLeft,
} from "lucide-react";

interface CategoryStat {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

interface District {
  value: string;
  label: string;
  count: number;
}

interface StatsResponse {
  success: boolean;
  data?: {
    categories: CategoryStat[];
    total: number;
    lastUpdate: string;
    district?: string;
  };
  error?: string;
}

const ICON_MAP: Record<string, any> = {
  home: Home,
  key: Key,
  landscape: Landmark,
  store: Store,
  storefront: Building2,
  domain: Building2,
};

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  cyan: "from-cyan-500 to-cyan-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
};

const BORDER_COLOR_MAP: Record<string, string> = {
  blue: "border-blue-500/30",
  cyan: "border-cyan-500/30",
  green: "border-green-500/30",
  purple: "border-purple-500/30",
  orange: "border-orange-500/30",
  red: "border-red-500/30",
};

const BG_COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/10",
  cyan: "bg-cyan-500/10",
  green: "bg-green-500/10",
  purple: "bg-purple-500/10",
  orange: "bg-orange-500/10",
  red: "bg-red-500/10",
};

export default function SahibindenIncelemePage() {
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Hendek"); // Default: Hendek
  const [neighborhoods, setNeighborhoods] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [filteredView, setFilteredView] = useState<{
    mahalle: string;
    category: string;
    transaction: string;
  } | null>(null);

  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/sahibinden/districts");
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error("Districts fetch error:", error);
    }
  };

  const fetchNeighborhoods = async (district: string) => {
    if (!district || district === "all") {
      setNeighborhoods([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/sahibinden/neighborhoods?ilce=${district}`,
      );
      const data = await response.json();
      if (data.success) {
        setNeighborhoods(data.data);
      }
    } catch (error) {
      console.error("Neighborhoods fetch error:", error);
    }
  };

  const fetchNeighborhoodReport = async (district?: string) => {
    try {
      setReportLoading(true);
      const url =
        district && district !== "all"
          ? `/api/sahibinden/neighborhood-report?ilce=${district}`
          : `/api/sahibinden/neighborhood-report`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error("Neighborhood report fetch error:", error);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchStats = async (
    district?: string,
    neighborhood?: string,
    category?: string,
    transaction?: string,
  ) => {
    try {
      setRefreshing(true);
      setError(null);

      let url = "/api/sahibinden/category-stats";
      const params = new URLSearchParams();
      // Use arguments if provided, otherwise fallback to state or skip
      // Actually strictly using arguments is safer for avoiding stale closures issues in async,
      // but usually effects read fresh state.
      // However, the caller 'handleDistrictChange' calls this immediately with the new value.
      // So let's stick to arguments or fallback to state.

      const d = district ?? selectedDistrict;
      const n = neighborhood ?? selectedNeighborhood;
      const c = category ?? selectedCategory;
      const t = transaction ?? selectedTransaction;

      if (d && d !== "all") params.append("ilce", d);
      if (n && n !== "all") params.append("neighborhood", n);
      if (c && c !== "all") params.append("category", c);
      if (t && t !== "all") params.append("transaction", t);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result: StatsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Veri alınamadı");
      }

      setStats(result.data || null);
    } catch (err: any) {
      console.error("Stats fetch error:", err);
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchListings = async () => {
    try {
      setListingsLoading(true);
      const params = new URLSearchParams();
      if (selectedDistrict !== "all") params.append("ilce", selectedDistrict);
      if (selectedNeighborhood !== "all")
        params.append("neighborhood", selectedNeighborhood);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedTransaction !== "all")
        params.append("transaction", selectedTransaction);
      params.append("sort", sortBy);
      params.append("limit", "50");

      const response = await fetch(
        `/api/sahibinden/listings?${params.toString()}`,
      );
      const data = await response.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (error) {
      console.error("Listings fetch error:", error);
    } finally {
      setListingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
    fetchStats("Hendek"); // Default: Hendek
    fetchListings();
    // Fetch initial reports with Hendek
    fetchNeighborhoodReport("Hendek");
  }, []);

  // Update stats and listings when filters change
  useEffect(() => {
    fetchListings();
    fetchStats(selectedDistrict, selectedNeighborhood);
  }, [
    selectedDistrict,
    selectedNeighborhood,
    selectedCategory,
    selectedTransaction,
    sortBy,
  ]);

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedNeighborhood("all"); // Reset neighborhood
    fetchNeighborhoods(value);
  };

  // Group report data by district
  const groupedReport = (reportData || []).reduce((acc: any, curr: any) => {
    if (!acc[curr.district]) acc[curr.district] = [];
    acc[curr.district].push(curr);
    return acc;
  }, {});

  // Handle category click - navigate to filtered listings
  const handleCategoryClick = (
    mahalle: string,
    category: string,
    transaction: string,
  ) => {
    setFilteredView({ mahalle, category, transaction });
    setSelectedNeighborhood(mahalle);
    setSelectedCategory(category);
    setSelectedTransaction(transaction);
    setActiveTab("overview");
    // fetchListings will be triggered by useEffect
  };

  // Handle back to report
  const handleBackToReport = () => {
    setFilteredView(null);
    setSelectedNeighborhood("all");
    setSelectedCategory("all");
    setSelectedTransaction("all");
    setActiveTab("report");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Sahibinden.com Takip
            </h1>
            <p className="text-slate-300 mt-1 text-base">
              Kategori bazlı ilan sayıları, filtreleme ve detaylı analiz
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "overview" ? "default" : "secondary"}
              onClick={() => setActiveTab("overview")}
              className={
                activeTab === "overview"
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }
            >
              Genel Bakış
            </Button>
            <Button
              variant={activeTab === "report" ? "default" : "secondary"}
              onClick={() => {
                setActiveTab("report");
                fetchNeighborhoodReport(selectedDistrict);
              }}
              className={
                activeTab === "report"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }
            >
              Mahalle Raporu
            </Button>
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Back to Report Button - Only show when filtered from report */}
            {filteredView && (
              <Card className="bg-blue-900/20 border-blue-500/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleBackToReport}
                        variant="outline"
                        className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Mahalle Raporuna Dön
                      </Button>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className="bg-blue-600 text-white">
                          {filteredView.mahalle}
                        </Badge>
                        <span className="text-slate-400">•</span>
                        <Badge className="bg-emerald-600 text-white">
                          {filteredView.category}
                        </Badge>
                        <span className="text-slate-400">•</span>
                        <Badge className="bg-purple-600 text-white">
                          {filteredView.transaction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  fetchStats(selectedDistrict, selectedNeighborhood);
                  fetchListings();
                }}
                disabled={refreshing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Yenile
              </Button>
            </div>

            {/* Filters Panel */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* District Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">İlçe</label>
                  <Select
                    value={selectedDistrict}
                    onValueChange={handleDistrictChange}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="İlçe Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm İlçeler</SelectItem>
                      {districts.map((d) => (
                        <SelectItem key={d.value} value={d.label}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Neighborhood Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Mahalle</label>
                  <Select
                    value={selectedNeighborhood}
                    onValueChange={setSelectedNeighborhood}
                    disabled={selectedDistrict === "all"}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Mahalle Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {neighborhoods.map((n) => (
                        <SelectItem key={n.id} value={n.name}>
                          {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Kategori</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Konut">Konut</SelectItem>
                      <SelectItem value="Arsa">Arsa</SelectItem>
                      <SelectItem value="İşyeri">İşyeri</SelectItem>
                      <SelectItem value="Bina">Bina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction Filter */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">İşlem</label>
                  <Select
                    value={selectedTransaction}
                    onValueChange={setSelectedTransaction}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="İşlem Tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Satılık">Satılık</SelectItem>
                      <SelectItem value="Kiralık">Kiralık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Sıralama</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sıralama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">En Yeni</SelectItem>
                      <SelectItem value="date_asc">En Eski</SelectItem>
                      <SelectItem value="price_asc">
                        Fiyat (Düşükten Yükseğe)
                      </SelectItem>
                      <SelectItem value="price_desc">
                        Fiyat (Yüksekten Düşüğe)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {activeTab === "report" ? (
        <div className="space-y-6">
          {/* Mahalle Raporu Header ve Filtre */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Mahalle Bazlı İstatistikler
                  </h2>
                  <p className="text-sm text-slate-400">
                    İlçe seçerek mahalle bazında detaylı analiz görüntüleyin
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">İlçe Seçin</label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={(value) => {
                        setSelectedDistrict(value);
                        fetchNeighborhoodReport(value);
                      }}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-48">
                        <SelectValue placeholder="İlçe Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm İlçeler</SelectItem>
                        {districts.map((d) => (
                          <SelectItem key={d.value} value={d.label}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => fetchNeighborhoodReport(selectedDistrict)}
                    disabled={reportLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white mt-5"
                  >
                    {reportLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Yenile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mahalle Raporu Tablosu */}
          <div className="space-y-8">
            {selectedDistrict !== "all" ? (
              // Show single district table
              <div key={selectedDistrict} className="space-y-3">
                <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">
                  {selectedDistrict} Mahalle Raporu
                </h2>
                {reportLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/50">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs uppercase bg-slate-900 text-slate-400 font-bold">
                        <tr>
                          <th className="px-6 py-3">Mahalle</th>
                          <th className="px-6 py-3 text-center text-blue-400">
                            Konut (Sat)
                          </th>
                          <th className="px-6 py-3 text-center text-cyan-400">
                            Konut (Kir)
                          </th>
                          <th className="px-6 py-3 text-center text-green-400">
                            Arsa (Sat)
                          </th>
                          <th className="px-6 py-3 text-center text-purple-400">
                            İşyeri (Sat)
                          </th>
                          <th className="px-6 py-3 text-center text-orange-400">
                            İşyeri (Kir)
                          </th>
                          <th className="px-6 py-3 text-center text-red-400">
                            Bina (Sat)
                          </th>
                          <th className="px-6 py-3 text-center text-white bg-slate-800">
                            Toplam
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedReport[selectedDistrict]?.map(
                          (row: any, i: number) => (
                            <tr
                              key={i}
                              className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium text-white">
                                {row.neighborhood}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "Konut",
                                      "Satılık",
                                    )
                                  }
                                  disabled={!row.konut_satilik}
                                  className={`${
                                    row.konut_satilik
                                      ? "text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.konut_satilik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "Konut",
                                      "Kiralık",
                                    )
                                  }
                                  disabled={!row.konut_kiralik}
                                  className={`${
                                    row.konut_kiralik
                                      ? "text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.konut_kiralik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "Arsa",
                                      "Satılık",
                                    )
                                  }
                                  disabled={!row.arsa_satilik}
                                  className={`${
                                    row.arsa_satilik
                                      ? "text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.arsa_satilik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "İşyeri",
                                      "Satılık",
                                    )
                                  }
                                  disabled={!row.isyeri_satilik}
                                  className={`${
                                    row.isyeri_satilik
                                      ? "text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.isyeri_satilik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "İşyeri",
                                      "Kiralık",
                                    )
                                  }
                                  disabled={!row.isyeri_kiralik}
                                  className={`${
                                    row.isyeri_kiralik
                                      ? "text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.isyeri_kiralik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    handleCategoryClick(
                                      row.neighborhood,
                                      "Bina",
                                      "Satılık",
                                    )
                                  }
                                  disabled={!row.bina_satilik}
                                  className={`${
                                    row.bina_satilik
                                      ? "text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                      : "text-slate-600 cursor-not-allowed"
                                  } transition-colors`}
                                >
                                  {row.bina_satilik || "-"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-white bg-slate-800/50">
                                {row.total}
                              </td>
                            </tr>
                          ),
                        )}
                        {(!groupedReport[selectedDistrict] ||
                          groupedReport[selectedDistrict].length === 0) && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-8 text-center text-slate-500"
                            >
                              Veri bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              Object.keys(groupedReport)
                .sort()
                .map((distName) => (
                  <div key={distName} className="space-y-3">
                    <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                      {distName}
                      <Badge
                        variant="secondary"
                        className="bg-slate-800 text-slate-400"
                      >
                        {groupedReport[distName]?.length} Mahalle
                      </Badge>
                    </h2>
                    {reportLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/50">
                        <table className="w-full text-sm text-left text-slate-300">
                          <thead className="text-xs uppercase bg-slate-900 text-slate-400 font-bold">
                            <tr>
                              <th className="px-6 py-3">Mahalle</th>
                              <th className="px-6 py-3 text-center text-blue-400">
                                Konut (Sat)
                              </th>
                              <th className="px-6 py-3 text-center text-cyan-400">
                                Konut (Kir)
                              </th>
                              <th className="px-6 py-3 text-center text-green-400">
                                Arsa (Sat)
                              </th>
                              <th className="px-6 py-3 text-center text-purple-400">
                                İşyeri (Sat)
                              </th>
                              <th className="px-6 py-3 text-center text-orange-400">
                                İşyeri (Kir)
                              </th>
                              <th className="px-6 py-3 text-center text-red-400">
                                Bina (Sat)
                              </th>
                              <th className="px-6 py-3 text-center text-white bg-slate-800">
                                Toplam
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedReport[distName].map(
                              (row: any, i: number) => (
                                <tr
                                  key={i}
                                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                                >
                                  <td className="px-6 py-4 font-medium text-white">
                                    {row.neighborhood}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "Konut",
                                          "Satılık",
                                        )
                                      }
                                      disabled={!row.konut_satilik}
                                      className={`${
                                        row.konut_satilik
                                          ? "text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.konut_satilik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "Konut",
                                          "Kiralık",
                                        )
                                      }
                                      disabled={!row.konut_kiralik}
                                      className={`${
                                        row.konut_kiralik
                                          ? "text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.konut_kiralik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "Arsa",
                                          "Satılık",
                                        )
                                      }
                                      disabled={!row.arsa_satilik}
                                      className={`${
                                        row.arsa_satilik
                                          ? "text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.arsa_satilik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "İşyeri",
                                          "Satılık",
                                        )
                                      }
                                      disabled={!row.isyeri_satilik}
                                      className={`${
                                        row.isyeri_satilik
                                          ? "text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.isyeri_satilik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "İşyeri",
                                          "Kiralık",
                                        )
                                      }
                                      disabled={!row.isyeri_kiralik}
                                      className={`${
                                        row.isyeri_kiralik
                                          ? "text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.isyeri_kiralik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() =>
                                        handleCategoryClick(
                                          row.neighborhood,
                                          "Bina",
                                          "Satılık",
                                        )
                                      }
                                      disabled={!row.bina_satilik}
                                      className={`${
                                        row.bina_satilik
                                          ? "text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                          : "text-slate-600 cursor-not-allowed"
                                      } transition-colors`}
                                    >
                                      {row.bina_satilik || "-"}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-white bg-slate-800/50">
                                    {row.total}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
            )}

            {!selectedDistrict &&
              Object.keys(groupedReport).length === 0 &&
              !reportLoading && (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
                  Rapor verileri yüklenemedi veya veri yok.
                </div>
              )}
          </div>
        </div>
      ) : (
        <>
          {/* Error State */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-400">Hata Oluştu</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && !stats && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-slate-300 text-lg">Veriler yükleniyor...</p>
            </div>
          )}

          {/* Stats Content */}
          {stats && (
            <>
              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 font-medium mb-1">
                        Toplam İlan Sayısı
                      </p>
                      <p className="text-5xl font-bold text-white">
                        {stats.total.toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>
                        Son güncelleme:{" "}
                        {(() => {
                          if (!stats.lastUpdate) return "Bilinmiyor";
                          const date = new Date(stats.lastUpdate);
                          return !isNaN(date.getTime())
                            ? date.toLocaleString("tr-TR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Bilinmiyor";
                        })()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.categories.map((category) => {
                  const Icon = ICON_MAP[category.icon] || Home;
                  const gradientColor =
                    COLOR_MAP[category.color] || COLOR_MAP.blue;
                  const borderColor =
                    BORDER_COLOR_MAP[category.color] || BORDER_COLOR_MAP.blue;
                  const bgColor =
                    BG_COLOR_MAP[category.color] || BG_COLOR_MAP.blue;

                  return (
                    <Card
                      key={category.id}
                      className={`bg-slate-800 border ${borderColor} hover:border-opacity-60 transition-all duration-300 hover:shadow-lg hover:shadow-${category.color}-500/10 group`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <Badge
                            className={`${bgColor} text-white border-0 font-bold text-lg px-3 py-1`}
                          >
                            {category.count.toLocaleString("tr-TR")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="text-lg font-bold text-white mb-2">
                          {category.label}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <TrendingUp className="h-4 w-4" />
                          <span>Aktif ilan</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Listings List */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    İlan Listesi
                    <Badge
                      variant="outline"
                      className="text-slate-400 border-slate-700 ml-2"
                    >
                      {listings.length} Gösteriliyor
                    </Badge>
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {listingsLoading ? (
                    <div className="text-center py-10 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Yükleniyor...
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
                      İlan bulunamadı.
                    </div>
                  ) : (
                    listings.map((item) => (
                      <Card
                        key={item.id}
                        className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                          {/* Image */}
                          <div className="w-full md:w-48 h-32 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative group">
                            {item.resim ? (
                              <img
                                src={item.resim}
                                alt={item.baslik}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-600">
                                <Home className="w-8 h-8 opacity-20" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <Badge
                                className={
                                  item.transaction === "Satılık"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }
                              >
                                {item.transaction}
                              </Badge>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {item.konum}
                                  </span>
                                  <span>•</span>
                                  <span>{item.category}</span>
                                </div>
                                <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2 hover:text-blue-400 cursor-pointer transition-colors">
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {item.baslik}
                                  </a>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {item.m2 && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-slate-800 text-slate-300 border-slate-700"
                                    >
                                      {item.m2} m²
                                    </Badge>
                                  )}
                                  {item.oda && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-slate-800 text-slate-300 border-slate-700"
                                    >
                                      {item.oda}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xl font-bold text-emerald-400">
                                  {item.fiyat?.toLocaleString("tr-TR")} TL
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {(() => {
                                    const dateValue =
                                      item.tarih || item.crawledAt;
                                    if (!dateValue)
                                      return "Tarih belirtilmemiş";

                                    // Eğer tarih "31 Aralık" formatındaysa (yıl yok)
                                    if (
                                      typeof dateValue === "string" &&
                                      !dateValue.includes("202")
                                    ) {
                                      const isOcak = dateValue.includes("Ocak");
                                      const yil = isOcak ? 2026 : 2025;
                                      return `${dateValue} ${yil}`;
                                    }

                                    // Normal tarih formatı
                                    const date = new Date(dateValue);
                                    return !isNaN(date.getTime())
                                      ? date.toLocaleDateString("tr-TR")
                                      : "Tarih belirtilmemiş";
                                  })()}
                                </div>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 hover:underline"
                                >
                                  İlana Git <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
