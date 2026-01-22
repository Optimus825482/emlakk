"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Home,
  Building2,
  Landmark,
  Store,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Grid3x3,
} from "lucide-react";

interface Listing {
  id: number;
  baslik: string | null;
  link: string | null;
  fiyat: number | null;
  konum: string | null;
  tarih: string | null;
  resim: string | null;
  category: string | null;
  transaction: string | null;
  crawledAt: string;
  m2: string | null;
  satici: string | null;
}

interface FilterState {
  search: string;
  category: string;
  transaction: string;
  minPrice: string;
  maxPrice: string;
  konum: string;
  district: string;
  neighborhood: string; // Mahalle filtresi
  sortBy: string; // Sıralama
}

const CATEGORIES = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "konut", label: "Konut", icon: Home },
  { value: "arsa", label: "Arsa", icon: Landmark },
  { value: "isyeri", label: "İşyeri", icon: Store },
  { value: "bina", label: "Bina", icon: Building2 },
];

const TRANSACTIONS = [
  { value: "all", label: "Tümü" },
  { value: "satilik", label: "Satılık" },
  { value: "kiralik", label: "Kiralık" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Yayın Tarihine Göre (Yeni → Eski)" },
  { value: "price_asc", label: "Fiyata Göre (Ucuz → Pahalı)" },
  { value: "price_desc", label: "Fiyata Göre (Pahalı → Ucuz)" },
];

const CATEGORY_COLORS: Record<string, string> = {
  konut: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  arsa: "bg-green-500/20 text-green-400 border-green-500/30",
  isyeri: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  bina: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TRANSACTION_COLORS: Record<string, string> = {
  satilik: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  kiralik: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function SahibindenIlanlarPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<
    Array<{ value: string; label: string; count: number }>
  >([]);
  const [neighborhoods, setNeighborhoods] = useState<
    Array<{ id: string; name: string }>
  >([]); // Mahalle listesi
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    transaction: "all",
    minPrice: "",
    maxPrice: "",
    konum: "",
    district: "all",
    neighborhood: "all", // Mahalle filtresi
    sortBy: "date", // Varsayılan sıralama
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const itemsPerPage = 20;

  useEffect(() => {
    fetchDistricts();
    fetchListings();

    // URL'den parametreleri al
    const params = new URLSearchParams(window.location.search);
    const districtParam = params.get("district");
    const categoryParam = params.get("category");
    const transactionParam = params.get("transaction");

    if (districtParam || categoryParam || transactionParam) {
      setFilters((prev) => ({
        ...prev,
        district: districtParam || "all",
        category: categoryParam || "all",
        transaction: transactionParam || "all",
      }));
    }
  }, []);

  useEffect(() => {
    // Filtreler değiştiğinde listings'i yeniden çek
    fetchListings();
  }, [
    filters.district,
    filters.neighborhood,
    filters.category,
    filters.transaction,
    filters.sortBy,
  ]);

  useEffect(() => {
    applyFilters();
  }, [filters, listings]);

  const fetchDistricts = async () => {
    try {
      console.log("İlçeler çekiliyor..."); // DEBUG
      const response = await fetch("/api/sahibinden/districts");

      if (!response.ok) {
        console.error("API response not OK:", response.status);
        return;
      }

      const data = await response.json();
      console.log("İlçe API response:", data); // DEBUG

      if (data.success && Array.isArray(data.data)) {
        console.log("İlçeler yüklendi:", data.data.length, data.data); // DEBUG
        setDistricts(data.data);
      } else {
        console.error("Invalid data format:", data);
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

  const fetchListings = async () => {
    try {
      setLoading(true);

      // Query parametrelerini oluştur
      const params = new URLSearchParams({
        limit: "10000",
      });

      if (filters.district && filters.district !== "all") {
        params.set("ilce", filters.district);
      }

      if (filters.neighborhood && filters.neighborhood !== "all") {
        params.set("neighborhood", filters.neighborhood);
      }

      if (filters.category && filters.category !== "all") {
        params.set("category", filters.category);
      }

      if (filters.transaction && filters.transaction !== "all") {
        params.set("transaction", filters.transaction);
      }

      if (filters.sortBy) {
        params.set("sortBy", filters.sortBy);
      }

      const url = `/api/sahibinden/listings?${params.toString()}`;
      console.log("Fetch URL:", url); // DEBUG

      const response = await fetch(url);
      const data = await response.json();
      console.log("Listings response:", data.data?.length, "ilan"); // DEBUG

      if (data.success) {
        setListings(data.data);
        setFilteredListings(data.data);
        setTotalCount(data.pagination?.total || data.data.length);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Arama
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.baslik?.toLowerCase().includes(searchLower) ||
          item.konum?.toLowerCase().includes(searchLower),
      );
    }

    // Kategori
    if (filters.category !== "all") {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    // İşlem tipi
    if (filters.transaction !== "all") {
      filtered = filtered.filter(
        (item) => item.transaction === filters.transaction,
      );
    }

    // Fiyat aralığı
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter(
        (item) => item.fiyat && item.fiyat >= minPrice,
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter(
        (item) => item.fiyat && item.fiyat <= maxPrice,
      );
    }

    // Konum
    if (filters.konum) {
      const konumLower = filters.konum.toLowerCase();
      filtered = filtered.filter((item) =>
        item.konum?.toLowerCase().includes(konumLower),
      );
    }

    setFilteredListings(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      transaction: "all",
      minPrice: "",
      maxPrice: "",
      konum: "",
      district: "all",
      neighborhood: "all",
      sortBy: "date",
    });
    setNeighborhoods([]); // Mahalle listesini temizle
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysOnline = (dateStr: string | null) => {
    if (!dateStr) return null;
    const listingDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysOnlineBadge = (days: number | null) => {
    if (!days) return null;

    if (days === 0) {
      return {
        text: "Bugün",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      };
    } else if (days === 1) {
      return {
        text: "Dün",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      };
    } else if (days <= 7) {
      return {
        text: `${days} gün`,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      };
    } else if (days <= 30) {
      return {
        text: `${days} gün`,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      };
    } else {
      return {
        text: `${days} gün`,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      };
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Sahibinden.com{" "}
            {filters.district !== "all"
              ? `${filters.district} İlanları`
              : "Tüm İlanlar"}
          </h1>
          <p className="text-slate-300 mt-1">
            Toplam {filteredListings.length.toLocaleString("tr-TR")} ilan
            {filters.district !== "all" && (
              <span className="text-blue-400 ml-2">
                ({filters.district} için)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* İLÇE SEÇİMİ */}
          <Select
            value={filters.district}
            onValueChange={(value) => {
              console.log("İlçe seçildi:", value); // DEBUG
              setFilters({
                ...filters,
                district: value,
                neighborhood: "all", // İlçe değişince mahalle sıfırla
                sortBy: filters.sortBy,
              });
              // Mahalle listesini çek
              fetchNeighborhoods(value);
              // URL'i güncelle
              const url = new URL(window.location.href);
              if (value === "all") {
                url.searchParams.delete("ilce");
              } else {
                url.searchParams.set("ilce", value);
              }
              window.history.pushState({}, "", url);
            }}
          >
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="İlçe seçin">
                {filters.district === "all"
                  ? "Tüm İlçeler"
                  : districts.find((d) => d.label === filters.district)
                      ?.label || "İlçe seçin"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-700">
                Tüm İlçeler
              </SelectItem>
              {districts.length === 0 ? (
                <SelectItem value="loading" disabled className="text-slate-400">
                  Yükleniyor...
                </SelectItem>
              ) : (
                districts.map((district) => (
                  <SelectItem
                    key={district.label}
                    value={district.label}
                    className="text-white hover:bg-slate-700"
                  >
                    {district.label} ({district.count.toLocaleString("tr-TR")})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* MAHALLE SEÇİMİ - YENİ */}
          <Select
            value={filters.neighborhood}
            onValueChange={(value) => {
              console.log("Mahalle seçildi:", value); // DEBUG
              setFilters({
                ...filters,
                neighborhood: value,
              });
            }}
            disabled={filters.district === "all"}
          >
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Mahalle seçin">
                {filters.neighborhood === "all"
                  ? "Tüm Mahalleler"
                  : neighborhoods.find((n) => n.name === filters.neighborhood)
                      ?.name || "Mahalle seçin"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-slate-700">
                Tüm Mahalleler
              </SelectItem>
              {neighborhoods.length === 0 ? (
                <SelectItem value="empty" disabled className="text-slate-400">
                  {filters.district === "all"
                    ? "Önce ilçe seçin"
                    : "Mahalle yok"}
                </SelectItem>
              ) : (
                neighborhoods.map((neighborhood) => (
                  <SelectItem
                    key={neighborhood.id}
                    value={neighborhood.name}
                    className="text-white hover:bg-slate-700"
                  >
                    {neighborhood.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* SIRALAMA SEÇİMİ - YENİ */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => {
              setFilters({ ...filters, sortBy: value });
            }}
          >
            <SelectTrigger className="w-[280px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white hover:bg-slate-700"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
              title="Grid Görünümü"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
              title="Liste Görünümü"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-2 rounded transition-colors ${
                viewMode === "compact"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
              title="Izgara Görünümü"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtreler
          </Button>
          <Button
            onClick={fetchListings}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Yenile
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Gelişmiş Filtreleme</h3>
              <Button
                onClick={resetFilters}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                Sıfırla
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Arama */}
              <div className="space-y-2">
                <Label className="text-slate-300">Arama</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Başlık veya konum ara..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <Label className="text-slate-300">Kategori</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* İşlem Tipi */}
              <div className="space-y-2">
                <Label className="text-slate-300">İşlem Tipi</Label>
                <Select
                  value={filters.transaction}
                  onValueChange={(value) =>
                    setFilters({ ...filters, transaction: value })
                  }
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTIONS.map((trans) => (
                      <SelectItem key={trans.value} value={trans.value}>
                        {trans.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Fiyat */}
              <div className="space-y-2">
                <Label className="text-slate-300">Min Fiyat (₺)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {/* Max Fiyat */}
              <div className="space-y-2">
                <Label className="text-slate-300">Max Fiyat (₺)</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: e.target.value })
                  }
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {/* Konum */}
              <div className="space-y-2">
                <Label className="text-slate-300">Konum</Label>
                <Input
                  placeholder="Şehir, ilçe..."
                  value={filters.konum}
                  onChange={(e) =>
                    setFilters({ ...filters, konum: e.target.value })
                  }
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-300">İlanlar yükleniyor...</p>
        </div>
      ) : currentListings.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-20 text-center">
            <Search className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">İlan bulunamadı</p>
            <p className="text-slate-500 text-sm mt-2">
              Filtreleri değiştirmeyi deneyin
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-all group overflow-hidden"
                >
                  {listing.resim && (
                    <div className="relative h-48 overflow-hidden bg-slate-900">
                      <img
                        src={listing.resim}
                        alt={listing.baslik || ""}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {listing.category && (
                          <Badge
                            className={`${CATEGORY_COLORS[listing.category] || "bg-slate-700"} border`}
                          >
                            {listing.category}
                          </Badge>
                        )}
                        {listing.transaction && (
                          <Badge
                            className={`${TRANSACTION_COLORS[listing.transaction] || "bg-slate-700"} border`}
                          >
                            {listing.transaction}
                          </Badge>
                        )}
                      </div>
                      {/* Yayın Süresi Badge */}
                      {(() => {
                        const days = getDaysOnline(listing.tarih);
                        const badge = getDaysOnlineBadge(days);
                        return badge ? (
                          <div className="absolute bottom-2 left-2">
                            <Badge
                              className={`${badge.color} border font-semibold`}
                            >
                              🕐 {badge.text}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-white font-semibold line-clamp-2 min-h-[3rem]">
                      {listing.baslik || "Başlık yok"}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatPrice(listing.fiyat)}
                      </span>
                      {listing.m2 && (
                        <span className="text-slate-500 text-sm">
                          / {listing.m2} m²
                        </span>
                      )}
                    </div>

                    {listing.konum && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{listing.konum}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900/50 px-2 py-1 rounded">
                        <Calendar className="h-3 w-3" />
                        <span>Eklenme: {formatDate(listing.crawledAt)}</span>
                      </div>
                    </div>

                    {listing.link && (
                      <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Sahibinden'de Gör
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {currentListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-all group"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {listing.resim && (
                        <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                          <img
                            src={listing.resim}
                            alt={listing.baslik || ""}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Yayın Süresi Badge */}
                          {(() => {
                            const days = getDaysOnline(listing.tarih);
                            const badge = getDaysOnlineBadge(days);
                            return badge ? (
                              <div className="absolute bottom-2 left-2">
                                <Badge
                                  className={`${badge.color} border font-semibold text-xs`}
                                >
                                  🕐 {badge.text}
                                </Badge>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-white font-semibold text-lg line-clamp-2">
                            {listing.baslik || "Başlık yok"}
                          </h3>
                          <div className="flex gap-2 flex-shrink-0">
                            {listing.category && (
                              <Badge
                                className={`${CATEGORY_COLORS[listing.category] || "bg-slate-700"} border`}
                              >
                                {listing.category}
                              </Badge>
                            )}
                            {listing.transaction && (
                              <Badge
                                className={`${TRANSACTION_COLORS[listing.transaction] || "bg-slate-700"} border`}
                              >
                                {listing.transaction}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-400">
                              {formatPrice(listing.fiyat)}
                            </span>
                            {listing.m2 && (
                              <span className="text-slate-500 text-sm">
                                / {listing.m2} m²
                              </span>
                            )}
                          </div>

                          {listing.konum && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{listing.konum}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900/50 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Eklenme: {formatDate(listing.crawledAt)}
                            </span>
                          </div>
                        </div>

                        {listing.link && (
                          <a
                            href={listing.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Sahibinden'de Gör
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Compact View */}
          {viewMode === "compact" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {currentListings.map((listing) => (
                <Card
                  key={listing.id}
                  className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-all group overflow-hidden"
                >
                  {listing.resim && (
                    <div className="relative h-32 overflow-hidden bg-slate-900">
                      <img
                        src={listing.resim}
                        alt={listing.baslik || ""}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        {listing.category && (
                          <Badge
                            className={`${CATEGORY_COLORS[listing.category] || "bg-slate-700"} border text-[10px] px-1.5 py-0.5`}
                          >
                            {listing.category}
                          </Badge>
                        )}
                      </div>
                      {/* Yayın Süresi Badge */}
                      {(() => {
                        const days = getDaysOnline(listing.tarih);
                        const badge = getDaysOnlineBadge(days);
                        return badge ? (
                          <div className="absolute bottom-1 left-1">
                            <Badge
                              className={`${badge.color} border font-semibold text-[9px] px-1.5 py-0.5`}
                            >
                              🕐 {badge.text}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <CardContent className="p-3 space-y-2">
                    <h3 className="text-white font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                      {listing.baslik || "Başlık yok"}
                    </h3>

                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-emerald-400">
                        {formatPrice(listing.fiyat)}
                      </span>
                    </div>

                    {listing.konum && (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{listing.konum}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-slate-400 text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>Eklenme: {formatDate(listing.crawledAt)}</span>
                    </div>

                    {listing.link && (
                      <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 w-full bg-slate-700 hover:bg-emerald-600 text-white py-1.5 rounded transition-colors text-xs font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Gör
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={
                        currentPage === pageNum
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 border-slate-700 text-white"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
