import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import {
  invalidatePlatformSettingsCache,
  loadPlatformSettingsMap,
  maskSecret,
  PLATFORM_KEYS,
  settingTruthy,
} from "@/lib/platformSettings";
import { prisma } from "@/lib/db";
import { resetStripeClients, stripeKeySource } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type SettingsPayload = Record<string, unknown>;

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

  const googleSecret = map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET)?.trim();
  const appleSecret = map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET)?.trim();
  const applePem = map.get(PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY)?.trim();
  const msSecret = map.get(
    PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET,
  )?.trim();

  const proCents = map.get(PLATFORM_KEYS.BILLING_PRO_AMOUNT_CENTS)?.trim();
  const seatCents = map
    .get(PLATFORM_KEYS.BILLING_ORG_SEAT_AMOUNT_CENTS)
    ?.trim();

  const proDollars =
    proCents && /^\d+$/.test(proCents)
      ? (Number(proCents) / 100).toFixed(2)
      : "";
  const seatDollars =
    seatCents && /^\d+$/.test(seatCents)
      ? (Number(seatCents) / 100).toFixed(2)
      : "";

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
      pk || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
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

    billingProMonthlyDollars: proDollars,
    billingProCurrency:
      map.get(PLATFORM_KEYS.BILLING_PRO_CURRENCY)?.trim() || "usd",
    billingProProductName:
      map.get(PLATFORM_KEYS.BILLING_PRO_PRODUCT_NAME)?.trim() || "",
    billingOrgSeatMonthlyDollars: seatDollars,
    billingOrgSeatCurrency:
      map.get(PLATFORM_KEYS.BILLING_ORG_SEAT_CURRENCY)?.trim() || "usd",
    billingOrgSeatProductName:
      map.get(PLATFORM_KEYS.BILLING_ORG_SEAT_PRODUCT_NAME)?.trim() || "",

    oauthGoogleEnabled: settingTruthy(
      map.get(PLATFORM_KEYS.OAUTH_GOOGLE_ENABLED),
    ),
    oauthGoogleClientId:
      map.get(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_ID)?.trim() || "",
    oauthGoogleClientSecretSet: Boolean(googleSecret),

    oauthAppleEnabled: settingTruthy(map.get(PLATFORM_KEYS.OAUTH_APPLE_ENABLED)),
    oauthAppleClientId:
      map.get(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_ID)?.trim() || "",
    oauthAppleClientSecretSet: Boolean(appleSecret),
    oauthAppleTeamId:
      map.get(PLATFORM_KEYS.OAUTH_APPLE_TEAM_ID)?.trim() || "",
    oauthAppleKeyId: map.get(PLATFORM_KEYS.OAUTH_APPLE_KEY_ID)?.trim() || "",
    oauthApplePrivateKeySet: Boolean(applePem),

    oauthMicrosoftEnabled: settingTruthy(
      map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ENABLED),
    ),
    oauthMicrosoftClientId:
      map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_ID)?.trim() || "",
    oauthMicrosoftClientSecretSet: Boolean(msSecret),
    oauthMicrosoftIssuer:
      map.get(PLATFORM_KEYS.OAUTH_MICROSOFT_ISSUER)?.trim() || "",

    hint:
      "Secrets live in the database when set here (unless cleared). AUTH_SECRET and AUTH_URL / NEXTAUTH_URL stay in environment variables for signing cookies and OAuth redirects.",
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

  if (body.clearStripeSecretKey === true) {
    ops.push(delKey(PLATFORM_KEYS.STRIPE_SECRET_KEY));
  } else if (
    typeof body.stripeSecretKey === "string" &&
    body.stripeSecretKey.trim().length > 0
  ) {
    ops.push(upsert(PLATFORM_KEYS.STRIPE_SECRET_KEY, body.stripeSecretKey.trim()));
  }

  if (body.clearStripeWebhookSecret === true) {
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

  if (typeof body.oauthGoogleEnabled === "boolean") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_GOOGLE_ENABLED,
        body.oauthGoogleEnabled ? "true" : "false",
      ),
    );
  }
  if (typeof body.oauthGoogleClientId === "string") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_ID,
        body.oauthGoogleClientId.trim(),
      ),
    );
  }
  if (body.clearOauthGoogleClientSecret === true) {
    ops.push(delKey(PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET));
  } else if (
    typeof body.oauthGoogleClientSecret === "string" &&
    body.oauthGoogleClientSecret.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_GOOGLE_CLIENT_SECRET,
        body.oauthGoogleClientSecret.trim(),
      ),
    );
  }

  if (typeof body.oauthAppleEnabled === "boolean") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_APPLE_ENABLED,
        body.oauthAppleEnabled ? "true" : "false",
      ),
    );
  }
  if (typeof body.oauthAppleClientId === "string") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_APPLE_CLIENT_ID,
        body.oauthAppleClientId.trim(),
      ),
    );
  }
  if (typeof body.oauthAppleTeamId === "string") {
    ops.push(
      upsert(PLATFORM_KEYS.OAUTH_APPLE_TEAM_ID, body.oauthAppleTeamId.trim()),
    );
  }
  if (typeof body.oauthAppleKeyId === "string") {
    ops.push(
      upsert(PLATFORM_KEYS.OAUTH_APPLE_KEY_ID, body.oauthAppleKeyId.trim()),
    );
  }
  if (body.clearOauthAppleClientSecret === true) {
    ops.push(delKey(PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET));
  } else if (
    typeof body.oauthAppleClientSecret === "string" &&
    body.oauthAppleClientSecret.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_APPLE_CLIENT_SECRET,
        body.oauthAppleClientSecret.trim(),
      ),
    );
  }
  if (body.clearOauthApplePrivateKey === true) {
    ops.push(delKey(PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY));
  } else if (
    typeof body.oauthApplePrivateKey === "string" &&
    body.oauthApplePrivateKey.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_APPLE_PRIVATE_KEY,
        body.oauthApplePrivateKey.trim(),
      ),
    );
  }

  if (typeof body.oauthMicrosoftEnabled === "boolean") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_MICROSOFT_ENABLED,
        body.oauthMicrosoftEnabled ? "true" : "false",
      ),
    );
  }
  if (typeof body.oauthMicrosoftClientId === "string") {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_ID,
        body.oauthMicrosoftClientId.trim(),
      ),
    );
  }
  if (body.clearOauthMicrosoftClientSecret === true) {
    ops.push(delKey(PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET));
  } else if (
    typeof body.oauthMicrosoftClientSecret === "string" &&
    body.oauthMicrosoftClientSecret.trim().length > 0
  ) {
    ops.push(
      upsert(
        PLATFORM_KEYS.OAUTH_MICROSOFT_CLIENT_SECRET,
        body.oauthMicrosoftClientSecret.trim(),
      ),
    );
  }
  if (typeof body.oauthMicrosoftIssuer === "string") {
    const v = body.oauthMicrosoftIssuer.trim();
    if (v.length === 0) {
      ops.push(delKey(PLATFORM_KEYS.OAUTH_MICROSOFT_ISSUER));
    } else {
      ops.push(upsert(PLATFORM_KEYS.OAUTH_MICROSOFT_ISSUER, v));
    }
  }

  if (body.clearBillingProAmount === true) {
    ops.push(delKey(PLATFORM_KEYS.BILLING_PRO_AMOUNT_CENTS));
  } else if (typeof body.billingProMonthlyDollars === "string") {
    const s = body.billingProMonthlyDollars.trim();
    if (s === "") {
      ops.push(delKey(PLATFORM_KEYS.BILLING_PRO_AMOUNT_CENTS));
    } else {
      const n = Number(s);
      if (Number.isFinite(n) && n > 0) {
        ops.push(
          upsert(
            PLATFORM_KEYS.BILLING_PRO_AMOUNT_CENTS,
            String(Math.round(n * 100)),
          ),
        );
      }
    }
  }
  if (typeof body.billingProCurrency === "string") {
    ops.push(
      upsert(
        PLATFORM_KEYS.BILLING_PRO_CURRENCY,
        body.billingProCurrency.trim().toLowerCase() || "usd",
      ),
    );
  }
  if (typeof body.billingProProductName === "string") {
    const v = body.billingProProductName.trim();
    if (v.length === 0) {
      ops.push(delKey(PLATFORM_KEYS.BILLING_PRO_PRODUCT_NAME));
    } else {
      ops.push(upsert(PLATFORM_KEYS.BILLING_PRO_PRODUCT_NAME, v));
    }
  }

  if (body.clearBillingOrgSeatAmount === true) {
    ops.push(delKey(PLATFORM_KEYS.BILLING_ORG_SEAT_AMOUNT_CENTS));
  } else if (typeof body.billingOrgSeatMonthlyDollars === "string") {
    const s = body.billingOrgSeatMonthlyDollars.trim();
    if (s === "") {
      ops.push(delKey(PLATFORM_KEYS.BILLING_ORG_SEAT_AMOUNT_CENTS));
    } else {
      const n = Number(s);
      if (Number.isFinite(n) && n > 0) {
        ops.push(
          upsert(
            PLATFORM_KEYS.BILLING_ORG_SEAT_AMOUNT_CENTS,
            String(Math.round(n * 100)),
          ),
        );
      }
    }
  }
  if (typeof body.billingOrgSeatCurrency === "string") {
    ops.push(
      upsert(
        PLATFORM_KEYS.BILLING_ORG_SEAT_CURRENCY,
        body.billingOrgSeatCurrency.trim().toLowerCase() || "usd",
      ),
    );
  }
  if (typeof body.billingOrgSeatProductName === "string") {
    const v = body.billingOrgSeatProductName.trim();
    if (v.length === 0) {
      ops.push(delKey(PLATFORM_KEYS.BILLING_ORG_SEAT_PRODUCT_NAME));
    } else {
      ops.push(upsert(PLATFORM_KEYS.BILLING_ORG_SEAT_PRODUCT_NAME, v));
    }
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
