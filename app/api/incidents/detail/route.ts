import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchIncidentDetails, normalizeIncidents } from "@/lib/tomtom";
import { fetchOntario511Incidents } from "@/lib/ontario511";
import { getCityById, getDefaultCity } from "@/lib/cities";
import { haversineKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get("source") ?? "tomtom") as "tomtom" | "511on";
  const latS = searchParams.get("lat");
  const lngS = searchParams.get("lng");
  const cityParam = searchParams.get("city");
  const city = cityParam ? getCityById(cityParam) : getDefaultCity();
  const bbox = city?.bbox ?? getDefaultCity().bbox;

  try {
    if (source === "tomtom") {
      const { incidents } = await fetchIncidentDetails(bbox);
      const normalized = normalizeIncidents(incidents);
      if (latS && lngS) {
        const lat = Number(latS);
        const lng = Number(lngS);
        let best = null;
        let bestDist = Infinity;
        for (const inc of normalized) {
          const d = haversineKm(lat, lng, inc.coordinates[1], inc.coordinates[0]);
          if (d < bestDist) {
            bestDist = d;
            best = inc;
          }
        }
        return NextResponse.json({ source: "tomtom", distanceKm: bestDist, incident: best });
      }
      return NextResponse.json({ source: "tomtom", count: normalized.length });
    } else {
      // 511on
      const list = await fetchOntario511Incidents(bbox);
      if (latS && lngS) {
        const lat = Number(latS);
        const lng = Number(lngS);
        let best = null;
        let bestDist = Infinity;
        for (const it of list) {
          const d = haversineKm(lat, lng, Number(it.Latitude), Number(it.Longitude));
          if (d < bestDist) {
            bestDist = d;
            best = it;
          }
        }
        return NextResponse.json({ source: "511on", distanceKm: bestDist, incident: best });
      }
      return NextResponse.json({ source: "511on", count: list.length });
    }
  } catch (e) {
    console.error("Incident detail error:", e);
    return NextResponse.json({ error: "Failed to fetch incident detail" }, { status: 500 });
  }
}

