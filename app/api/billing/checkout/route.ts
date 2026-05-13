import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  billingOrigin,
  getStripe,
  stripeConfigured,
} from "@/lib/stripe";
import {
  getResolvedPriceOrgSeatMonthly,
  getResolvedPriceProMonthly,
} from "@/lib/platformSettings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await stripeConfigured())) {
    return NextResponse.json(
      { error: "Billing is not configured (missing STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    mode,
    organizationId,
    quantity,
  } = body as {
    mode?: "pro" | "org_seats";
    organizationId?: string;
    quantity?: number;
  };

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      stripeCustomerId: true,
      name: true,
    },
  });
  if (!user?.email) {
    return NextResponse.json(
      { error: "User email required for Checkout" },
      { status: 400 },
    );
  }

  const stripe = await getStripe();
  const base = billingOrigin();

  const successUrl = `${base}/dashboard?checkout=success`;
  const cancelUrl = `${base}/dashboard?checkout=cancel`;

  try {
    if (mode === "pro") {
      const price = await getResolvedPriceProMonthly();
      if (!price) {
        return NextResponse.json(
          {
            error:
              "Missing STRIPE_PRICE_PRO_MONTHLY (or STRIPE_PRICE_PRO) env var or admin platform setting.",
          },
          { status: 503 },
        );
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: user.stripeCustomerId ?? undefined,
        customer_email: user.stripeCustomerId ? undefined : user.email,
        client_reference_id: userId,
        metadata: {
          userId,
          kind: "b2c_pro",
        },
        subscription_data: {
          metadata: {
            userId,
            kind: "b2c_pro",
          },
        },
        line_items: [{ price, quantity: 1 }],
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: checkout.url });
    }

    if (mode === "org_seats") {
      if (!organizationId) {
        return NextResponse.json(
          { error: "organizationId is required" },
          { status: 400 },
        );
      }
      const seatQty =
        typeof quantity === "number" && quantity >= 1 && quantity <= 500
          ? Math.floor(quantity)
          : 1;

      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          role: "admin",
        },
        include: {
          organization: { select: { stripeCustomerId: true, name: true } },
        },
      });
      if (!member) {
        return NextResponse.json(
          { error: "Forbidden — admin only" },
          { status: 403 },
        );
      }

      const priceSeat = await getResolvedPriceOrgSeatMonthly();
      if (!priceSeat) {
        return NextResponse.json(
          {
            error:
              "Missing STRIPE_PRICE_ORG_SEAT_MONTHLY (or STRIPE_PRICE_SEAT) env var or admin platform setting.",
          },
          { status: 503 },
        );
      }

      let customerId = member.organization.stripeCustomerId;
      if (!customerId) {
        const c = await stripe.customers.create({
          email: user.email,
          name: member.organization.name,
          metadata: { organizationId },
        });
        customerId = c.id;
        await prisma.organization.update({
          where: { id: organizationId },
          data: { stripeCustomerId: customerId },
        });
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        metadata: {
          userId,
          kind: "org_seats",
          organizationId,
        },
        subscription_data: {
          metadata: {
            userId,
            kind: "org_seats",
            organizationId,
          },
        },
        line_items: [{ price: priceSeat, quantity: seatQty }],
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    return NextResponse.json(
      { error: "Unsupported mode — use \"pro\" or \"org_seats\"." },
      { status: 400 },
    );
  } catch (e) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: "Failed to create Checkout session." },
      { status: 500 },
    );
  }
}
