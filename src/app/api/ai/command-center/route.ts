import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator, AgentContext } from "@/lib/ai/orchestrator";
import { auth } from "@/lib/auth";
import { GeminiMessage } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, context } = body;

    // 2. Validate Input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    // 3. Initialize Orchestrator
    const orchestrator = getOrchestrator();

    // 4. Prepare Context with Emotional Information
    const agentContext: AgentContext = {
      agentType: "admin_assistant",
      userId: session.user.id,
      sessionId: context?.sessionId || "admin-session",
      metadata: {
        ...context,
        userRole: session.user.role,
        userName: session.user.name,
        // Emotional context for empathetic responses
        userEmotion: context?.userEmotion,
        emotionTone: context?.emotionTone,
        conversationMood: context?.conversationMood,
      },
    };

    // 5. Build emotional system prompt if emotion detected
    let emotionalSystemPrompt = "";
    if (context?.userEmotion && context?.userEmotion !== "neutral") {
      const emotionPrompts: Record<string, string> = {
        happy:
          "Kullanıcı mutlu görünüyor. Enerjik ve olumlu bir tonla yanıt ver.",
        excited: "Kullanıcı heyecanlı! Aynı enerjiyle karşılık ver.",
        sad: "Kullanıcı üzgün görünüyor. Nazik ve destekleyici ol, empati kur.",
        angry:
          "Kullanıcı sinirli. Sakin ve anlayışlı ol, onu dinlediğini göster.",
        frustrated: "Kullanıcı hayal kırıklığına uğramış. Çözüm odaklı ol.",
        fearful: "Kullanıcı endişeli. Güven verici ol, adım adım yardım et.",
        curious: "Kullanıcı meraklı! Detaylı ve bilgilendirici ol.",
        surprised: "Kullanıcı şaşkın. Açıklayıcı ol, detay ver.",
      };
      emotionalSystemPrompt = emotionPrompts[context.userEmotion] || "";
    }

    // 6. Create Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Inject emotional context into messages if present
          let processedMessages = messages as GeminiMessage[];
          if (emotionalSystemPrompt) {
            // Add emotional guidance as a system-level hint
            const lastUserMsgIndex = processedMessages.findIndex(
              (m, i) => m.role === "user" && i === processedMessages.length - 1,
            );
            if (lastUserMsgIndex >= 0) {
              // Prepend emotional context to the conversation
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "log",
                    agent: "EmotionAI",
                    content: `Duygu algılandı: ${context?.userEmotion}. Empatik yanıt hazırlanıyor...`,
                  }) + "\n",
                ),
              );
            }
          }

          const response = await orchestrator.adminAssistantChat(
            processedMessages,
            {
              ...agentContext,
              metadata: {
                ...agentContext.metadata,
                emotionalSystemPrompt,
              },
            },
            (step) => {
              // Write progress log
              const data = JSON.stringify(step) + "\n";
              controller.enqueue(encoder.encode(data));
            },
          );

          // Write final result
          const finalData =
            JSON.stringify({ type: "result", content: response }) + "\n";
          controller.enqueue(encoder.encode(finalData));
          controller.close();
        } catch (error: any) {
          console.error("Orchestrator Error:", error);
          const errorData =
            JSON.stringify({ type: "error", error: error.message }) + "\n";
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked", // Optional but implies streaming
      },
    });
  } catch (error) {
    console.error("DemirAI Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
