import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import {
  invalidatePlatformSettingsCache,
  loadPlatformSettingsMap,
  maskSecret,
  PLATFORM_KEYS,
} from "@/lib/platformSettings";
import { prisma } from "@/lib/db";
import { resetStripeClients, stripeKeySource } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type SettingsPayload = {
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripePublishableKey?: string;
  stripePriceProMonthly?: string;
  stripePriceOrgSeatMonthly?: string;
  /** Set true to remove DB override and fall back to env */
  clearStripeSecretKey?: boolean;
  clearStripeWebhookSecret?: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const map = await loadPlatformSettingsMap();

  const secretKey = map.get(PLATFORM_KEYS.STRIPE_SECRET_KEY)?.trim();
  const webhook = map.get(PLATFORM_KEYS.STRIPE_WEBHOOK_SECRET)?.trim();
  const pk = map.get(PLATFORM_KEYS.STRIPE_PUBLISHABLE_KEY)?.trim();
  const pricePro = map.get(PLATFORM_KEYS.STRIPE_PRICE_PRO_MONTHLY)?.trim();
  const priceSeat = map.get(PLATFORM_KEYS.STRIPE_PRICE_ORG_SEAT_MONTHLY)?.trim();

  return NextResponse.json({
    sources: {
      stripeSecretKey: await stripeKeySource("secret"),
      stripeWebhookSecret: await stripeKeySource("webhook"),
    },
    stripeSecretKey: maskSecret(secretKey),
    stripeSecretKeySet: Boolean(secretKey || process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: maskSecret(webhook),
    stripeWebhookSecretSet: Boolean(
      webhook || process.env.STRIPE_WEBHOOK_SECRET,
    ),
    stripePublishableKey:
      pk ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "",
    stripePriceProMonthly:
      pricePro ||
      process.env.STRIPE_PRICE_PRO_MONTHLY ||
      process.env.STRIPE_PRICE_PRO ||
      "",
    stripePriceOrgSeatMonthly:
      priceSeat ||
      process.env.STRIPE_PRICE_ORG_SEAT_MONTHLY ||
      process.env.STRIPE_PRICE_SEAT ||
      "",
    hint:
      "Secrets in the database override environment variables. Empty secret fields on save leave existing values unchanged. Use the clear checkboxes to remove DB overrides.",
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SettingsPayload;
  try {
    body = (await request.json()) as SettingsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ops: Promise<unknown>[] = [];

  async function upsert(key: string, value: string) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async function delKey(key: string) {
    await prisma.platformSetting.deleteMany({ where: { key } });
  }

  if (body.clearStripeSecretKey) {
    ops.push(delKey(PLATFORM_KEYS.STRIPE_SECRET_KEY));
  } else if (
    typeof body.stripeSecretKey === "string" &&
    body.stripeSecretKey.trim().length > 0
  ) {
    ops.push(upsert(PLATFORM_KEYS.STRIPE_SECRET_KEY, body.stripeSecretKey.trim()));
  }

  if (body.clearStripeWebhookSecret) {
    ops.push(delKey(PLATFORM_KEYS.STRIPE_WEBHOOK_SECRET));
  } else if (
    typeof body.stripeWebhookSecret === "string" &&
    body.stripeWebhookSecret.trim().length > 0
  ) {
    ops.push(
      upsert(PLATFORM_KEYS.STRIPE_WEBHOOK_SECRET, body.stripeWebhookSecret.trim()),
    );
  }

  if (
    typeof body.stripePublishableKey === "string" &&
    body.stripePublishableKey.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.STRIPE_PUBLISHABLE_KEY,
        body.stripePublishableKey.trim(),
      ),
    );
  }

  if (
    typeof body.stripePriceProMonthly === "string" &&
    body.stripePriceProMonthly.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.STRIPE_PRICE_PRO_MONTHLY,
        body.stripePriceProMonthly.trim(),
      ),
    );
  }

  if (
    typeof body.stripePriceOrgSeatMonthly === "string" &&
    body.stripePriceOrgSeatMonthly.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.STRIPE_PRICE_ORG_SEAT_MONTHLY,
        body.stripePriceOrgSeatMonthly.trim(),
      ),
    );
  }

  if (ops.length === 0) {
    return NextResponse.json(
      { error: "No settings provided." },
      { status: 400 },
    );
  }

  await Promise.all(ops);
  invalidatePlatformSettingsCache();
  resetStripeClients();

  return NextResponse.json({ ok: true });
}
