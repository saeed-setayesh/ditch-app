import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resolveEffectiveTier } from "@/lib/billing/effectiveTier";

const MAX_RADIUS_FREE = 5;
const MAX_RADIUS_PRO = 20;

function validLat(lat: unknown): lat is number {
  return typeof lat === "number" && lat >= -90 && lat <= 90;
}
function validLng(lng: unknown): lng is number {
  return typeof lng === "number" && lng >= -180 && lng <= 180;
}
function maxRadiusForTier(tier: string): number {
  return tier === "pro" ? MAX_RADIUS_PRO : MAX_RADIUS_FREE;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      endpoint,
      keys,
      deviceId,
      lastLat,
      lastLng,
      radiusKm,
      incidentTypeFilter,
      severityMin,
      quietHoursStart,
      quietHoursEnd,
      cityId,
      minTowScore,
    } = body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      deviceId?: string;
      lastLat?: number;
      lastLng?: number;
      radiusKm?: number;
      incidentTypeFilter?: string | number[] | null;
      severityMin?: number | null;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      cityId?: string | null;
      minTowScore?: number | null;
    };

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid endpoint" },
        { status: 400 },
      );
    }
    if (!keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing subscription keys (p256dh, auth)" },
        { status: 400 },
      );
    }

    let savedPrefs: {
      radiusKm?: number;
      incidentTypeFilter?: string | null;
      severityMin?: number | null;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      cityId?: string | null;
      tier?: string;
      minTowScore?: number | null;
    } | null = null;
    if (typeof deviceId === "string" && deviceId.length > 0) {
      const pref = await prisma.pushSubscription.findFirst({
        where: { deviceId, endpoint: { startsWith: "preferences:" } },
        select: {
          radiusKm: true,
          incidentTypeFilter: true,
          severityMin: true,
          quietHoursStart: true,
          quietHoursEnd: true,
          cityId: true,
          tier: true,
          minTowScore: true,
        },
      });
      if (pref) savedPrefs = pref;
    }

    const userId = await getSessionUserId();

    const subscriptionTier: "free" | "pro" = userId
      ? await resolveEffectiveTier(userId)
      : "free";
    const maxRadius = maxRadiusForTier(subscriptionTier);
    const data: Record<string, unknown> = {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      tier: subscriptionTier,
    };
    if (typeof deviceId === "string" && deviceId.length > 0)
      data.deviceId = deviceId;
    if (userId) data.userId = userId;
    const radiusVal =
      typeof radiusKm === "number" && radiusKm > 0
        ? radiusKm
        : savedPrefs?.radiusKm;
    if (typeof radiusVal === "number" && radiusVal > 0)
      data.radiusKm = Math.min(radiusVal, maxRadius);
    if (validLat(lastLat)) data.lastLat = lastLat;
    if (validLng(lastLng)) data.lastLng = lastLng;
    const incidentFilter =
      incidentTypeFilter != null
        ? Array.isArray(incidentTypeFilter)
          ? incidentTypeFilter.join(",")
          : incidentTypeFilter
        : savedPrefs?.incidentTypeFilter;
    if (incidentFilter != null)
      data.incidentTypeFilter =
        typeof incidentFilter === "string" ? incidentFilter : null;
    const severityVal =
      severityMin != null &&
      Number.isInteger(severityMin) &&
      severityMin >= 0 &&
      severityMin <= 4
        ? severityMin
        : savedPrefs?.severityMin;
    if (severityVal != null) data.severityMin = severityVal;
    if (quietHoursStart != null || savedPrefs?.quietHoursStart != null)
      data.quietHoursStart =
        quietHoursStart ?? savedPrefs?.quietHoursStart ?? null;
    if (quietHoursEnd != null || savedPrefs?.quietHoursEnd != null)
      data.quietHoursEnd =
        quietHoursEnd ?? savedPrefs?.quietHoursEnd ?? null;
    if (cityId != null || savedPrefs?.cityId != null)
      data.cityId = cityId ?? savedPrefs?.cityId ?? null;
    const minScoreVal =
      subscriptionTier === "pro" &&
      (minTowScore != null &&
      Number.isInteger(minTowScore) &&
      minTowScore >= 0 &&
      minTowScore <= 100
        ? minTowScore
        : savedPrefs?.minTowScore);
    if (minScoreVal != null) data.minTowScore = minScoreVal;
    else if (subscriptionTier === "free") data.minTowScore = null;

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: data as Parameters<typeof prisma.pushSubscription.upsert>[0]["create"],
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        tier: subscriptionTier,
        ...(data.deviceId != null && { deviceId: data.deviceId }),
        ...(data.lastLat != null && { lastLat: data.lastLat }),
        ...(data.lastLng != null && { lastLng: data.lastLng }),
        ...(data.radiusKm != null && { radiusKm: data.radiusKm }),
        ...(data.incidentTypeFilter !== undefined && {
          incidentTypeFilter: data.incidentTypeFilter,
        }),
        ...(data.severityMin !== undefined && {
          severityMin: data.severityMin,
        }),
        ...(data.quietHoursStart !== undefined && {
          quietHoursStart: data.quietHoursStart,
        }),
        ...(data.quietHoursEnd !== undefined && {
          quietHoursEnd: data.quietHoursEnd,
        }),
        ...(data.cityId !== undefined && { cityId: data.cityId }),
        ...(data.minTowScore !== undefined && {
          minTowScore: data.minTowScore,
        }),
      },
    });

    if (typeof deviceId === "string" && deviceId.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          deviceId,
          endpoint: { startsWith: "preferences:" },
        },
      });
    }

    return NextResponse.json({ success: true, id: sub.id });
  } catch (e) {
    console.error("Push subscribe error:", e);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
