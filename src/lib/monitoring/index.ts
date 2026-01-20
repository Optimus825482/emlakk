import { env } from "@/lib/env";

type LogLevel = "info" | "warn" | "error" | "debug";
type AlertSeverity = "info" | "warning" | "error" | "critical";

interface LogContext {
  module?: string;
  action?: string;
  duration?: number;
  traceId?: string;
  [key: string]: unknown;
}

interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  context?: Record<string, unknown>;
}

export function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context,
  };

  const prefix = `[${timestamp}] [${level.toUpperCase()}]${context?.traceId ? ` [${context.traceId}]` : ""}`;

  switch (level) {
    case "error":
      console.error(prefix, message, context || "");
      break;
    case "warn":
      console.warn(prefix, message, context || "");
      break;
    case "debug":
      if (env.NODE_ENV === "development") {
        console.debug(prefix, message, context || "");
      }
      break;
    default:
      console.log(prefix, message, context || "");
  }

  return logData;
}

export async function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  log("error", error.message, {
    module: "error-capture",
    stack: error.stack,
    ...context,
  });

  if (env.NODE_ENV === "production") {
    await sendAlert({
      title: "🚨 Hata Yakalandı",
      message: error.message,
      severity: "error",
      context: {
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
        ...context,
      },
    });
  }
}

export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  const { title, message, severity, context } = payload;

  const severityEmoji: Record<AlertSeverity, string> = {
    info: "ℹ️",
    warning: "⚠️",
    error: "🚨",
    critical: "🔥",
  };

  const emoji = severityEmoji[severity];
  const timestamp = new Date().toISOString();

  if (env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: `${emoji} ${title}` },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: message },
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `*Severity:* ${severity}` },
                { type: "mrkdwn", text: `*Time:* ${timestamp}` },
              ],
            },
            ...(context
              ? [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text: `\`\`\`${JSON.stringify(context, null, 2).slice(
                        0,
                        500
                      )}\`\`\``,
                    },
                  },
                ]
              : []),
          ],
        }),
      });
      return true;
    } catch (e) {
      console.error("Slack alert failed:", e);
    }
  }

  if (env.DISCORD_WEBHOOK_URL) {
    try {
      const colorMap: Record<AlertSeverity, number> = {
        info: 0x3498db,
        warning: 0xf39c12,
        error: 0xe74c3c,
        critical: 0x9b59b6,
      };

      await fetch(env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `${emoji} ${title}`,
              description: message,
              color: colorMap[severity],
              timestamp,
              fields: context
                ? Object.entries(context)
                    .slice(0, 5)
                    .map(([k, v]) => ({
                      name: k,
                      value: String(v).slice(0, 200),
                      inline: true,
                    }))
                : [],
            },
          ],
        }),
      });
      return true;
    } catch (e) {
      console.error("Discord alert failed:", e);
    }
  }

  return false;
}

export function createTimer(name: string) {
  const start = performance.now();

  return {
    end: (context?: LogContext) => {
      const duration = Math.round(performance.now() - start);
      log("info", `${name} completed`, { ...context, duration });
      return duration;
    },
  };
}

export async function checkCrawlerHealth(): Promise<{
  healthy: boolean;
  details: Record<string, unknown>;
}> {
  try {
    const response = await fetch(`${env.CRAWLER_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { healthy: false, details: { status: response.status } };
    }

    const data = await response.json();
    return { healthy: true, details: data };
  } catch (error) {
    return {
      healthy: false,
      details: { error: error instanceof Error ? error.message : "Unknown" },
    };
  }
}

export async function sendDailySummary(stats: {
  newListings: number;
  detailsFetched: number;
  removed: number;
  errors: number;
}) {
  const { newListings, detailsFetched, removed, errors } = stats;

  await sendAlert({
    title: "📊 Günlük ULW Özeti",
    message: [
      `• Yeni İlan: ${newListings}`,
      `• Detay Çekilen: ${detailsFetched}`,
      `• Kaldırılan: ${removed}`,
      `• Hata: ${errors}`,
    ].join("\n"),
    severity: errors > 10 ? "warning" : "info",
    context: stats,
  });
}
