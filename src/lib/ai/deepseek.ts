/**
 * DeepSeek AI Client
 * Demir Gayrimenkul AI Agent Orchestrator için DeepSeek API entegrasyonu
 */

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const API_BASE_URL = "https://api.deepseek.com/v1";

export class DeepSeekClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private topP: number;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.topP = config.topP ?? 1;
  }

  async chat(messages: DeepSeekMessage[]): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data: DeepSeekResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  async *chatStream(
    messages: DeepSeekMessage[]
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Singleton instance
let deepseekClient: DeepSeekClient | null = null;

export function getDeepSeekClient(): DeepSeekClient {
  if (!deepseekClient) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY environment variable is not set");
    }
    deepseekClient = new DeepSeekClient({ apiKey });
  }
  return deepseekClient;
}

export function createDeepSeekClient(config: DeepSeekConfig): DeepSeekClient {
  return new DeepSeekClient(config);
}
