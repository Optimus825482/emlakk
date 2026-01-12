import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Service Account credentials from environment
// Supports both JSON format (GOOGLE_APPLICATION_CREDENTIALS_JSON) and individual vars
function getCredentials() {
  // Option 1: Full JSON credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON");
    }
  }

  // Option 2: Individual environment variables
  const privateKey = process.env.GA_PRIVATE_KEY;
  if (!privateKey || !process.env.GA_CLIENT_EMAIL) {
    return null;
  }

  return {
    client_email: process.env.GA_CLIENT_EMAIL,
    // Handle both escaped \n and actual newlines
    private_key: privateKey.includes("\\n")
      ? privateKey.replace(/\\n/g, "\n")
      : privateKey,
  };
}

const propertyId = process.env.GA_PROPERTY_ID;

// Analytics client singleton
let analyticsClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (!analyticsClient) {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error("Google Analytics credentials not configured");
    }
    analyticsClient = new BetaAnalyticsDataClient({ credentials });
  }
  return analyticsClient;
}

export interface AnalyticsOverview {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface PageViewData {
  pagePath: string;
  pageTitle: string;
  views: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface DailyData {
  date: string;
  users: number;
  sessions: number;
  pageViews: number;
}

/**
 * Son 7 günlük genel istatistikler
 */
export async function getAnalyticsOverview(
  days: number = 7
): Promise<AnalyticsOverview> {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID not configured");
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });

  const row = response.rows?.[0];
  const values = row?.metricValues || [];

  return {
    totalUsers: parseInt(values[0]?.value || "0"),
    newUsers: parseInt(values[1]?.value || "0"),
    sessions: parseInt(values[2]?.value || "0"),
    pageViews: parseInt(values[3]?.value || "0"),
    avgSessionDuration: parseFloat(values[4]?.value || "0"),
    bounceRate: parseFloat(values[5]?.value || "0"),
  };
}

/**
 * En çok görüntülenen sayfalar
 */
export async function getTopPages(limit: number = 10): Promise<PageViewData[]> {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID not configured");
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (response.rows || []).map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || "",
    pageTitle: row.dimensionValues?.[1]?.value || "",
    views: parseInt(row.metricValues?.[0]?.value || "0"),
  }));
}

/**
 * Trafik kaynakları
 */
export async function getTrafficSources(
  limit: number = 10
): Promise<TrafficSource[]> {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID not configured");
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  });

  return (response.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value || "(direct)",
    medium: row.dimensionValues?.[1]?.value || "(none)",
    sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    users: parseInt(row.metricValues?.[1]?.value || "0"),
  }));
}

/**
 * Günlük veri trendi
 */
export async function getDailyTrend(days: number = 30): Promise<DailyData[]> {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID not configured");
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
  });

  return (response.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || "",
    users: parseInt(row.metricValues?.[0]?.value || "0"),
    sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
  }));
}

/**
 * Realtime aktif kullanıcılar
 */
export async function getRealtimeUsers(): Promise<number> {
  if (!propertyId) {
    throw new Error("GA_PROPERTY_ID not configured");
  }

  const client = getClient();

  try {
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    return parseInt(response.rows?.[0]?.metricValues?.[0]?.value || "0");
  } catch {
    return 0;
  }
}
