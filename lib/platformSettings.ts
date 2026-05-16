import { prisma } from "@/lib/db";

const TTL_MS = 60_000;

let cache: { at: number; map: Map<string, string> } | null = null;

export const PLATFORM_KEYS = {
  STRIPE_SECRET_KEY: "stripe_secret_key",
  STRIPE_WEBHOOK_SECRET: "stripe_webhook_secret",
  STRIPE_PUBLISHABLE_KEY: "stripe_publishable_key",
  STRIPE_PRICE_PRO_MONTHLY: "stripe_price_pro_monthly",
  STRIPE_PRICE_ORG_SEAT_MONTHLY: "stripe_price_org_seat_monthly",
  /** Monthly amount in cents when no Stripe Price ID is set (integer string). */
  BILLING_PRO_AMOUNT_CENTS: "billing_pro_amount_cents",
  BILLING_PRO_CURRENCY: "billing_pro_currency",
  BILLING_PRO_PRODUCT_NAME: "billing_pro_product_name",
  BILLING_ORG_SEAT_AMOUNT_CENTS: "billing_org_seat_amount_cents",
  BILLING_ORG_SEAT_CURRENCY: "billing_org_seat_currency",
  BILLING_ORG_SEAT_PRODUCT_NAME: "billing_org_seat_product_name",

  OAUTH_GOOGLE_ENABLED: "oauth_google_enabled",
  OAUTH_GOOGLE_CLIENT_ID: "oauth_google_client_id",
  OAUTH_GOOGLE_CLIENT_SECRET: "oauth_google_client_secret",

  OAUTH_APPLE_ENABLED: "oauth_apple_enabled",
  OAUTH_APPLE_CLIENT_ID: "oauth_apple_client_id",
  /** Pre-built JWT (expires ~6 months); optional if using PEM + team/key id below. */
  OAUTH_APPLE_CLIENT_SECRET: "oauth_apple_client_secret",
  OAUTH_APPLE_TEAM_ID: "oauth_apple_team_id",
  OAUTH_APPLE_KEY_ID: "oauth_apple_key_id",
  OAUTH_APPLE_PRIVATE_KEY: "oauth_apple_private_key",

  OAUTH_MICROSOFT_ENABLED: "oauth_microsoft_enabled",
  OAUTH_MICROSOFT_CLIENT_ID: "oauth_microsoft_client_id",
  OAUTH_MICROSOFT_CLIENT_SECRET: "oauth_microsoft_client_secret",
  /** e.g. https://login.microsoftonline.com/common/v2.0/ or tenant-specific */
  OAUTH_MICROSOFT_ISSUER: "oauth_microsoft_issuer",
} as const;

export async function loadPlatformSettingsMap(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  try {
    const rows = await prisma.platformSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    cache = { at: Date.now(), map };
    return map;
  } catch (e) {
    console.error("[platformSettings] Failed to load settings from DB:", e);
    const empty = new Map<string, string>();
    cache = { at: Date.now(), map: empty };
    return empty;
  }
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

export type ResolvedStripeLineItem =
  | { mode: "price"; price: string }
  | {
      mode: "price_data";
      price_data: {
        currency: string;
        unit_amount: number;
        recurring: { interval: "month" };
        product_data: { name: string };
      };
    };

/** Prefer Stripe Price ID; otherwise use admin-set monthly amount (cents). */
export async function resolveProSubscriptionLineItem(): Promise<ResolvedStripeLineItem | null> {
  const priceId = (await getResolvedPriceProMonthly())?.trim();
  if (priceId) return { mode: "price", price: priceId };

  const map = await loadPlatformSettingsMap();
  const centsRaw = map.get(PLATFORM_KEYS.BILLING_PRO_AMOUNT_CENTS)?.trim();
  const cents = centsRaw ? parseInt(centsRaw, 10) : NaN;
  const currency =
    map.get(PLATFORM_KEYS.BILLING_PRO_CURRENCY)?.trim().toLowerCase() ||
    "usd";
  const productName =
    map.get(PLATFORM_KEYS.BILLING_PRO_PRODUCT_NAME)?.trim() ||
    "Pro — monthly";
  if (Number.isFinite(cents) && cents >= 50) {
    return {
      mode: "price_data",
      price_data: {
        currency,
        unit_amount: cents,
        recurring: { interval: "month" },
        product_data: { name: productName },
      },
    };
  }
  return null;
}

export async function resolveOrgSeatSubscriptionLineItem(): Promise<ResolvedStripeLineItem | null> {
  const priceId = (await getResolvedPriceOrgSeatMonthly())?.trim();
  if (priceId) return { mode: "price", price: priceId };

  const map = await loadPlatformSettingsMap();
  const centsRaw = map
    .get(PLATFORM_KEYS.BILLING_ORG_SEAT_AMOUNT_CENTS)
    ?.trim();
  const cents = centsRaw ? parseInt(centsRaw, 10) : NaN;
  const currency =
    map.get(PLATFORM_KEYS.BILLING_ORG_SEAT_CURRENCY)?.trim().toLowerCase() ||
    "usd";
  const productName =
    map.get(PLATFORM_KEYS.BILLING_ORG_SEAT_PRODUCT_NAME)?.trim() ||
    "Fleet seat — monthly";
  if (Number.isFinite(cents) && cents >= 50) {
    return {
      mode: "price_data",
      price_data: {
        currency,
        unit_amount: cents,
        recurring: { interval: "month" },
        product_data: { name: productName },
      },
    };
  }
  return null;
}

export function settingTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function maskSecret(value: string | undefined | null, tail = 4): string {
  if (!value || value.length < tail + 1) return value ? "••••" : "";
  return `••••${value.slice(-tail)}`;
}
