import { prisma } from "@/lib/db";

const TTL_MS = 60_000;

let cache: { at: number; map: Map<string, string> } | null = null;

export const PLATFORM_KEYS = {
  STRIPE_SECRET_KEY: "stripe_secret_key",
  STRIPE_WEBHOOK_SECRET: "stripe_webhook_secret",
  STRIPE_PUBLISHABLE_KEY: "stripe_publishable_key",
  STRIPE_PRICE_PRO_MONTHLY: "stripe_price_pro_monthly",
  STRIPE_PRICE_ORG_SEAT_MONTHLY: "stripe_price_org_seat_monthly",
} as const;

export async function loadPlatformSettingsMap(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  const rows = await prisma.platformSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  cache = { at: Date.now(), map };
  return map;
}

export function invalidatePlatformSettingsCache(): void {
  cache = null;
}

export async function getResolvedStripeSecretKey(): Promise<string | undefined> {
  const map = await loadPlatformSettingsMap();
  const v = map.get(PLATFORM_KEYS.STRIPE_SECRET_KEY)?.trim();
  if (v) return v;
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export async function getResolvedWebhookSecret(): Promise<string | undefined> {
  const map = await loadPlatformSettingsMap();
  const v = map.get(PLATFORM_KEYS.STRIPE_WEBHOOK_SECRET)?.trim();
  if (v) return v;
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export async function getResolvedPublishableKey(): Promise<string | undefined> {
  const map = await loadPlatformSettingsMap();
  const v = map.get(PLATFORM_KEYS.STRIPE_PUBLISHABLE_KEY)?.trim();
  if (v) return v;
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

export async function getResolvedPriceProMonthly(): Promise<string | undefined> {
  const map = await loadPlatformSettingsMap();
  const v = map.get(PLATFORM_KEYS.STRIPE_PRICE_PRO_MONTHLY)?.trim();
  if (v) return v;
  return (
    process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() ||
    process.env.STRIPE_PRICE_PRO?.trim() ||
    undefined
  );
}

export async function getResolvedPriceOrgSeatMonthly(): Promise<
  string | undefined
> {
  const map = await loadPlatformSettingsMap();
  const v = map.get(PLATFORM_KEYS.STRIPE_PRICE_ORG_SEAT_MONTHLY)?.trim();
  if (v) return v;
  return (
    process.env.STRIPE_PRICE_ORG_SEAT_MONTHLY?.trim() ||
    process.env.STRIPE_PRICE_SEAT?.trim() ||
    undefined
  );
}

export function maskSecret(value: string | undefined | null, tail = 4): string {
  if (!value || value.length < tail + 1) return value ? "••••" : "";
  return `••••${value.slice(-tail)}`;
}
