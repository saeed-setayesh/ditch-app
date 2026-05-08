import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get("deviceId");

  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    // no session
  }

  try {
    let sub = null;

    if (userId) {
      sub = await prisma.pushSubscription.findFirst({
        where: { userId },
        select: { tier: true, radiusKm: true, incidentSources: true },
      });
    }

    if (!sub && deviceId) {
      sub = await prisma.pushSubscription.findFirst({
        where: { deviceId },
        select: {
          tier: true,
          radiusKm: true,
          incidentSources: true,
          userId: true,
        },
      });
      if (!userId && sub?.userId) userId = sub.userId;
    }

    let tier: "free" | "pro" = "free";
    if (userId) tier = await resolveEffectiveTier(userId);

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
