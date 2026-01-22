import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator, AgentContext } from "@/lib/ai/orchestrator";
import { auth } from "@/lib/auth";
import { DeepSeekMessage } from "@/lib/ai/deepseek";

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

    // 4. Prepare Context
    const agentContext: AgentContext = {
      agentType: "admin_assistant",
      userId: session.user.id,
      sessionId: context?.sessionId || "admin-session",
      metadata: {
        ...context,
        userRole: session.user.role,
        userName: session.user.name,
      },
    };

    // 5. Create Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await orchestrator.adminAssistantChat(
            messages as DeepSeekMessage[],
            agentContext,
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
