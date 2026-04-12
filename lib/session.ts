import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Get the current session user ID and tier from Auth.js JWT.
 * Falls back to deviceId-based lookup for backward compatibility.
 */
export async function getSessionUserIdAndTier(
  deviceId?: string | null
): Promise<{ userId: string | null; tier: string }> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const tier = (session.user as any).tier ?? "free";
      return { userId: session.user.id, tier };
    }
  } catch {
    // ignore – caller may be API route without session
  }

  // Fallback: lookup via deviceId
  if (deviceId) {
    const sub = await prisma.pushSubscription.findFirst({
      where: { deviceId },
      select: { tier: true, userId: true },
    });
    return { userId: sub?.userId ?? null, tier: sub?.tier ?? "free" };
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
