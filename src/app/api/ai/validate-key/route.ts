import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ProviderConfig {
  baseUrl: string;
  modelsEndpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  parseModels: (data: unknown) => string[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    modelsEndpoint: "/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
    parseModels: (data: unknown) => {
      const response = data as { data?: { id: string }[] };
      return (
        response.data?.map((m) => m.id) || ["deepseek-chat", "deepseek-coder"]
      );
    },
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    modelsEndpoint: "/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
    parseModels: (data: unknown) => {
      const response = data as { data?: { id: string }[] };
      const models = response.data?.map((m) => m.id) || [];
      // GPT modellerini filtrele
      return models.filter(
        (m) => m.startsWith("gpt-") || m.startsWith("o1") || m.startsWith("o3")
      );
    },
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    modelsEndpoint: "/models",
    headers: (apiKey) => ({
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    parseModels: () => [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
  },
  "google-gemini": {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    modelsEndpoint: "/models",
    headers: () => ({}),
    parseModels: (data: unknown) => {
      const response = data as { models?: { name: string }[] };
      return (
        response.models
          ?.map((m) => m.name.replace("models/", ""))
          .filter((m) => m.includes("gemini")) || [
          "gemini-2.0-flash",
          "gemini-1.5-pro",
          "gemini-1.5-flash",
        ]
      );
    },
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    modelsEndpoint: "/models",
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
    }),
    parseModels: (data: unknown) => {
      const response = data as { data?: { id: string }[] };
      return response.data?.map((m) => m.id).slice(0, 50) || [];
    },
  },
};

/**
 * POST /api/ai/validate-key
 * Validate API key and fetch available models
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider ve API key gerekli" },
        { status: 400 }
      );
    }

    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      return NextResponse.json({ error: "Geçersiz provider" }, { status: 400 });
    }

    // API key'i doğrula ve modelleri çek
    let models: string[] = [];
    let isValid = false;

    try {
      let url = `${config.baseUrl}${config.modelsEndpoint}`;

      // Google Gemini için API key query param olarak eklenir
      if (provider === "google-gemini") {
        url += `?key=${apiKey}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: config.headers(apiKey),
      });

      if (response.ok) {
        const data = await response.json();
        models = config.parseModels(data);
        isValid = true;

        // API key'i ve durumu veritabanına kaydet
        const [existing] = await db.select().from(systemSettings).limit(1);
        if (existing) {
          await db
            .update(systemSettings)
            .set({
              aiProvider: provider,
              aiApiKey: apiKey,
              aiApiKeyValid: true,
              aiApiKeyLastChecked: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(systemSettings.id, existing.id));
        }
      } else {
        const errorText = await response.text();
        console.error(`API validation failed for ${provider}:`, errorText);

        // Anthropic için özel durum - models endpoint'i olmayabilir
        if (provider === "anthropic" && response.status === 404) {
          // Basit bir test isteği gönder
          const testResponse = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                ...config.headers(apiKey),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1,
                messages: [{ role: "user", content: "Hi" }],
              }),
            }
          );

          // 200 veya 400 (bad request ama auth geçti) kabul edilebilir
          if (testResponse.ok || testResponse.status === 400) {
            isValid = true;
            models = config.parseModels(null);

            const [existing] = await db.select().from(systemSettings).limit(1);
            if (existing) {
              await db
                .update(systemSettings)
                .set({
                  aiProvider: provider,
                  aiApiKey: apiKey,
                  aiApiKeyValid: true,
                  aiApiKeyLastChecked: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(systemSettings.id, existing.id));
            }
          }
        }
      }
    } catch (fetchError) {
      console.error(`Fetch error for ${provider}:`, fetchError);
    }

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: "API key doğrulanamadı. Lütfen key'i kontrol edin.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      models: models.sort(),
      message: "API key doğrulandı",
    });
  } catch (error) {
    console.error("AI validate-key error:", error);
    return NextResponse.json(
      { error: "API key doğrulanırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
