import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";

const VALID_ICON_CATEGORIES = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14,
]);
const MAX_RADIUS_FREE = 5;
const MAX_RADIUS_PRO = 20;

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      endpoint,
      deviceId,
      radiusKm,
      incidentTypeFilter,
      severityMin,
      quietHoursStart,
      quietHoursEnd,
      cityId,
      minTowScore,
    } = body as {
      endpoint?: string;
      deviceId?: string;
      radiusKm?: number;
      incidentTypeFilter?: string | number[];
      severityMin?: number;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      cityId?: string | null;
      minTowScore?: number | null;
    };

    const userId = await getSessionUserId();

    if (!endpoint && !deviceId && !userId) {
      return NextResponse.json(
        { error: "Either endpoint, deviceId, or auth session required" },
        { status: 400 },
      );
    }

    const where = endpoint
      ? { endpoint }
      : userId
        ? { userId }
        : { deviceId: deviceId ?? "" };

    const existing = await prisma.pushSubscription.findFirst({
      where,
      select: { tier: true, endpoint: true },
    });

    const subscriptionTier: "free" | "pro" = userId
      ? await resolveEffectiveTier(userId)
      : "free";
    const maxRadius =
      subscriptionTier === "pro" ? MAX_RADIUS_PRO : MAX_RADIUS_FREE;

    const update: Record<string, unknown> = {
      tier: subscriptionTier,
    };

    if (typeof radiusKm === "number" && radiusKm > 0)
      update.radiusKm = Math.min(radiusKm, maxRadius);
    if (severityMin !== undefined) {
      if (severityMin == null) update.severityMin = null;
      else if (
        Number.isInteger(severityMin) &&
        severityMin >= 0 &&
        severityMin <= 4
      )
        update.severityMin = severityMin;
    }
    if (quietHoursStart !== undefined)
      update.quietHoursStart = quietHoursStart ?? null;
    if (quietHoursEnd !== undefined)
      update.quietHoursEnd = quietHoursEnd ?? null;
    if (cityId !== undefined) update.cityId = cityId ?? null;
    if (minTowScore !== undefined) {
      if (minTowScore == null) update.minTowScore = null;
      else if (
        subscriptionTier === "pro" &&
        Number.isInteger(minTowScore) &&
        minTowScore >= 0 &&
        minTowScore <= 100
      )
        update.minTowScore = minTowScore;
      else if (subscriptionTier === "free") update.minTowScore = null;
    }
    if (incidentTypeFilter === undefined && body.incidentSources !== undefined) {
      // noop
    }
    if (body.incidentSources !== undefined) {
      let srcs: string[] = [];
      if (Array.isArray(body.incidentSources)) {
        srcs = body.incidentSources
          .map((s: unknown) => String(s).trim().toLowerCase())
          .filter(Boolean);
      } else if (typeof body.incidentSources === "string") {
        srcs = body.incidentSources
          .split(",")
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
      }
      const allowed = new Set(["tomtom", "511on"]);
      const valid = srcs.filter((s) => allowed.has(s));
      update.incidentSources = valid.length > 0 ? valid.join(",") : null;
    }
    if (incidentTypeFilter !== undefined) {
      if (
        incidentTypeFilter == null ||
        (Array.isArray(incidentTypeFilter) && incidentTypeFilter.length === 0)
      ) {
        update.incidentTypeFilter = null;
      } else if (Array.isArray(incidentTypeFilter)) {
        const valid = incidentTypeFilter
          .filter((x) => typeof x === "number" && VALID_ICON_CATEGORIES.has(x))
          .map(String);
        update.incidentTypeFilter =
          valid.length > 0 ? valid.join(",") : null;
      } else if (typeof incidentTypeFilter === "string") {
        const nums = incidentTypeFilter
          .split(",")
          .map((s) => parseInt(s.trim(), 10));
        const valid = nums.filter(
          (n) => !Number.isNaN(n) && VALID_ICON_CATEGORIES.has(n),
        );
        update.incidentTypeFilter =
          valid.length > 0 ? valid.join(",") : null;
      }
    }

    if (existing) {
      const updated = await prisma.pushSubscription.updateMany({
        where,
        data: update,
      });
      if (updated.count === 0) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true });
    }

    const identifier = deviceId || userId;
    if (!identifier) {
      return NextResponse.json(
        {
          error:
            "Subscription not found. Use deviceId or sign in to save preferences before enabling notifications.",
        },
        { status: 404 },
      );
    }
    const prefEndpoint = `preferences:${identifier}`;
    await prisma.pushSubscription.upsert({
      where: { endpoint: prefEndpoint },
      create: {
        endpoint: prefEndpoint,
        p256dh: "preferences-only",
        auth: "preferences-only",
        deviceId: deviceId ?? null,
        userId: userId ?? null,
        ...(typeof update.radiusKm === "number" && {
          radiusKm: update.radiusKm as number,
        }),
        ...(update.severityMin !== undefined && {
          severityMin: update.severityMin as number | null,
        }),
        ...(update.quietHoursStart !== undefined && {
          quietHoursStart: update.quietHoursStart as string | null,
        }),
        ...(update.quietHoursEnd !== undefined && {
          quietHoursEnd: update.quietHoursEnd as string | null,
        }),
        ...(update.cityId !== undefined && {
          cityId: update.cityId as string | null,
        }),
        ...(update.tier !== undefined && { tier: update.tier as string }),
        ...(update.minTowScore !== undefined && {
          minTowScore: update.minTowScore as number | null,
        }),
        ...(update.incidentTypeFilter !== undefined && {
          incidentTypeFilter: update.incidentTypeFilter as string | null,
        }),
        ...(update.incidentSources !== undefined && {
          incidentSources: update.incidentSources as string | null,
        }),
      },
      update: update as Record<string, unknown>,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push preferences error:", e);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
