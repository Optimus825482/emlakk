"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/**
 * İlan Bazlı Sosyal Medya İçerik Üretimi
 * - İlan seçimi
 * - AI ile içerik üretimi
 * - Platform bazlı özelleştirme
 * - Önizleme ve onay
 */

interface Listing {
  id: string;
  title: string;
  type: string;
  price: string;
  district: string;
  thumbnail?: string;
  hasContent: boolean;
}

interface GeneratedContent {
  instagram: string;
  facebook: string;
  twitter: string;
  hashtags: string[];
}

export default function IlanIcerikPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [isLoading, setIsLoading] = useState(true);

  // İlanları yükle
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/listings?status=active&limit=50");
        const data = await res.json();
        if (data.data) {
          setListings(
            data.data.map((l: any) => ({
              id: l.id,
              title: l.title,
              type: l.type,
              price: l.price,
              district: l.district || "Hendek",
              thumbnail: l.images?.[0],
              hasContent: false, // TODO: Check from social_content table
            }))
          );
        }
      } catch (error) {
        console.error("İlanlar yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  // İçerik üret
  const generateContent = async () => {
    if (!selectedListing) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          title: selectedListing.title,
          type: selectedListing.type,
          price: selectedListing.price,
          location: selectedListing.district,
        }),
      });

      const data = await res.json();
      if (data.success && data.content) {
        setGeneratedContent({
          instagram: data.content.instagram || data.content.text,
          facebook: data.content.facebook || data.content.text,
          twitter: data.content.twitter || data.content.text?.slice(0, 280),
          hashtags: data.content.hashtags || [],
        });
      }
    } catch (error) {
      console.error("İçerik üretilemedi:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtrelenmiş ilanlar
  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !l.hasContent) ||
      (filter === "done" && l.hasContent);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sosyal-medya"
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Icon name="arrow_back" className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">İlan İçerikleri</h1>
            <p className="text-slate-400 text-sm">
              İlanlarınız için sosyal medya içeriği oluşturun
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Panel - İlan Listesi */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="İlan ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                aria-label="İlan filtresi"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">Tümü</option>
                <option value="pending">İçerik Bekleyen</option>
                <option value="done">İçerik Hazır</option>
              </select>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Icon
                  name="hourglass_empty"
                  className="text-4xl mb-2 animate-spin"
                />
                <p>İlanlar yükleniyor...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Icon name="search_off" className="text-4xl mb-2" />
                <p>İlan bulunamadı</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredListings.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => {
                      setSelectedListing(listing);
                      setGeneratedContent(null);
                    }}
                    className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors ${selectedListing?.id === listing.id
                        ? "bg-purple-500/20 border-l-4 border-purple-500"
                        : ""
                      }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.thumbnail ? (
                          <img
                            src={listing.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="image" className="text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {listing.title}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {listing.district} • {listing.type}
                        </p>
                        <p className="text-green-400 text-sm font-medium">
                          {parseInt(listing.price).toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {listing.hasContent ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Hazır
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            Bekliyor
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel - İçerik Üretimi */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          {!selectedListing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Icon name="touch_app" className="text-6xl mb-4" />
              <p className="text-lg">Soldaki listeden bir ilan seçin</p>
              <p className="text-sm">
                İçerik üretmek için ilan seçmeniz gerekiyor
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seçili İlan */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="w-20 h-20 bg-slate-600 rounded-lg overflow-hidden">
                  {selectedListing.thumbnail ? (
                    <img
                      src={selectedListing.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="home" className="text-slate-400 text-2xl" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {selectedListing.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {selectedListing.district} • {selectedListing.type}
                  </p>
                  <p className="text-green-400 font-medium">
                    {parseInt(selectedListing.price).toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              </div>

              {/* Üret Butonu */}
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Icon name="hourglass_empty" className="animate-spin" />
                    AI İçerik Üretiyor...
                  </>
                ) : (
                  <>
                    <Icon name="auto_awesome" />
                    Sosyal Medya İçeriği Üret
                  </>
                )}
              </button>

              {/* Üretilen İçerik */}
              {generatedContent && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Icon name="check_circle" className="text-green-400" />
                    Üretilen İçerikler
                  </h4>

                  {/* Instagram */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="photo_camera" className="text-pink-400" />
                      <span className="text-white font-medium">Instagram</span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {generatedContent.instagram}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {generatedContent.hashtags.map((tag, i) => (
                        <span key={i} className="text-purple-400 text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="facebook" className="text-blue-400" />
                      <span className="text-white font-medium">Facebook</span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {generatedContent.facebook}
                    </p>
                  </div>

                  {/* Twitter */}
                  <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="tag" className="text-slate-400" />
                      <span className="text-white font-medium">Twitter/X</span>
                      <span className="text-xs text-slate-500">
                        ({generatedContent.twitter.length}/280)
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      {generatedContent.twitter}
                    </p>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex gap-3">
                    <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Icon name="save" />
                      Kaydet
                    </button>
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Icon name="schedule" />
                      Planla
                    </button>
                    <button
                      aria-label="İçeriği kopyala"
                      className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Icon name="content_copy" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
