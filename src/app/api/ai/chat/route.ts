import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/ai/orchestrator";
import { DeepSeekMessage } from "@/lib/ai/deepseek";

/**
 * POST /api/ai/chat
 * Demir Agent ile müşteri chat - Lead scoring özellikli
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatHistory = [], visitorInfo } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mesaj alanı zorunludur" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();

    // Chat history'yi doğru formata çevir
    const formattedHistory: DeepSeekMessage[] = chatHistory.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })
    );

    const result = await orchestrator.demirAgentChat(
      message,
      formattedHistory,
      visitorInfo
    );

    return NextResponse.json({
      success: true,
      response: result.response,
      leadScore: result.leadScore,
      intent: result.intent,
    });
  } catch (error) {
    console.error("AI Chat hatası:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Bilinmeyen hata";

    if (errorMessage.includes("DEEPSEEK_API_KEY")) {
      return NextResponse.json(
        { error: "AI servisi yapılandırılmamış. DEEPSEEK_API_KEY gerekli." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Chat hatası: ${errorMessage}` },
      { status: 500 }
    );
  }
}
