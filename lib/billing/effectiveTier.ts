import { prisma } from "@/lib/db";

export type PaidTier = "free" | "pro";

/** Whether this deployment allows dev-only overrides of tier (DATABASE_URL presence does not imply dev). */
function devTierOverrideEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_MANUAL_PRO_TIER === "true"
  );
}

/**
 * Single source for Pro access: Stripe B2C subscription, legacy/dev User.tier,
 * or active organization seat subscription.
 */
export async function resolveEffectiveTier(userId: string): Promise<PaidTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      stripeSubscriptionStatus: true,
    },
  });

  if (!user) return "free";

  const stripe = user.stripeSubscriptionStatus ?? "";
  if (stripe === "active" || stripe === "trialing") return "pro";

  if (
    devTierOverrideEnabled() &&
    (user.tier === "pro" || user.tier === "PRO")
  ) {
    return "pro";
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      seatActive: true,
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  });

  const sub = membership?.organization?.subscription;
  if (
    membership &&
    sub &&
    (sub.status === "active" || sub.status === "trialing")
  ) {
    return "pro";
  }

  return "free";
}
