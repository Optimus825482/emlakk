/**
 * İlan Açıklaması Oluşturma Workflow'u
 * DEMİR-NET Workflow DevKit
 *
 * Yeni ilan eklendiğinde veya talep edildiğinde:
 * 1. İlan bilgilerini al
 * 2. AI ile profesyonel açıklama oluştur
 * 3. İlanı güncelle
 */

import { getListing, updateListingDescription } from "./steps/database";
import { generateWithAI } from "./steps/ai";

export async function listingDescriptionWorkflow(listingId: string) {
  "use workflow";

  // 1. İlan bilgilerini al
  const listing = await getListing(listingId);

  if (!listing) {
    console.log(`İlan bulunamadı: ${listingId}`);
    return { success: false, reason: "listing_not_found" };
  }

  console.log(`🔄 İlan açıklaması oluşturuluyor: ${listing.title}`);

  // 2. AI ile açıklama oluştur
  const {
    title,
    type,
    transactionType,
    price,
    area,
    features,
    address,
    district,
  } = listing;

  const prompt = `
Aşağıdaki gayrimenkul ilanı için profesyonel, çekici ve SEO uyumlu bir açıklama yaz.

İlan Bilgileri:
- Başlık: ${title}
- Tip: ${type}
- İşlem: ${transactionType === "sale" ? "Satılık" : "Kiralık"}
- Fiyat: ${price} TL
- Alan: ${area} m²
- Oda Sayısı: ${features?.rooms || "Belirtilmemiş"}
- Banyo: ${features?.bathrooms || "Belirtilmemiş"}
- Kat: ${features?.floors || "Belirtilmemiş"}
- Bina Yaşı: ${features?.buildingAge || "Belirtilmemiş"}
- Isıtma: ${features?.heating || "Belirtilmemiş"}
- Özellikler: ${features ? JSON.stringify(features) : "Belirtilmemiş"}
- Adres: ${address}, ${district || "Hendek"}

Açıklama şunları içermeli:
1. Dikkat çekici giriş
2. Öne çıkan özellikler
3. Konum avantajları (Hendek/Sakarya bölgesi)
4. Yatırım potansiyeli (varsa)
5. Çağrı aksiyonu

Türkçe, profesyonel ve 200-300 kelime arasında yaz.
`;

  const systemPrompt = `Sen Türkiye'nin önde gelen gayrimenkul pazarlama uzmanısın.
Hendek/Sakarya bölgesini çok iyi tanıyorsun - sanayi bölgeleri, tarım arazileri, konut projeleri.
İlan açıklamalarında hem duygusal hem de rasyonel çekicilik kullanıyorsun.
SEO uyumlu, akıcı ve profesyonel Türkçe kullanıyorsun.`;

  try {
    const { response } = await generateWithAI({
      prompt,
      systemPrompt,
      maxTokens: 1024,
    });

    // 3. İlanı güncelle
    await updateListingDescription(listingId, response);
    console.log(`✅ İlan açıklaması güncellendi: ${listingId}`);

    return {
      success: true,
      listingId,
      description: response,
    };
  } catch (error) {
    console.error(`❌ Açıklama oluşturma hatası: ${error}`);
    return {
      success: false,
      reason: "ai_error",
      error: String(error),
    };
  }
}
