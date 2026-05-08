import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ authenticated: false, tier: "free" }, { status: 200 });
  }

  const [tier, user, membership] = await Promise.all([
    resolveEffectiveTier(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    }),
    prisma.organizationMember.findFirst({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            stripeCustomerId: true,
            subscription: {
              select: {
                seatQuantity: true,
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let orgAdminStripe = false;
  if (membership?.role === "admin" && membership.organization.stripeCustomerId) {
    orgAdminStripe = true;
  }

  return NextResponse.json({
    authenticated: true,
    tier,
    stripeCustomer: Boolean(user?.stripeCustomerId),
    portalUser: Boolean(user?.stripeCustomerId),
    organization: membership
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          role: membership.role,
          seatActive: membership.seatActive,
          subscription: membership.organization.subscription,
          portalOrganization: orgAdminStripe,
        }
      : null,
  });
}
