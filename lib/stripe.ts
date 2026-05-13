import Stripe from "stripe";
import {
  getResolvedStripeSecretKey,
  loadPlatformSettingsMap,
} from "@/lib/platformSettings";

const stripeByKey = new Map<string, Stripe>();

/** @deprecated prefer stripeConfigured() — checks env only (sync) */
export function stripeConfiguredFromEnv(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** True if Stripe secret key is available from DB overrides or environment. */
export async function stripeConfigured(): Promise<boolean> {
  const key = await getResolvedStripeSecretKey();
  return Boolean(key);
}

/**
 * Stripe client using secret key from platform settings (DB) or STRIPE_SECRET_KEY.
 */
export async function getStripe(): Promise<Stripe> {
  const key = await getResolvedStripeSecretKey();
  if (!key) throw new Error("Stripe secret key is not configured");
  let client = stripeByKey.get(key);
  if (!client) {
    client = new Stripe(key);
    stripeByKey.set(key, client);
  }
  return client;
}

/** Reset clients (e.g. after admin updates keys in DB). */
export function resetStripeClients(): void {
  stripeByKey.clear();
}

export function billingOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

/** For admin UI: whether DB has an override for a given key. */
export async function stripeKeySource(
  which: "secret" | "webhook",
): Promise<"database" | "environment" | "none"> {
  const map = await loadPlatformSettingsMap();
  if (which === "secret") {
    if (map.get("stripe_secret_key")?.trim()) return "database";
    if (process.env.STRIPE_SECRET_KEY?.trim()) return "environment";
    return "none";
  }
  if (map.get("stripe_webhook_secret")?.trim()) return "database";
  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) return "environment";
  return "none";
}
