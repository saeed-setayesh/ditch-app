import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applyCheckoutSessionCompleted,
  syncStripeSubscription,
} from "@/lib/billing/stripeSync";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getResolvedWebhookSecret } from "@/lib/platformSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await stripeConfigured())) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const secret = await getResolvedWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook signing secret is not configured (STRIPE_WEBHOOK_SECRET or admin platform settings)." },
      { status: 503 },
    );
  }

  const stripe = await getStripe();
  let event: Stripe.Event;
  try {
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await applyCheckoutSessionCompleted(session);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
