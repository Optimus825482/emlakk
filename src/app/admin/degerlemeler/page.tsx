"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { valuationPropertyTypeLabels } from "@/lib/validations/valuation";

interface Valuation {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  propertyType: "sanayi" | "tarim" | "konut" | "ticari" | "arsa";
  address: string;
  city: string;
  district: string | null;
  area: number;
  details: Record<string, unknown> | null;
  estimatedValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  pricePerSqm: string | null;
  confidenceScore: number | null;
  comparables: Record<string, any>[] | null;
  marketAnalysis: string | null;
  createdAt: string;
}

interface ApiResponse {
  data: Valuation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const typeColors: Record<string, string> = {
  konut: "bg-orange-500",
  sanayi: "bg-blue-500",
  tarim: "bg-emerald-500",
  ticari: "bg-purple-500",
  arsa: "bg-amber-500",
};

const typeIcons: Record<string, string> = {
  konut: "home",
  sanayi: "factory",
  tarim: "agriculture",
  ticari: "store",
  arsa: "landscape",
};

export default function AdminDegerlemelerPage() {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedValuation, setSelectedValuation] = useState<string | null>(
    null,
  );

  const generatePDFReport = (valuation: Valuation) => {
    // Yeni pencerede PDF rapor sayfasını aç
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert(
        "Pop-up engelleyici nedeniyle rapor açılamadı. Lütfen pop-up'ları etkinleştirin.",
      );
      return;
    }

