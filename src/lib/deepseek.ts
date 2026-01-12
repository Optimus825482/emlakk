/**
 * DeepSeek AI Entegrasyonu
 * Akıllı ilan açıklaması üretimi için
 */

interface ListingData {
  title: string;
  type: "sanayi" | "tarim" | "konut" | "ticari";
  transactionType: "sale" | "rent";
  area: number;
  price: number;
  address: string;
  district?: string;
  neighborhood?: string;
  features?: {
    rooms?: string;
    bathrooms?: number;
    floors?: number;
    buildingAge?: number;
    heating?: string;
    parking?: boolean;
    garden?: boolean;
    pool?: boolean;
    elevator?: boolean;
    security?: boolean;
    infrastructure?: boolean;
    roadAccess?: string;
    treeCount?: number;
    irrigation?: boolean;
    organic?: boolean;
  };
}

const typeLabels: Record<string, string> = {
  sanayi: "Sanayi Arsası/Tesisi",
  tarim: "Tarım Arazisi",
  konut: "Konut",
  ticari: "Ticari Gayrimenkul",
};

const transactionLabels: Record<string, string> = {
  sale: "Satılık",
  rent: "Kiralık",
};

function buildPrompt(data: ListingData): string {
  const features: string[] = [];

  if (data.features) {
    if (data.features.rooms) features.push(`${data.features.rooms} oda`);
    if (data.features.bathrooms)
      features.push(`${data.features.bathrooms} banyo`);
    if (data.features.floors) features.push(`${data.features.floors} kat`);
    if (data.features.buildingAge !== undefined) {
      features.push(
        data.features.buildingAge === 0
          ? "Sıfır bina"
          : `${data.features.buildingAge} yaşında`
      );
    }
    if (data.features.heating) features.push(`${data.features.heating} ısıtma`);
    if (data.features.parking) features.push("Otopark");
    if (data.features.garden) features.push("Bahçe");
    if (data.features.pool) features.push("Havuz");
    if (data.features.elevator) features.push("Asansör");
    if (data.features.security) features.push("Güvenlik");
    if (data.features.infrastructure) features.push("Altyapı hazır");
    if (data.features.roadAccess)
      features.push(`${data.features.roadAccess} yol cephesi`);
    if (data.features.treeCount)
      features.push(`${data.features.treeCount} ağaç`);
    if (data.features.irrigation) features.push("Sulama sistemi");
    if (data.features.organic) features.push("Organik sertifikalı");
  }

  const priceFormatted = new Intl.NumberFormat("tr-TR").format(data.price);
  const areaFormatted = new Intl.NumberFormat("tr-TR").format(data.area);

  return `Sen profesyonel bir emlak danışmanısın. Aşağıdaki gayrimenkul için etkileyici, profesyonel ve SEO dostu bir ilan açıklaması yaz.

Gayrimenkul Bilgileri:
- Başlık: ${data.title}
- Tip: ${typeLabels[data.type]}
- İşlem: ${transactionLabels[data.transactionType]}
- Alan: ${areaFormatted} m²
- Fiyat: ${priceFormatted} TL
- Konum: ${data.neighborhood ? `${data.neighborhood}, ` : ""}${
    data.district || "Hendek"
  }, Sakarya
- Adres: ${data.address}
${features.length > 0 ? `- Özellikler: ${features.join(", ")}` : ""}

Kurallar:
1. Türkçe yaz
2. 150-250 kelime arası olsun
3. Profesyonel ve ikna edici bir dil kullan
4. Bölgenin avantajlarını vurgula (Hendek OSB, ulaşım, yatırım potansiyeli)
5. Özelliklerden bahset
6. Yatırım fırsatı olarak sun
7. Emoji kullanma
8. Sadece açıklama metnini döndür, başka bir şey yazma`;
}

export async function generateListingDescription(
  data: ListingData
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY tanımlanmamış");
  }

  const prompt = buildPrompt(data);

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Sen Türkiye'de faaliyet gösteren profesyonel bir emlak danışmanısın. Hendek, Sakarya bölgesinde uzmanlaşmışsın.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API hatası: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const description = result.choices?.[0]?.message?.content?.trim();

    if (!description) {
      throw new Error("DeepSeek boş yanıt döndürdü");
    }

    return description;
  } catch (error) {
    console.error("DeepSeek API hatası:", error);
    throw error;
  }
}

export type { ListingData };
