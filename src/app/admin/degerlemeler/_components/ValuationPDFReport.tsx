"use client";

import type { Valuation } from "../_types";
import { valuationPropertyTypeLabels } from "@/lib/validations/valuation";

/**
 * Değerleme PDF raporu oluşturur ve yeni pencerede açar
 */
export function generatePDFReport(valuation: Valuation): void {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
        alert(
            "Pop-up engelleyici nedeniyle rapor açılamadı. Lütfen pop-up'ları etkinleştirin."
        );
        return;
    }

    const reportHTML = buildReportHTML(valuation);
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
}

function buildReportHTML(valuation: Valuation): string {
    const formatDate = () =>
        new Date().toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

    const formatCurrency = (value: string | null) =>
        value ? parseFloat(value).toLocaleString("tr-TR") : "0";

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Değerleme Raporu - ${valuation.name || "İsimsiz"}</title>
  <style>${getReportStyles()}</style>
</head>
<body>
  <div class="container">
    ${buildHeader(formatDate())}
    ${buildCustomerInfo(valuation)}
    ${buildPropertyInfo(valuation)}
    ${buildValuationResult(valuation, formatCurrency)}
    ${valuation.marketAnalysis ? buildMarketAnalysis(valuation.marketAnalysis) : ""}
    ${buildFooter()}
    ${buildActionButtons()}
  </div>
</body>
</html>
  `;
}

function getReportStyles(): string {
    return `
    @page { size: A4 portrait; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5; color: #1f2937; background: white; font-size: 12px; }
    .container { width: 180mm; margin: 0 auto; padding: 0; }
    .header { border-bottom: 2.5px solid #10b981; padding-bottom: 12px; margin-bottom: 18px; page-break-inside: avoid; }
    .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .company-name { font-size: 20px; font-weight: 700; color: #10b981; letter-spacing: 0.5px; }
    .report-date { font-size: 11px; color: #6b7280; text-align: right; }
    .report-title { font-size: 16px; font-weight: 600; color: #1f2937; text-align: center; margin-top: 8px; letter-spacing: 0.3px; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: 700; color: #1f2937; background: #f3f4f6; padding: 8px 12px; border-left: 4px solid #10b981; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .info-item { padding: 10px 12px; background: #f9fafb; border-left: 3px solid #10b981; border-radius: 4px; }
    .info-item-full { grid-column: 1 / -1; padding: 10px 12px; background: #f9fafb; border-left: 3px solid #10b981; border-radius: 4px; }
    .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-size: 13px; color: #1f2937; font-weight: 600; line-height: 1.4; }
    .info-value-small { font-size: 10px; color: #6b7280; margin-top: 4px; line-height: 1.3; }
    .value-highlight { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 16px; border-radius: 8px; text-align: center; margin: 15px 0; border: 2px solid #10b981; page-break-inside: avoid; }
    .value-highlight .label { font-size: 11px; color: #065f46; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; }
    .value-highlight .amount { font-size: 26px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
    .value-range { display: flex; justify-content: space-around; margin-top: 12px; padding-top: 12px; border-top: 1px solid #10b981; }
    .range-item { text-align: center; }
    .range-item .label { font-size: 10px; color: #065f46; font-weight: 600; margin-bottom: 4px; }
    .range-item .value { font-size: 15px; font-weight: 700; color: #059669; }
    .analysis-box { padding: 12px 14px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 12px; line-height: 1.6; color: #374151; }
    .footer { margin-top: 25px; padding-top: 15px; border-top: 2px solid #e5e7eb; page-break-inside: avoid; }
    .legal-notice { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 6px; padding: 12px 14px; font-size: 9px; line-height: 1.5; color: #78350f; }
    .legal-notice strong { display: block; margin-bottom: 6px; font-size: 10px; color: #92400e; font-weight: 700; }
    .company-info { margin-top: 15px; text-align: center; font-size: 10px; color: #6b7280; line-height: 1.5; }
    .company-info strong { font-size: 11px; color: #1f2937; display: block; margin-bottom: 4px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .no-print { display: none !important; } .section, .footer, .value-highlight { page-break-inside: avoid; } }
    .button-container { text-align: center; margin-top: 25px; padding: 20px 0; }
    .btn { padding: 12px 28px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin: 0 6px; }
    .btn-primary { background: #10b981; color: white; }
    .btn-primary:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-secondary:hover { background: #4b5563; transform: translateY(-1px); }
  `;
}

function buildHeader(date: string): string {
    return `
    <div class="header">
      <div class="logo-section">
        <div class="company-name">DEMİR GAYRIMENKUL</div>
        <div class="report-date">Rapor Tarihi: ${date}</div>
      </div>
      <div class="report-title">GAYRİMENKUL DEĞERLEME RAPORU</div>
    </div>
  `;
}

function buildCustomerInfo(valuation: Valuation): string {
    return `
    <div class="section">
      <div class="section-title">Müşteri Bilgileri</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Ad Soyad</div>
          <div class="info-value">${valuation.name || "Belirtilmemiş"}</div>
        </div>
        ${valuation.phone ? `
        <div class="info-item">
          <div class="info-label">Telefon</div>
          <div class="info-value">${valuation.phone}</div>
        </div>
        ` : ""}
        ${valuation.email ? `
        <div class="info-item${!valuation.phone ? "-full" : ""}">
          <div class="info-label">E-posta</div>
          <div class="info-value">${valuation.email}</div>
        </div>
        ` : ""}
      </div>
    </div>
  `;
}

function buildPropertyInfo(valuation: Valuation): string {
    const area = Number(valuation.details?.area || valuation.area);
    const hasCoords = valuation.details?.lat && valuation.details?.lng;

    return `
    <div class="section">
      <div class="section-title">Gayrimenkul Bilgileri</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Mülk Tipi</div>
          <div class="info-value">${valuationPropertyTypeLabels[valuation.propertyType]}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Alan</div>
          <div class="info-value">${area.toLocaleString("tr-TR")} m²</div>
        </div>
      </div>
      <div class="info-item-full">
        <div class="info-label">Adres</div>
        <div class="info-value">${valuation.address}, ${valuation.city}</div>
        ${hasCoords ? `
        <div class="info-value-small">
          Koordinatlar: ${parseFloat(String(valuation.details?.lat)).toFixed(6)}, ${parseFloat(String(valuation.details?.lng)).toFixed(6)}
        </div>
        ` : ""}
      </div>
    </div>
  `;
}

function buildValuationResult(
    valuation: Valuation,
    formatCurrency: (v: string | null) => string
): string {
    return `
    <div class="section">
      <div class="section-title">Değerleme Sonucu</div>
      <div class="value-highlight">
        <div class="label">TAHMİNİ PAZAR DEĞERİ</div>
        <div class="amount">₺${formatCurrency(valuation.estimatedValue)}</div>
        ${valuation.minValue && valuation.maxValue ? `
        <div class="value-range">
          <div class="range-item">
            <div class="label">Minimum Değer</div>
            <div class="value">₺${formatCurrency(valuation.minValue)}</div>
          </div>
          <div class="range-item">
            <div class="label">Maksimum Değer</div>
            <div class="value">₺${formatCurrency(valuation.maxValue)}</div>
          </div>
        </div>
        ` : ""}
      </div>
      ${valuation.pricePerSqm ? `
      <div class="info-item-full">
        <div class="info-label">Metrekare Başına Fiyat</div>
        <div class="info-value">₺${formatCurrency(valuation.pricePerSqm)}/m²</div>
      </div>
      ` : ""}
      ${valuation.confidenceScore ? `
      <div class="info-item-full">
        <div class="info-label">Güven Skoru</div>
        <div class="info-value">%${valuation.confidenceScore} (AI Destekli Analiz)</div>
      </div>
      ` : ""}
    </div>
  `;
}

function buildMarketAnalysis(analysis: string): string {
    return `
    <div class="section">
      <div class="section-title">Pazar Analizi ve Değerlendirme</div>
      <div class="analysis-box">${analysis}</div>
    </div>
  `;
}

function buildFooter(): string {
    return `
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
  `;
}

function buildActionButtons(): string {
    return `
    <div class="no-print button-container">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Yazdır / PDF Olarak Kaydet
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        ✕ Kapat
      </button>
    </div>
  `;
}