    const reportHTML = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Değerleme Raporu - ${valuation.name || "İsimsiz"}</title>
  <style>
    /* A4 Sayfa Ayarları */
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: white;
      font-size: 12px;
    }
    
    /* A4 Boyut: 210mm x 297mm, Kenar boşlukları: 15mm, İçerik: 180mm */
    .container {
      width: 180mm;
      margin: 0 auto;
      padding: 0;
    }
    
    /* Header - Kompakt Tasarım */
    .header {
      border-bottom: 2.5px solid #10b981;
      padding-bottom: 12px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    
    .logo-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #10b981;
      letter-spacing: 0.5px;
    }
    
    .report-date {
      font-size: 11px;
      color: #6b7280;
      text-align: right;
    }
    
    .report-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      text-align: center;
      margin-top: 8px;
      letter-spacing: 0.3px;
    }
    
    /* Bölüm Başlıkları - Daha Belirgin */
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      background: #f3f4f6;
      padding: 8px 12px;
      border-left: 4px solid #10b981;
      margin-bottom: 12px;
    }
    
    /* Info Grid - Optimize Edilmiş */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .info-item {
      padding: 10px 12px;
      background: #f9fafb;
      border-left: 3px solid #10b981;
      border-radius: 4px;
    }
    
    .info-item-full {
      grid-column: 1 / -1;
      padding: 10px 12px;
      background: #f9fafb;
      border-left: 3px solid #10b981;
      border-radius: 4px;
    }
    
    .info-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 13px;
      color: #1f2937;
      font-weight: 600;
      line-height: 1.4;
    }
    
    .info-value-small {
      font-size: 10px;
      color: #6b7280;
      margin-top: 4px;
      line-height: 1.3;
    }
    
    /* Değer Vurgusu - Kompakt */
    .value-highlight {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      margin: 15px 0;
      border: 2px solid #10b981;
      page-break-inside: avoid;
    }
    
    .value-highlight .label {
      font-size: 11px;
      color: #065f46;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    
    .value-highlight .amount {
      font-size: 26px;
      font-weight: 800;
      color: #059669;
      letter-spacing: -0.5px;
    }
    
    /* Değer Aralığı */
    .value-range {
      display: flex;
      justify-content: space-around;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #10b981;
    }
    
    .range-item {
      text-align: center;
    }
    
    .range-item .label {
      font-size: 10px;
      color: #065f46;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .range-item .value {
      font-size: 15px;
      font-weight: 700;
      color: #059669;
    }
    
    /* Pazar Analizi */
    .analysis-box {
      padding: 12px 14px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 12px;
      line-height: 1.6;
      color: #374151;
    }
    
    /* Footer - Sayfanın Altına Sabitlenmiş */
    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      page-break-inside: avoid;
    }
    
    /* Yasal Uyarı - Daha Okunabilir */
    .legal-notice {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 9px;
      line-height: 1.5;
      color: #78350f;
    }
    
    .legal-notice strong {
      display: block;
      margin-bottom: 6px;
      font-size: 10px;
      color: #92400e;
      font-weight: 700;
    }
    
    /* Şirket Bilgisi */
    .company-info {
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .company-info strong {
      font-size: 11px;
      color: #1f2937;
      display: block;
      margin-bottom: 4px;
    }
    
    /* Yazdırma Optimizasyonu */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .no-print {
        display: none !important;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .footer {
        page-break-inside: avoid;
      }
      
      .value-highlight {
        page-break-inside: avoid;
      }
    }
    
    /* Butonlar */
    .button-container {
      text-align: center;
      margin-top: 25px;
      padding: 20px 0;
    }
    
    .btn {
      padding: 12px 28px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin: 0 6px;
    }
    
    .btn-primary {
      background: #10b981;
      color: white;
    }
    
    .btn-primary:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4b5563;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="company-name">DEMİR GAYRIMENKUL</div>
        <div class="report-date">Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</div>
      </div>
      <div class="report-title">GAYRİMENKUL DEĞERLEME RAPORU</div>
    </div>
    
    <!-- Müşteri Bilgileri -->
    <div class="section">
      <div class="section-title">Müşteri Bilgileri</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Ad Soyad</div>
          <div class="info-value">${valuation.name || "Belirtilmemiş"}</div>
        </div>
        ${
          valuation.phone
            ? `
        <div class="info-item">
          <div class="info-label">Telefon</div>
          <div class="info-value">${valuation.phone}</div>
        </div>
        `
            : ""
        }
        ${
          valuation.email
            ? `
        <div class="info-item${!valuation.phone ? "-full" : ""}">
          <div class="info-label">E-posta</div>
          <div class="info-value">${valuation.email}</div>
        </div>
        `
            : ""
        }
      </div>
    </div>
    
    <!-- Gayrimenkul Bilgileri -->
    <div class="section">
      <div class="section-title">Gayrimenkul Bilgileri</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Mülk Tipi</div>
          <div class="info-value">${valuationPropertyTypeLabels[valuation.propertyType]}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Alan</div>
          <div class="info-value">${Number(valuation.details?.area || valuation.area).toLocaleString("tr-TR")} m²</div>
        </div>
      </div>
      
      <div class="info-item-full">
        <div class="info-label">Adres</div>
        <div class="info-value">${valuation.address}, ${valuation.city}</div>
        ${
          valuation.details?.lat && valuation.details?.lng
            ? `
        <div class="info-value-small">
          Koordinatlar: ${parseFloat(String(valuation.details.lat)).toFixed(6)}, ${parseFloat(String(valuation.details.lng)).toFixed(6)}
        </div>
        `
            : ""
        }
      </div>
    </div>
    
    <!-- Değerleme Sonucu -->
    <div class="section">
      <div class="section-title">Değerleme Sonucu</div>
      <div class="value-highlight">
        <div class="label">TAHMİNİ PAZAR DEĞERİ</div>
        <div class="amount">₺${parseFloat(valuation.estimatedValue || "0").toLocaleString("tr-TR")}</div>
        ${
          valuation.minValue && valuation.maxValue
            ? `
        <div class="value-range">
          <div class="range-item">
            <div class="label">Minimum Değer</div>
            <div class="value">₺${parseFloat(valuation.minValue).toLocaleString("tr-TR")}</div>
          </div>
          <div class="range-item">
            <div class="label">Maksimum Değer</div>
            <div class="value">₺${parseFloat(valuation.maxValue).toLocaleString("tr-TR")}</div>
          </div>
        </div>
        `
            : ""
        }
      </div>
      
      ${
        valuation.pricePerSqm
          ? `
      <div class="info-item-full">
        <div class="info-label">Metrekare Başına Fiyat</div>
        <div class="info-value">₺${parseFloat(valuation.pricePerSqm).toLocaleString("tr-TR")}/m²</div>
      </div>
      `
          : ""
      }
      
      ${
        valuation.confidenceScore
          ? `
      <div class="info-item-full">
        <div class="info-label">Güven Skoru</div>
        <div class="info-value">%${valuation.confidenceScore} (AI Destekli Analiz)</div>
      </div>
      `
          : ""
      }
    </div>
    
    ${
      valuation.marketAnalysis
        ? `
    <!-- Pazar Analizi -->
    <div class="section">
      <div class="section-title">Pazar Analizi ve Değerlendirme</div>
      <div class="analysis-box">
        ${valuation.marketAnalysis}
      </div>
    </div>
    `
        : ""
    }
    
    <!-- Footer -->
    <div class="footer">
      <div class="legal-notice">
        <strong>⚠️ YASAL UYARI VE SORUMLULUK REDDİ</strong>
        Bu rapor, Demir Gayrimenkul tarafından yapay zeka destekli algoritmalar kullanılarak hazırlanmış bir tahmini değerleme raporudur. 
        Raporda yer alan değerler, mevcut piyasa koşulları ve benzer gayrimenkul verilerine dayalı olarak hesaplanmıştır. 
        Bu rapor resmi bir ekspertiz raporu yerine geçmez ve yasal işlemlerde kullanılamaz. 
        Kesin değerleme için lisanslı gayrimenkul değerleme uzmanına başvurulması önerilir. 
        Demir Gayrimenkul, bu raporda yer alan bilgilerin doğruluğu ve güncelliği konusunda sorumluluk kabul etmez.
      </div>
      
      <div class="company-info">
        <strong>DEMİR GAYRIMENKUL</strong>
        Hendek, Sakarya<br>
        www.demirgayrimenkul.com.tr
      </div>
    </div>
    
    <!-- Print Buttons -->
    <div class="no-print button-container">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Yazdır / PDF Olarak Kaydet
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        ✕ Kapat
      </button>
    </div>
  </div>
</body>
</html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  const fetchValuations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("propertyType", filter);

      const response = await fetch(`/api/valuations?${params.toString()}`);
      if (!response.ok) throw new Error("Değerlemeler yüklenemedi");

      const result: ApiResponse = await response.json();
      setValuations(result.data);
    } catch (error) {
      console.error("Değerleme yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchValuations();
  }, [fetchValuations]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu değerleme talebini silmek istediğinize emin misiniz?"))
      return;

    try {
      await fetch(`/api/valuations/${id}`, { method: "DELETE" });
      setSelectedValuation(null);
      fetchValuations();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const completedCount = valuations.filter((v) => v.estimatedValue).length;
  const pendingCount = valuations.filter((v) => !v.estimatedValue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Değerleme Raporları
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {valuations.length} değerleme raporu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <Icon name="auto_awesome" className="text-purple-400" />
            <span className="text-sm text-slate-300">
              AI Engine: <span className="text-emerald-400">Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "konut", "sanayi", "tarim", "ticari", "arsa"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
            }`}
          >
            {type === "all" ? "Tümü" : valuationPropertyTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* Valuations List */}
      {valuations.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="calculate" className="text-4xl text-slate-600 mb-3" />
          <p className="text-slate-400">Değerleme talebi bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          {valuations.map((valuation) => (
            <div
              key={valuation.id}
              className={`bg-slate-800 border rounded-lg overflow-hidden transition-all ${
                selectedValuation === valuation.id
                  ? "border-emerald-500"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              {/* Main Row */}
              <div
                className="p-5 cursor-pointer"
                onClick={() =>
                  setSelectedValuation(
                    selectedValuation === valuation.id ? null : valuation.id,
                  )
                }
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Tarih/Saat - Sol Üst Köşe */}
                    <div className="text-left min-w-[140px]">
                      <p className="text-slate-500 text-[10px] uppercase mb-1">
                        Değerleme Tarihi
                      </p>
                      <p className="text-slate-300 text-xs font-mono">
                        {new Date(valuation.createdAt).toLocaleDateString(
                          "tr-TR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}
                      </p>
                      <p className="text-slate-400 text-[10px] font-mono">
                        {new Date(valuation.createdAt).toLocaleTimeString(
                          "tr-TR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-lg ${
                        typeColors[valuation.propertyType]
                      } flex items-center justify-center`}
                    >
                      <Icon
                        name={typeIcons[valuation.propertyType]}
                        className="text-white text-xl"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">
                          {valuation.name || "İsimsiz"}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            typeColors[valuation.propertyType]
                          } text-white`}
                        >
                          {valuationPropertyTypeLabels[valuation.propertyType]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-slate-500 text-xs uppercase">Alan</p>
                      <p className="text-white font-mono">
                        {valuation.area.toLocaleString("tr-TR")}m²
                      </p>
                    </div>

                    {valuation.estimatedValue && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase">
                          Tahmini Değer
                        </p>
                        <p className="text-emerald-400 font-mono font-bold">
                          ₺
                          {(
                            parseFloat(valuation.estimatedValue) / 1000000
                          ).toFixed(2)}
                          M
                        </p>
                      </div>
                    )}

                    {valuation.confidenceScore && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase">
                          AI Güven
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${valuation.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 text-sm font-mono">
                            {valuation.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    <span
                      className={`text-xs px-3 py-1.5 rounded border ${
                        valuation.estimatedValue
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {valuation.estimatedValue ? "Tamamlandı" : "Bekliyor"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedValuation === valuation.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-700 mt-0">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        İletişim
                      </h4>
                      <div className="space-y-2">
                        {valuation.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="phone" className="text-slate-500" />
                            <span className="text-white">
                              {valuation.phone}
                            </span>
                          </div>
                        )}
                        {valuation.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="email" className="text-slate-500" />
                            <span className="text-white">
                              {valuation.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Features */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        Detaylar
                      </h4>
                      <div className="space-y-2">
                        {/* Adres */}
                        <div className="flex items-start gap-2 text-sm">
                          <Icon
                            name="location_on"
                            className="text-slate-500 mt-0.5"
                          />
                          <div>
                            <p className="text-white text-xs leading-relaxed">
                              {valuation.address}, {valuation.city}
                            </p>
                            {valuation.details?.lat &&
                            valuation.details?.lng ? (
                              <p className="text-slate-400 text-[10px] mt-1">
                                {parseFloat(
                                  String(valuation.details.lat),
                                ).toFixed(6)}
                                ,{" "}
                                {parseFloat(
                                  String(valuation.details.lng),
                                ).toFixed(6)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Metrekare */}
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="square_foot" className="text-slate-500" />
                          <span className="text-white">
                            {(valuation.details?.area as number) ||
                              valuation.area}{" "}
                            m²
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-400 uppercase mt-4">
                        Özellikler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {valuation.details &&
                          Object.entries(valuation.details)
                            .filter(
                              ([key]) => !["lat", "lng", "area"].includes(key),
                            )
                            .map(([key, value]) => {
                              const labels: Record<string, string> = {
                                floor: "Kat",
                                mahalle: "Mahalle",
                                roomCount: "Oda Sayısı",
                                hasBalcony: "Balkon",
                                hasParking: "Otopark",
                                buildingAge: "Bina Yaşı",
                                hasElevator: "Asansör",
                                propertyType: "Mülk Tipi",
                              };

                              const colorMap: Record<string, string> = {
                                floor:
                                  "bg-blue-500/20 text-blue-300 border-blue-500/30",
                                mahalle:
                                  "bg-purple-500/20 text-purple-300 border-purple-500/30",
                                roomCount:
                                  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                                hasBalcony:
                                  "bg-green-500/20 text-green-300 border-green-500/30",
                                hasParking:
                                  "bg-orange-500/20 text-orange-300 border-orange-500/30",
                                buildingAge:
                                  "bg-amber-500/20 text-amber-300 border-amber-500/30",
                                hasElevator:
                                  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                                propertyType:
                                  "bg-pink-500/20 text-pink-300 border-pink-500/30",
                              };

                              const label = labels[key] || key;
                              const colorClass =
                                colorMap[key] ||
                                "bg-slate-700 text-slate-300 border-slate-600";

                              return (
                                <span
                                  key={key}
                                  className={`text-xs px-2 py-1 rounded border ${colorClass}`}
                                >
                                  {label}:{" "}
                                  {typeof value === "boolean"
                                    ? value
                                      ? "Var"
                                      : "Yok"
                                    : String(value)}
                                </span>
                              );
                            })}
                        {(!valuation.details ||
                          Object.keys(valuation.details).filter(
                            (k) => !["lat", "lng", "area"].includes(k),
                          ).length === 0) && (
                          <span className="text-slate-500 text-sm">
                            Özellik belirtilmemiş
                          </span>
                        )}
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <Icon name="calendar_today" className="text-[10px]" />
                          Analiz Tarihi:{" "}
                          {new Date(valuation.createdAt).toLocaleString(
                            "tr-TR",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase">
                        İşlemler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {valuation.estimatedValue && (
                          <button
                            onClick={() => generatePDFReport(valuation)}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            <Icon name="picture_as_pdf" />
                            Raporu Yazdır / İndir
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(valuation.id)}
                          className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-slate-600"
                        >
                          <Icon name="delete" />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis */}
                  {valuation.marketAnalysis && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <Icon
                          name="auto_awesome"
                          className="text-purple-400 text-xs"
                        />
                        AI Pazar Analizi & Özet
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{valuation.marketAnalysis}"
                      </p>
                    </div>
                  )}

                  {/* Comparable Properties */}
                  {valuation.comparables &&
                    (valuation.comparables as any[]).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                          <Icon
                            name="list"
                            className="text-emerald-400 text-xs"
                          />
                          Eşleşen Benzer İlanlar (
                          {(valuation.comparables as any[]).length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(valuation.comparables as any[]).map(
                            (comp: any, i: number) => (
                              <div
                                key={i}
                                className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs text-slate-500">
                                    ID: {comp.id}
                                  </span>
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                                    %{Math.round(comp.similarity || 0)} Benzer
                                  </Badge>
                                </div>
                                <h5 className="text-white text-xs font-medium line-clamp-1 mb-2">
                                  {comp.baslik}
                                </h5>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-emerald-400 font-bold text-sm">
                                      ₺{comp.fiyat?.toLocaleString("tr-TR")}
                                    </p>
                                    <p className="text-slate-500 text-[10px]">
                                      {comp.m2}m² • ₺
                                      {Math.round(
                                        comp.fiyat / comp.m2,
                                      ).toLocaleString("tr-TR")}
                                      /m²
                                    </p>
                                  </div>
                                  <p className="text-slate-400 text-[10px] flex items-center gap-1">
                                    <Icon
                                      name="location_on"
                                      className="text-[10px]"
                                    />
                                    {(comp.distance || 0).toFixed(2)} km
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
