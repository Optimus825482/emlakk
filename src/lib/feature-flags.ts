import { env } from "@/lib/env";

export const featureFlags = {
  aiValuation: env.NODE_ENV === "production" ? true : true,
  aiChat: env.NODE_ENV === "production" ? false : true,
  dataMining: env.NODE_ENV === "production" ? true : true,
  seoGeneration: true,
  listingDescriptionAI: !!env.DEEPSEEK_API_KEY,
};

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
