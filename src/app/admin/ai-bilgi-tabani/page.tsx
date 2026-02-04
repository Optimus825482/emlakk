"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Book,
  Plus,
  Trash2,
  Search,
  Save,
  RefreshCw,
  Tag,
  FileText,
  BrainCircuit,
  AlertCircle,
  FileUp,
  Link as LinkIcon,
  Youtube,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeItem {
  id: string;
  content: string;
  summary: string;
  category: string;
  importanceScore: number;
  tags: string[];
  createdAt: string;
  sourceType?: string;
}

type InputMode = "manual" | "file" | "url";

export default function AIKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("manual");

  // Data States
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");

  // Form Meta
  const [formData, setFormData] = useState({
    content: "",
    category: "general_knowledge",
    tags: "",
    importanceScore: 80,
    summary: "",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/knowledge?limit=100");
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (error) {
      toast.error("Bilgiler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs based on mode
      if (inputMode === "manual" && !formData.content.trim())
        throw new Error("İçerik boş olamaz");
      if (inputMode === "file" && !file) throw new Error("Dosya seçiniz");
      if (inputMode === "url" && !url.trim()) throw new Error("Link giriniz");

      // Prepare Payload
      let body;
      let headers = {};

      if (inputMode === "manual") {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });
      } else {
        // FormData for File or URL (handled by same endpoint logic for FormData)
        const fd = new FormData();
        fd.append("category", formData.category);
        fd.append("importanceScore", formData.importanceScore.toString());
        fd.append("tags", formData.tags);
        fd.append("summary", formData.summary);

        if (inputMode === "file" && file) {
          fd.append("file", file);
        } else if (inputMode === "url") {
          fd.append("url", url);
        }

        body = fd;
        // Headers empty for FormData to let browser set boundary
      }

      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers,
        body,
      });

      if (res.ok) {
        toast.success("Bilgi başarıyla işlendi ve vektörize edildi");
        // Reset form
        setFormData((prev) => ({
          ...prev,
          content: "",
          summary: "",
          tags: "",
        }));
        setFile(null);
        setUrl("");
        fetchItems();
      } else {
        const error = await res.json();
        toast.error(error.error || "Eşleme başarısız");
        if (error.details) console.error(error.details);
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu bilgiyi silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/ai/knowledge?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Bilgi silindi");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error("Silme başarısız");
      }
    } catch {
      toast.error("Silme hatası");
    }
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-slate-900/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-emerald-400" />
            RAG Bilgi Tabanı Yönetimi
          </h1>
          <p className="text-slate-400 mt-1">
            Yapay zekanın kullanması için kurumsal bilgi, belge ve dökümanları
            buradan ekleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 text-sm font-medium">
            Toplam: {items.length} Kaynak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Bilgi Ekleme Paneli
            </h2>

            {/* Input Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-900 rounded-lg">
              <button
                onClick={() => setInputMode("manual")}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-md transition-all text-xs font-medium",
                  inputMode === "manual"
                    ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
                )}
              >
                <FileText size={18} />
                Metin Yaz
              </button>
              <button
                onClick={() => setInputMode("file")}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-md transition-all text-xs font-medium",
                  inputMode === "file"
                    ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
                )}
              >
                <FileUp size={18} />
                Dosya Yükle
              </button>
              <button
                onClick={() => setInputMode("url")}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-md transition-all text-xs font-medium",
                  inputMode === "url"
                    ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
                )}
              >
                <LinkIcon size={18} />
                Web / Link
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dynamic Input Area */}
              <div className="min-h-[150px]">
                {inputMode === "manual" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      İçerik (Metin)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none text-sm leading-relaxed"
                      placeholder="Buraya AI'ın öğrenmesini istediğiniz metni yapıştırın..."
                    />
                    <p className="text-[10px] text-slate-500 mt-1 text-right">
                      {formData.content.length} karakter
                    </p>
                  </div>
                )}

                {inputMode === "file" && (
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-900/50 hover:bg-slate-900 hover:border-emerald-500/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      accept=".pdf,.md,.txt"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      aria-label="Dosya yükle (PDF, MD veya TXT)"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                      <FileUp className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-sm">
                        {file ? file.name : "Dosya seçmek için tıklayın"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, MD veya TXT
                      </p>
                    </div>
                  </div>
                )}

                {inputMode === "url" && (
                  <div className="space-y-3 pt-4">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      Kaynak Linki
                    </label>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 focus-within:ring-2 focus-within:ring-emerald-500">
                      <LinkIcon className="text-slate-500 w-5 h-5 shrink-0" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtube.com/... veya web sitesi"
                        className="bg-transparent border-none focus:outline-none text-white w-full text-sm"
                      />
                    </div>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Youtube size={12} /> YouTube (Altyazı)
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> Web Sitesi (Metin)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-700/50 space-y-4">
                <div>
                  <label htmlFor="aiCategory" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Kategori
                  </label>
                  <select
                    id="aiCategory"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="general_knowledge">Genel Bilgi</option>
                    <option value="real_estate_law">Emlak Hukuku</option>
                    <option value="company_policy">Şirket Politikası</option>
                    <option value="sales_strategy">Satış Stratejisi</option>
                    <option value="market_analysis">Pazar Analizi</option>
                    <option value="training">Eğitim Dokümanı</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="importanceScore" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      Önem Puanı
                    </label>
                    <input
                      id="importanceScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.importanceScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          importanceScore: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      Etiketler
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="proje, yönetmelik..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
              >
                {submitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {submitting ? "Kaynak Taranıyor..." : "Hafızaya Ekle"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-emerald-400" />
                Bilgi Havuzu
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    aria-label="Bilgi tabanında ara"
                    className="bg-slate-900 border-none rounded-full pl-9 pr-4 py-1.5 text-sm text-white w-48 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={fetchItems}
                  aria-label="Yenile"
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw
                    className={loading ? "animate-spin" : ""}
                    size={18}
                  />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-700/50">
              {items.length === 0 && !loading ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <AlertCircle className="w-12 h-12 opacity-20" />
                  <p>Henüz kayıtlı bilgi bulunmuyor.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 hover:bg-slate-700/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Source Badge */}
                          {item.sourceType === "file_upload" && (
                            <span className="bg-blue-500/10 text-blue-400 p-1 rounded">
                              <FileText size={12} />
                            </span>
                          )}
                          {item.sourceType === "youtube_video" && (
                            <span className="bg-red-500/10 text-red-400 p-1 rounded">
                              <Youtube size={12} />
                            </span>
                          )}
                          {item.sourceType === "web_page" && (
                            <span className="bg-indigo-500/10 text-indigo-400 p-1 rounded">
                              <Globe size={12} />
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                            {item.category.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded">
                            Skor: {item.importanceScore}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Tag size={10} />
                            {item.tags
                              ? Array.isArray(item.tags)
                                ? item.tags.join(", ")
                                : item.tags
                              : "-"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 line-clamp-2 font-medium">
                          {item.summary || item.content.substring(0, 150)}...
                        </p>
                        <div className="text-xs text-slate-500 pt-1 line-clamp-3 opacity-60 font-mono">
                          {item.content.substring(0, 300)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end shrink-0">
                        <span className="text-[10px] text-slate-600">
                          {format(
                            new Date(item.createdAt),
                            "d MMM yyyy HH:mm",
                            { locale: tr },
                          )}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
