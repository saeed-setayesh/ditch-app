import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  billingOrigin,
  getStripe,
  stripeConfigured,
} from "@/lib/stripe";
import {
  resolveOrgSeatSubscriptionLineItem,
  resolveProSubscriptionLineItem,
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
      const line = await resolveProSubscriptionLineItem();
      if (!line) {
        return NextResponse.json(
          {
            error:
              "Pro billing is not configured: set a Stripe Price ID or monthly amount in Admin → Platform settings.",
          },
          { status: 503 },
        );
      }
      const lineItem =
        line.mode === "price"
          ? { price: line.price, quantity: 1 }
          : { price_data: line.price_data, quantity: 1 };
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
        line_items: [lineItem],
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

      const seatLine = await resolveOrgSeatSubscriptionLineItem();
      if (!seatLine) {
        return NextResponse.json(
          {
            error:
              "Fleet seat billing is not configured: set a Stripe Price ID or monthly amount per seat in Admin → Platform settings.",
          },
          { status: 503 },
        );
      }
      const seatLineItem =
        seatLine.mode === "price"
          ? { price: seatLine.price, quantity: seatQty }
          : { price_data: seatLine.price_data, quantity: seatQty };

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
        line_items: [seatLineItem],
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
