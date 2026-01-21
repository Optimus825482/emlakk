/**
 * Para formatı - Binlik ayırıcı ile tam sayı gösterimi
 * Örnek: 1500000 -> "₺1.500.000"
 */
export function formatPrice(price: number | string): string {
  let num: number;

  if (typeof price === "string") {
    // String'den tüm sayısal olmayan karakterleri temizle
    const cleaned = price.replace(/[^\d]/g, "");
    num = parseInt(cleaned, 10);
  } else {
    num = Math.round(price);
  }

  if (isNaN(num) || num === 0) return "₺0";

  return `₺${num.toLocaleString("tr-TR")}`;
}

/**
 * Alan formatı - Binlik ayırıcı ile m² gösterimi
 * Örnek: 1500 -> "1.500m²"
 */
export function formatArea(area: number | string): string {
  let num: number;

  if (typeof area === "string") {
    num = parseFloat(area);
  } else {
    num = area;
  }

  if (isNaN(num) || num === 0) return "0m²";

  return `${Math.round(num).toLocaleString("tr-TR")}m²`;
}

/**
 * Sayı formatı - Binlik ayırıcı ile
 * Örnek: 1500000 -> "1.500.000"
 */
export function formatNumber(num: number): string {
  if (isNaN(num)) return "0";
  return num.toLocaleString("tr-TR");
}

/**
 * M² başına fiyat formatı
 * Örnek: 1500 -> "₺1.500/m²"
 */
export function formatPricePerSqm(
  price: number | string,
  area: number,
): string {
  let priceNum: number;

  if (typeof price === "string") {
    const cleaned = price.replace(/[^\d]/g, "");
    priceNum = parseInt(cleaned, 10);
  } else {
    priceNum = Math.round(price);
  }

  if (isNaN(priceNum) || area === 0) return "₺0/m²";

  const pricePerSqm = Math.round(priceNum / area);
  return `₺${pricePerSqm.toLocaleString("tr-TR")}/m²`;
}
