/**
 * Google Gemini AI Client
 * Demir Gayrimenkul AI Agent Orchestrator için Gemini API entegrasyonu
 * Model: gemini-2.5-flash-latest
 */

export interface GeminiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// Gemini API Response Types
interface GeminiCandidate {
  content: {
    parts: Array<{ text: string }>;
    role: string;
  };
  finishReason: string;
  index: number;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 8192;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private topP: number;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.topP = config.topP ?? 0.95;
  }

  /**
   * Convert our standard message format to Gemini's format
   * Gemini uses 'user' and 'model' roles, not 'assistant'
   */
  private convertToGeminiFormat(messages: GeminiMessage[]): {
    systemInstruction?: { parts: Array<{ text: string }> };
    contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }>;
  } {
    const systemMessages = messages.filter((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // Combine all system messages into one system instruction
    const systemInstruction =
      systemMessages.length > 0
        ? {
            parts: [
              { text: systemMessages.map((m) => m.content).join("\n\n") },
            ],
          }
        : undefined;

    // Convert conversation messages
    const contents = conversationMessages.map((msg) => ({
      role: (msg.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: msg.content }],
    }));

    return { systemInstruction, contents };
  }

  async chat(messages: GeminiMessage[]): Promise<string> {
    const { systemInstruction, contents } =
      this.convertToGeminiFormat(messages);

    console.log(`[GeminiClient] Sending request to model: ${this.model}`);

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: this.temperature,
        topP: this.topP,
        maxOutputTokens: this.maxTokens,
      },
    };

    // Add system instruction if present
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    let lastError: Error | null = null;
    const maxRetries = 2; // Try a total of 3 times (1 initial + 2 retries)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 2000; // More aggressive backoff: 2s, 4s, 8s
          console.warn(
            `[GeminiClient] Rate limited. Retrying attempt ${attempt}/${maxRetries} after ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const response = await fetch(
          `${API_BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          // If NOT a 429 error, throw immediately (don't retry)
          if (response.status !== 429) {
            console.error("[GeminiClient] API Error:", errorText);
            throw new Error(
              `Gemini API error: ${response.status} - ${errorText}`,
            );
          }
          // If 429, throw to catch block to trigger retry
          throw new Error(`Gemini Rate Limit (429): ${errorText}`);
        }

        const data: GeminiResponse = await response.json();

        // Extract text from response
        const candidate = data.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
          throw new Error("Gemini API returned empty response");
        }

        return candidate.content.parts[0].text;
      } catch (error: any) {
        lastError = error;
        // If it's a rate limit error, continue loop. Otherwise rethrow.
        if (
          !error.message.includes("429") &&
          !error.message.includes("Rate Limit")
        ) {
          throw error;
        }
      }
    }

    // If loop finishes without success
    throw lastError || new Error("Gemini API Request failed after retries.");
  }

  async *chatStream(
    messages: GeminiMessage[],
  ): AsyncGenerator<string, void, unknown> {
    const { systemInstruction, contents } =
      this.convertToGeminiFormat(messages);

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: this.temperature,
        topP: this.topP,
        maxOutputTokens: this.maxTokens,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    const response = await fetch(
      `${API_BASE_URL}/models/${this.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    geminiClient = new GeminiClient({ apiKey });
  }
  return geminiClient;
}

export function createGeminiClient(config: GeminiConfig): GeminiClient {
  return new GeminiClient(config);
}
