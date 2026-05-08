import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";

/**
 * Get the current session user ID and effective paid tier.
 * Falls back to deviceId-linked user when present; otherwise free.
 */
export async function getSessionUserIdAndTier(
  deviceId?: string | null,
): Promise<{ userId: string | null; tier: string }> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const tier = await resolveEffectiveTier(session.user.id);
      return { userId: session.user.id, tier };
    }
  } catch {
    // ignore – caller may be API route without session
  }

  if (deviceId) {
    const sub = await prisma.pushSubscription.findFirst({
      where: { deviceId },
      select: { userId: true },
    });
    if (sub?.userId) {
      const tier = await resolveEffectiveTier(sub.userId);
      return { userId: sub.userId, tier };
    }
  }

  return { userId: null, tier: "free" };
}

/**
 * Get just the session user ID (or null).
 */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
