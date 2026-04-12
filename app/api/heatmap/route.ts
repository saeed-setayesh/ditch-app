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

  const { tier } = await getSessionUserIdAndTier(deviceId);
  if (tier !== "pro") {
    return NextResponse.json(
      { error: "Heatmap is a Pro feature. Upgrade to unlock.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  try {
    if (source === "live") {
      const { incidents } = await fetchIncidentDetails(city.bbox);
      const normalized = normalizeIncidents(incidents);
      const gridPrecision = 3;
      const cells: Record<string, number> = {};
      for (const inc of normalized) {
        const [lng, lat] = inc.coordinates;
        const key = `${lat.toFixed(gridPrecision)},${lng.toFixed(gridPrecision)}`;
        cells[key] = (cells[key] ?? 0) + 1;
      }
      const points = Object.entries(cells).map(([key, weight]) => {
        const [lat, lng] = key.split(",").map(Number);
        return { lat, lng, weight };
      });
      const geojson = {
        type: "FeatureCollection" as const,
        features: points.map(({ lng, lat, weight }) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
          properties: { weight },
        })),
      };
      return NextResponse.json({
        city: cityName,
        period: "live",
        source: "live",
        from: toDate.toISOString(),
        to: toDate.toISOString(),
        points,
        geojson,
      });
    }

    const snapshots = await prisma.incidentSnapshot.findMany({
      where: {
        city: cityName,
        fetchedAt: { gte: fromDate, lte: toDate },
      },
      select: { lat: true, lng: true },
    });

    const gridPrecision = 3;
    const cells: Record<string, number> = {};
    for (const s of snapshots) {
      const key = `${s.lat.toFixed(gridPrecision)},${s.lng.toFixed(gridPrecision)}`;
      cells[key] = (cells[key] ?? 0) + 1;
    }

    const points = Object.entries(cells).map(([key, weight]) => {
      const [lat, lng] = key.split(",").map(Number);
      return { lat, lng, weight };
    });

    const geojson = {
      type: "FeatureCollection" as const,
      features: points.map(({ lng, lat, weight }) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
        properties: { weight },
      })),
    };

    return NextResponse.json({
      city: cityName,
      period,
      source: "platform",
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      points,
      geojson,
    });
  } catch (e) {
    console.error("Heatmap API error:", e);
    return NextResponse.json({ error: "Failed to fetch heatmap" }, { status: 500 });
  }
}
