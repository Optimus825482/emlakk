import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/ai/orchestrator";

/**
 * POST /api/ai/listing-copilot
 * İlan düzenleme sayfası için AI Yardımcısı (Demir-AI)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatHistory = [], listingData } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mesaj alanı zorunludur" },
        { status: 400 },
      );
    }

    const orchestrator = getOrchestrator();

    // Özel Demir-AI promptu ile chat yap
    const copilotPrompt = `Sen Demir Gayrimenkul'ün "Demir-AI" asistanısın. 
Şu an bir emlak danışmanına bir ilanı ([${listingData?.title || "İsimsiz İlan"}]) optimize etmesi için yardım ediyorsun.

İLAN VERİLERİ:
${JSON.stringify(listingData, null, 2)}

Görevin:
1. İlan başlığı ve açıklamasını daha çekici hale getirmek için öneriler sunmak.
2. Fiyatın bölge normlarına (Hendek/Sakarya) uygunluğunu değerlendirmek (eğer fiyata dair veri varsa).
3. Eksik olan veya geliştirilmesi gereken alanları belirtmek.
4. Sosyal medya içeriği veya SEO meta verileri için hızlı fikirler vermek.

Kurallar:
- Yanıtların kısa, öz ve aksiyon odaklı olsun.
- "Proaktif" ol. İlandaki zayıf noktaları (örn: kısa açıklama, eksik özellikler) hemen fark et.
- Teknik terimleri (imar, parsel, ada) doğru kullan.
- Türkçe ve profesyonel bir üslup kullan.`;

    const response = await orchestrator.chat("content_agent", [
      { role: "system", content: copilotPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ]);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Demir-AI hatası:", error);
    return NextResponse.json(
      { error: "Demir-AI şu an yanıt veremiyor." },
      { status: 500 },
    );
  }
}
