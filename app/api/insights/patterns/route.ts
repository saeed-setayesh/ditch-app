import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CITIES, getCityById } from "@/lib/cities";
import { fetchIncidentDetails, normalizeIncidents } from "@/lib/tomtom";
import { getSessionUserIdAndTier } from "@/lib/session";

export const dynamic = "force-dynamic";

const PERIOD_MS: Record<string, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

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
  const period = searchParams.get("period") ?? "week";
  const deviceId = searchParams.get("deviceId");
  const source = (searchParams.get("source") ?? "platform") as "platform" | "live";

  const city = getCityConfig(cityParam);
  const cityName = city.name;

  const periodMs = PERIOD_MS[period] ?? PERIOD_MS.week;
  const toDate = new Date();
  const fromDate = new Date(toDate.getTime() - periodMs);

  if (source === "live") {
    try {
      const { incidents } = await fetchIncidentDetails(city.bbox);
      const normalized = normalizeIncidents(incidents);
      const hour = toDate.getHours();
      const byHour: { hour: number; count: number }[] = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        count: h === hour ? normalized.length : 0,
      }));
      const gridPrecision = 3;
      const hotAreas: Record<string, number> = {};
      for (const inc of normalized) {
        const [lng, lat] = inc.coordinates;
        const cell = `${lat.toFixed(gridPrecision)},${lng.toFixed(gridPrecision)}`;
        hotAreas[cell] = (hotAreas[cell] ?? 0) + 1;
      }
      const hotAreasList = Object.entries(hotAreas)
        .map(([cell, count]) => {
          const [lat, lng] = cell.split(",").map(Number);
          return { lat, lng, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      return NextResponse.json({
        city: cityName,
        period: "live",
        source: "live",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        totalIncidents: normalized.length,
        byHour,
        peakHours: [{ hour, count: normalized.length }],
        hotAreas: hotAreasList,
      });
    } catch (e) {
      console.error("Insights patterns (live) error:", e);
      return NextResponse.json({ error: "Failed to fetch live patterns" }, { status: 500 });
    }
  }

  const { tier } = await getSessionUserIdAndTier(deviceId);
  if (tier !== "pro") {
    return NextResponse.json(
      { error: "Patterns & insights are a Pro feature. Upgrade to unlock.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  try {
    const snapshots = await prisma.incidentSnapshot.findMany({
      where: {
        city: cityName,
        fetchedAt: { gte: fromDate, lte: toDate },
      },
      select: { lat: true, lng: true, fetchedAt: true },
    });

    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    const gridPrecision = 3;
    const hotAreas: Record<string, number> = {};

    for (const s of snapshots) {
      const hour = new Date(s.fetchedAt).getHours();
      byHour[hour] = (byHour[hour] ?? 0) + 1;
      const cell = `${s.lat.toFixed(gridPrecision)},${s.lng.toFixed(gridPrecision)}`;
      hotAreas[cell] = (hotAreas[cell] ?? 0) + 1;
    }

    const peakHours = Object.entries(byHour)
      .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const hotAreasList = Object.entries(hotAreas)
      .map(([cell, count]) => {
        const [lat, lng] = cell.split(",").map(Number);
        return { lat, lng, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({
      city: cityName,
      period,
      source: "platform",
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      totalIncidents: snapshots.length,
      byHour: Object.entries(byHour).map(([hour, count]) => ({ hour: parseInt(hour, 10), count })),
      peakHours,
      hotAreas: hotAreasList,
    });
  } catch (e) {
    console.error("Insights patterns error:", e);
    return NextResponse.json({ error: "Failed to fetch patterns" }, { status: 500 });
  }
}
