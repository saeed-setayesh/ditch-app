/**
 * Grant Pro-tier access without Stripe checkout (comps / QA).
 * Sets stripeSubscriptionStatus to "active", which resolveEffectiveTier() treats as Pro.
 *
 * Requires DATABASE_URL in env (same as prisma). Run from repo root:
 *   node scripts/grant-pro.mjs user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const raw = process.argv[2];
if (!raw?.trim()) {
  console.error("Usage: node scripts/grant-pro.mjs <email>");
  process.exit(1);
}

try {
  const user = await prisma.user.findFirst({
    where: { email: { equals: raw.trim(), mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      tier: true,
      stripeSubscriptionStatus: true,
    },
  });

  if (!user) {
    console.error("No user found for email:", raw.trim());
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionStatus: "active",
      tier: "pro",
    },
  });

  console.log(`Granted Pro for ${user.email} (was tier=${user.tier}, stripeStatus=${user.stripeSubscriptionStatus ?? "null"})`);
  console.log(
    "User may need to sign out and sign in again (or refresh the session) so the JWT picks up tier=pro.",
  );
} finally {
  await prisma.$disconnect();
}
