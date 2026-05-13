import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  billingOrigin,
  getStripe,
  stripeConfigured,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await stripeConfigured())) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { scope } = body as {
    scope?: "user" | "organization";
    organizationId?: string;
  };

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = billingOrigin();
  const stripe = await getStripe();

  try {
    if (!scope || scope === "user") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });
      if (!user?.stripeCustomerId) {
        return NextResponse.json(
          {
            error: "No Stripe customer on file — subscribe from Checkout first.",
          },
          { status: 400 },
        );
      }
      const portal = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${base}/dashboard`,
      });
      return NextResponse.json({ url: portal.url });
    }

    if (scope === "organization") {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, role: "admin" },
        include: {
          organization: { select: { id: true, stripeCustomerId: true } },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "No organization administrator role found." },
          { status: 400 },
        );
      }
      if (!membership.organization.stripeCustomerId) {
        return NextResponse.json(
          { error: "Organization has no billing customer yet — buy seats via Checkout." },
          { status: 400 },
        );
      }
      const portal = await stripe.billingPortal.sessions.create({
        customer: membership.organization.stripeCustomerId,
        return_url: `${base}/company`,
      });
      return NextResponse.json({ url: portal.url });
    }

    return NextResponse.json({ error: "Invalid scope." }, { status: 400 });
  } catch (e) {
    console.error("Portal error:", e);
    return NextResponse.json({ error: "Portal session failed." }, { status: 500 });
  }
}
