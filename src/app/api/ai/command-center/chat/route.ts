import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrchestrator } from "@/lib/ai/orchestrator";
import { getVectorMemoryService } from "@/lib/ai/vector-memory";
import { db } from "@/db";
import { aiConversations, aiAgentLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      chatHistory = [],
      sessionId,
      voiceCommand,
      commandType,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mesaj alanı zorunludur" },
        { status: 400 },
      );
    }

    const startTime = Date.now();
    const orchestrator = getOrchestrator();
    const vectorMemory = getVectorMemoryService();

    // 1. Semantic search in vector memory
    const relevantMemories = await vectorMemory.semanticSearch(message, {
      limit: 5,
      minImportance: 50,
    });

    // 2. Build enhanced context
    const memoryContext =
      relevantMemories.length > 0
        ? `\n\n**Hafızadan İlgili Bilgiler:**\n${relevantMemories.map((m) => `- ${m.summary} (Benzerlik: ${(m.similarity * 100).toFixed(0)}%)`).join("\n")}`
        : "";

    // 3. Enhanced system prompt
    const commandCenterPrompt = `Sen Demir Gayrimenkul'ün "Demir-AI Komuta Merkezi" yapay zeka asistanısın.

**Yeteneklerin:**
1. 📊 Veritabanı sorguları ve ilan analizi
2. 🐍 Python kod çalıştırma (sandbox)
3. 📈 Fiyat trendleri ve pazar analizi
4. 🗺️ Bölgesel analiz ve rakip takibi
5. 💬 Sesli ve yazılı iletişim
6. 🧠 Vektörel hafıza sistemi (semantic search)

**Mevcut Bağlam:**
- Kullanıcı: Admin (${session.user.email})
- Sistem: Demir Gayrimenkul Admin Paneli
${voiceCommand ? `- Sesli Komut: Evet (Tip: ${commandType || "genel"})` : ""}
${memoryContext}

**Kurallar:**
- Her zaman Türkçe konuş
- Teknik ama anlaşılır ol
- Önemli bilgileri hafızaya kaydet
- Asla hayali yanıt üretme
- kısa ve net yanıt ver`;

    // 4. Detect tool calling
    const needsToolCall = detectToolCall(message);
    let toolCalls: Array<{ name: string; result: unknown }> = [];

    if (needsToolCall) {
      toolCalls = await executeTools(message, session.user.id, vectorMemory);
    }

    // 5. Generate response
    const response = await orchestrator.chat("demir_agent", [
      { role: "system", content: commandCenterPrompt },
      ...chatHistory.slice(-10),
      { role: "user", content: message },
    ]);

    const executionTime = Date.now() - startTime;

    // 6. Save conversation
    const currentSessionId = sessionId || `session-${Date.now()}`;

    const conversationMessages = [
      ...chatHistory.slice(-10),
      { role: "user", content: message, timestamp: new Date().toISOString() },
      {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      const existing = await db
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.sessionId, currentSessionId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(aiConversations)
          .set({
            messages: conversationMessages,
            totalMessages: chatHistory.length + 2,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(aiConversations.sessionId, currentSessionId));
      } else {
        await db.insert(aiConversations).values({
          sessionId: currentSessionId,
          userId: session.user.id,
          agentType: "command_center",
          messages: conversationMessages,
          totalMessages: chatHistory.length + 2,
          lastMessageAt: new Date(),
        });
      }
    } catch (convError) {
      console.error("Conversation save error:", convError);
    }

    // 7. Log agent action
    try {
      await db.insert(aiAgentLogs).values({
        agentType: "command_center",
        action: "chat",
        input: {
          message,
          voiceCommand,
          commandType,
          toolCalls: toolCalls.map((t) => t.name),
        },
        output: { response, executionTime },
        durationMs: executionTime,
        success: true,
        userId: session.user.id,
        sessionId: currentSessionId,
      });
    } catch (logError) {
      console.error("Log error:", logError);
    }

    // 8. Auto-save to vector memory
    if (shouldSaveToMemory(message, response)) {
      try {
        await vectorMemory.storeMemory({
          content: `Q: ${message}\nA: ${response}`,
          summary: message.substring(0, 200),
          category: voiceCommand ? "voice_interaction" : "admin_interaction",
          memoryType: "conversation",
          importanceScore: calculateImportance(message, voiceCommand),
          sourceType: "chat",
          sourceId: session.user.id,
          tags: [commandType || "general", voiceCommand ? "voice" : "text"],
        });
      } catch (memError) {
        console.error("Memory save error:", memError);
      }
    }

    return NextResponse.json({
      success: true,
      response,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      executionTime,
      sessionId: currentSessionId,
      memoryUsed: relevantMemories.length,
    });
  } catch (error) {
    console.error("Command Center chat error:", error);
    return NextResponse.json(
      {
        error: "Bir hata oluştu",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

function detectToolCall(message: string): boolean {
  const toolKeywords = [
    "sql",
    "sorgu",
    "veritabanı",
    "database",
    "python",
    "kod",
    "çalıştır",
    "execute",
    "analiz",
    "rapor",
    "istatistik",
    "hafıza",
    "hatırla",
    "kaydet",
  ];
  return toolKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword),
  );
}

async function executeTools(
  message: string,
  userId: string,
  vectorMemory: ReturnType<typeof getVectorMemoryService>,
): Promise<Array<{ name: string; result: unknown }>> {
  const tools: Array<{ name: string; result: unknown }> = [];

  if (
    message.toLowerCase().includes("sql") ||
    message.toLowerCase().includes("sorgu")
  ) {
    tools.push({
      name: "execute_sql",
      result: { status: "simulated", message: "SQL sandbox pending" },
    });
  }

  if (
    message.toLowerCase().includes("python") ||
    message.toLowerCase().includes("kod")
  ) {
    tools.push({
      name: "execute_python",
      result: { status: "simulated", message: "Python sandbox pending" },
    });
  }

  if (
    message.toLowerCase().includes("hatırla") ||
    message.toLowerCase().includes("hafıza")
  ) {
    const memories = await vectorMemory.getRecentMemories(5);
    tools.push({
      name: "search_memory",
      result: {
        count: memories.length,
        memories: memories.map((m) => m.summary),
      },
    });
  }

  return tools;
}

function shouldSaveToMemory(message: string, response: string): boolean {
  const importantKeywords = [
    "nasıl",
    "neden",
    "ne zaman",
    "kim",
    "nerede",
    "önemli",
    "kritik",
    "unutma",
    "hatırla",
    "strateji",
    "plan",
    "karar",
  ];
  return (
    importantKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    ) || response.length > 200
  );
}

function calculateImportance(message: string, voiceCommand?: boolean): number {
  let score = 50;
  if (message.includes("?")) score += 10;
  if (voiceCommand) score += 15; // Voice commands are more important
  const highPriorityKeywords = ["kritik", "önemli", "acil", "strateji"];
  if (highPriorityKeywords.some((k) => message.toLowerCase().includes(k)))
    score += 20;
  if (message.length > 100) score += 10;
  return Math.min(score, 100);
}
