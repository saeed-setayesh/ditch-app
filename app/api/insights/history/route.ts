import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CITIES, getCityById } from "@/lib/cities";
import { fetchIncidentDetails, normalizeIncidents } from "@/lib/tomtom";
import { getSessionUserIdAndTier } from "@/lib/session";

export const dynamic = "force-dynamic";

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getCityConfig(cityParam: string | null) {
  if (!cityParam) return CITIES[0];
  const byId = getCityById(cityParam.toLowerCase());
  if (byId) return byId;
  const byName = CITIES.find((c) => c.name === cityParam);
  return byName ?? CITIES[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get("city");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const group = searchParams.get("group"); // "day" = aggregated counts by day
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));
  const deviceId = searchParams.get("deviceId");
  const source = (searchParams.get("source") ?? "platform") as "platform" | "live";

  const city = getCityConfig(cityParam);
  const cityName = city.name;

  const toDateRaw = toParam ? parseDate(toParam) : new Date();
  const toDate = toDateRaw ?? new Date();
  const fromDateRaw = fromParam
    ? parseDate(fromParam)
    : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fromDate = fromDateRaw ?? new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (fromDate > toDate) {
    return NextResponse.json(
      { error: "Invalid date range: use from and to as ISO date strings" },
      { status: 400 }
    );
  }

  if (source === "live") {
    try {
      const { incidents } = await fetchIncidentDetails(city.bbox);
      const normalized = normalizeIncidents(incidents);
      const today = toDate.toISOString().slice(0, 10);
      const byDay = [{ date: today, count: normalized.length }];
      if (group === "day") {
        return NextResponse.json({
          city: cityName,
          source: "live",
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          byDay,
        });
      }
      const now = new Date().toISOString();
      const snapshots = normalized.slice(0, limit).map((inc, i) => {
        const [lng, lat] = inc.coordinates;
        return {
          id: `live-${i}`,
          externalId: inc.id,
          lat,
          lng,
          city: cityName,
          iconCategory: inc.iconCategory,
          magnitudeOfDelay: inc.magnitudeOfDelay ?? null,
          description: inc.description,
          from: inc.from ?? null,
          to: inc.to ?? null,
          startTime: inc.startTime ?? null,
          endTime: inc.endTime ?? null,
          fetchedAt: now,
        };
      });
      return NextResponse.json({
        city: cityName,
        source: "live",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        count: snapshots.length,
        snapshots,
      });
    } catch (e) {
      console.error("Insights history (live) error:", e);
      return NextResponse.json({ error: "Failed to fetch live incidents" }, { status: 500 });
    }
  }

  const { tier } = await getSessionUserIdAndTier(deviceId);
  if (tier !== "pro") {
    return NextResponse.json(
      { error: "Incident history is a Pro feature. Upgrade to unlock.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  try {
    if (group === "day") {
      const snapshots = await prisma.incidentSnapshot.findMany({
        where: {
          city: cityName,
          fetchedAt: { gte: fromDate, lte: toDate },
        },
        select: { fetchedAt: true },
      });
      const byDay: Record<string, number> = {};
      for (const s of snapshots) {
        const key = s.fetchedAt.toISOString().slice(0, 10);
        byDay[key] = (byDay[key] ?? 0) + 1;
      }
      const days = Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return NextResponse.json({ city: cityName, source: "platform", from: fromDate.toISOString(), to: toDate.toISOString(), byDay: days });
    }

    const list = await prisma.incidentSnapshot.findMany({
      where: {
        city: cityName,
        fetchedAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { fetchedAt: "desc" },
      take: limit,
    });

    const items = list.map((s) => ({
      id: s.id,
      externalId: s.externalId,
      lat: s.lat,
      lng: s.lng,
      city: s.city,
      iconCategory: s.iconCategory,
      magnitudeOfDelay: s.magnitudeOfDelay,
      description: s.description,
      from: s.from_,
      to: s.to_,
      startTime: s.startTime?.toISOString() ?? null,
      endTime: s.endTime?.toISOString() ?? null,
      fetchedAt: s.fetchedAt.toISOString(),
    }));

    return NextResponse.json({
      city: cityName,
      source: "platform",
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      count: items.length,
      snapshots: items,
    });
  } catch (e) {
    console.error("Insights history error:", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
