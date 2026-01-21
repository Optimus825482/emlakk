"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Database,
} from "lucide-react";
import { toast } from "sonner";

interface CrawlerStats {
  total: {
    total_listings: number;
    konut_satilik: number;
    konut_kiralik: number;
    arsa_satilik: number;
    isyeri_satilik: number;
    isyeri_kiralik: number;
    last_crawl_date: string;
  };
  newListings: number;
  removedListings: number;
  categoryStats: Array<{
    category: string;
    transaction: string;
    count: number;
    avg_price: number;
  }>;
}

export default function CrawlerPage() {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<CrawlerStats | null>(null);

  // Form state
  const [category, setCategory] = useState("konut");
  const [transaction, setTransaction] = useState("satilik");
  const [maxPages, setMaxPages] = useState("5");
  const [sync, setSync] = useState(false);
  const [force, setForce] = useState(false);

  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/crawler/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const startCrawler = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/crawler/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          transaction,
          maxPages: parseInt(maxPages),
          sync,
          force,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Crawler başarıyla tamamlandı!", {
          description: `${data.data?.total_listings || 0} ilan işlendi`,
        });

        // Stats'ı yenile
        fetchStats();
      } else {
        toast.error("Crawler hatası", {
          description: data.error || "Bilinmeyen hata",
        });
      }
    } catch (error: any) {
      toast.error("Crawler başlatılamadı", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crawler Yönetimi</h1>
        <p className="text-muted-foreground">
          Sahibinden.com'dan ilan toplama ve senkronizasyon
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İlan</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.total.total_listings.toLocaleString("tr-TR") || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Veritabanındaki toplam ilan sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni İlanlar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.newListings || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Son 2 gün içinde eklenen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kaldırılan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.removedListings || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Son 7 gün içinde kaldırılan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Tarama</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : stats?.total.last_crawl_date ? (
                new Date(stats.total.last_crawl_date).toLocaleDateString(
                  "tr-TR",
                )
              ) : (
                "Henüz tarama yapılmadı"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              En son güncelleme tarihi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crawler Form */}
      <Card>
        <CardHeader>
          <CardTitle>Crawler Başlat</CardTitle>
          <CardDescription>
            Sahibinden.com'dan ilan toplamak için parametreleri ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="konut">Konut</SelectItem>
                  <SelectItem value="arsa">Arsa</SelectItem>
                  <SelectItem value="isyeri">İşyeri</SelectItem>
                  <SelectItem value="bina">Bina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction">İşlem Tipi</Label>
              <Select value={transaction} onValueChange={setTransaction}>
                <SelectTrigger id="transaction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satilik">Satılık</SelectItem>
                  <SelectItem value="kiralik">Kiralık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPages">Maksimum Sayfa</Label>
              <Input
                id="maxPages"
                type="number"
                min="1"
                max="50"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sync">Sync Modu</Label>
                <Switch id="sync" checked={sync} onCheckedChange={setSync} />
              </div>
              <p className="text-xs text-muted-foreground">
                Kaldırılan ilanları tespit et
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="force">Force Modu</Label>
            <Switch id="force" checked={force} onCheckedChange={setForce} />
          </div>
          <p className="text-xs text-muted-foreground">
            Smart stop'u devre dışı bırak, tüm sayfaları tara
          </p>

          <Button
            onClick={startCrawler}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crawler Çalışıyor...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Crawler Başlat
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori İstatistikleri</CardTitle>
          <CardDescription>
            Kategorilere göre ilan dağılımı ve ortalama fiyatlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.categoryStats.map((stat) => (
                <div
                  key={`${stat.category}-${stat.transaction}`}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {stat.category === "konut"
                          ? "Konut"
                          : stat.category === "arsa"
                            ? "Arsa"
                            : "İşyeri"}
                      </Badge>
                      <Badge variant="secondary">
                        {stat.transaction === "satilik" ? "Satılık" : "Kiralık"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ortalama Fiyat:{" "}
                      {stat.avg_price
                        ? `${Math.round(stat.avg_price).toLocaleString("tr-TR")} TL`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {stat.count.toLocaleString("tr-TR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
