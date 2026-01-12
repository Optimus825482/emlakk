/**
 * AI Değerleme Workflow'u
 * DEMİR-NET Workflow DevKit
 *
 * Değerleme talebi geldiğinde:
 * 1. Talebi işleme al
 * 2. AI ile değerleme yap
 * 3. Sonucu kaydet ve e-posta gönder
 */

import { getValuation, updateValuationStatus } from "./steps/database";
import { generateWithAI } from "./steps/ai";
import { sendValuationResult } from "./steps/email";

export async function aiValuationWorkflow(valuationId: string) {
  "use workflow";

  // 1. Değerleme talebini al
  const valuation = await getValuation(valuationId);

  if (!valuation) {
    console.log(`Değerleme bulunamadı: ${valuationId}`);
    return { success: false, reason: "valuation_not_found" };
  }

  // 2. Durumu "processing" olarak güncelle
  await updateValuationStatus(valuationId, "processing");
  console.log(`🔄 Değerleme işleniyor: ${valuationId}`);

  // 3. AI ile değerleme yap
  const { propertyType, address, area, details } = valuation;

  const prompt = `
Hendek/Sakarya bölgesinde bir gayrimenkul değerlemesi yap.

Gayrimenkul Bilgileri:
- Tip: ${propertyType}
- Adres: ${address}
- Alan: ${area} m²
- Detaylar: ${details ? JSON.stringify(details) : "Belirtilmemiş"}

Lütfen şunları içeren bir değerleme raporu hazırla:
1. Tahmini piyasa değeri (TL)
2. Değerleme gerekçesi
3. Bölge analizi
4. Yatırım potansiyeli

Sadece sayısal değer için JSON formatında yanıt ver:
{"estimatedValue": 1500000, "summary": "Kısa özet"}
`;

  const systemPrompt = `Sen Hendek/Sakarya bölgesinde uzman bir gayrimenkul değerleme uzmanısın. 
Bölgenin sanayi potansiyeli, tarım arazileri ve konut piyasası hakkında derin bilgiye sahipsin.
Değerlemelerinde gerçekçi ve piyasa koşullarına uygun ol.`;

  try {
    const { response } = await generateWithAI({
      prompt,
      systemPrompt,
      maxTokens: 1024,
    });

    // JSON yanıtı parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    let estimatedValue = 0;
    let summary = "";

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        estimatedValue = parsed.estimatedValue || 0;
        summary = parsed.summary || "";
      } catch {
        console.log("JSON parse hatası, ham yanıt kullanılıyor");
        summary = response;
      }
    }

    // 4. Sonucu kaydet
    await updateValuationStatus(valuationId, "completed", estimatedValue);
    console.log(
      `✅ Değerleme tamamlandı: ${valuationId} - ${estimatedValue} TL`
    );

    // 5. E-posta gönder
    if (valuation.email && valuation.name) {
      const formattedValue = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(estimatedValue);

      await sendValuationResult(
        valuation.email,
        valuation.name,
        propertyType,
        formattedValue
      );
      console.log(
        `📧 Değerleme sonucu e-postası gönderildi: ${valuation.email}`
      );
    }

    return {
      success: true,
      valuationId,
      estimatedValue,
      summary,
    };
  } catch (error) {
    console.error(`❌ Değerleme hatası: ${error}`);
    await updateValuationStatus(valuationId, "rejected");
    return {
      success: false,
      reason: "ai_error",
      error: String(error),
    };
  }
}
