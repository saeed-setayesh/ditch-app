import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.organizationMember.findFirst({
    where: { userId },
    include: {
      organization: {
        include: {
          subscription: true,
          members: {
            select: {
              id: true,
              role: true,
              seatActive: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!row) return NextResponse.json({ organization: null });

  const { organization } = row;
  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      role: row.role,
      seatActive: row.seatActive,
      subscription: organization.subscription,
      members: organization.members,
    },
  });
}

/** Create a new organization; caller becomes admin with an active seat. */
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.organizationMember.findFirst({
    where: { userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already belong to an organization. Leave it before creating another." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name } = body as { name?: string };
  const orgName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().slice(0, 120)
      : "My fleet";

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Billing / Stripe must be configured to create fleet organizations." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  try {
    const stripe = getStripe();

    const organization = await prisma.organization.create({
      data: { name: orgName },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: "admin",
        seatActive: true,
      },
    });

    try {
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: orgName,
        metadata: { organizationId: organization.id },
      });

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customer.id },
      });
    } catch (stripeErr) {
      console.error(stripeErr);
      await prisma.organization.delete({ where: { id: organization.id } });
      return NextResponse.json(
        { error: "Could not attach Stripe customer." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      organizationId: organization.id,
    });
  } catch (e) {
    console.error("Organization create error:", e);
    return NextResponse.json(
      { error: "Failed to create organization." },
      { status: 500 },
    );
  }
}
