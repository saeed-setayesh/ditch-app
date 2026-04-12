import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get("deviceId");

  // Try session first
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {}

  try {
    let sub = null;

    // Prefer userId lookup
    if (userId) {
      sub = await prisma.pushSubscription.findFirst({
        where: { userId },
        select: { tier: true, radiusKm: true, incidentSources: true },
      });
    }

    // Fallback to deviceId
    if (!sub && deviceId) {
      sub = await prisma.pushSubscription.findFirst({
        where: { deviceId },
        select: { tier: true, radiusKm: true, incidentSources: true },
      });
    }

    // Also check user's tier from User model
    let userTier = "free";
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      });
      if (user) userTier = user.tier;
    }

    const tier = userTier === "pro" ? "pro" : (sub?.tier ?? "free");

    return NextResponse.json({
      tier,
      radiusKm: sub?.radiusKm ?? 2,
      incidentSources: sub?.incidentSources ?? "tomtom,511on",
      userId,
    });
  } catch {
    return NextResponse.json({ tier: "free" });
  }
}
