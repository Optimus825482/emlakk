/**
 * AI İşlem Step'leri
 * DEMİR-NET Workflow DevKit
 */

import { db } from "@/db";
import { systemSettings } from "@/db/schema";

interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

async function getAIConfig() {
  const [settings] = await db.select().from(systemSettings).limit(1);

  if (!settings?.aiApiKey || !settings.aiApiKeyValid) {
    throw new Error("AI API key yapılandırılmamış veya geçersiz");
  }

  return {
    provider: settings.aiProvider,
    model: settings.aiModel,
    apiKey: settings.aiApiKey,
  };
}

export async function generateWithAI(params: AIGenerateParams) {
  "use step";

  const config = await getAIConfig();
  const { prompt, systemPrompt, maxTokens = 2048 } = params;

  const messages = [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  // Provider'a göre API çağrısı
  let response: string;

  switch (config.provider) {
    case "deepseek":
      response = await callDeepSeek(
        config.apiKey,
        config.model,
        messages,
        maxTokens
      );
      break;
    case "openai":
      response = await callOpenAI(
        config.apiKey,
        config.model,
        messages,
        maxTokens
      );
      break;
    case "anthropic":
      response = await callAnthropic(
        config.apiKey,
        config.model,
        messages,
        maxTokens
      );
      break;
    case "google-gemini":
      response = await callGemini(
        config.apiKey,
        config.model,
        prompt,
        systemPrompt,
        maxTokens
      );
      break;
    case "openrouter":
      response = await callOpenRouter(
        config.apiKey,
        config.model,
        messages,
        maxTokens
      );
      break;
    default:
      throw new Error(`Desteklenmeyen provider: ${config.provider}`);
  }

  return { response, provider: config.provider, model: config.model };
}

async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemMsg?.content,
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content[0]?.text || "";
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string | undefined,
  maxTokens: number
): Promise<string> {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content || "";
}
