import { NextRequest, NextResponse } from "next/server";
import { findNearbyCameras } from "@/lib/camera-matching";

export const dynamic = "force-dynamic";

function parseCoord(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const roadFrom = searchParams.get("roadFrom") ?? undefined;
  const roadTo = searchParams.get("roadTo") ?? undefined;
  const city = searchParams.get("city") ?? "DitchApp";

  const lat = parseCoord(latParam ?? "");
  const lng = parseCoord(lngParam ?? "");
  if (
    lat == null ||
    lng == null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { error: "Invalid lat or lng (required, numeric, valid range)" },
      { status: 400 },
    );
  }

  try {
    const result = await findNearbyCameras(lat, lng, roadFrom, roadTo, city);
    if (!result) {
      return NextResponse.json({ cameras: [], primary: null, fallbacks: [] });
    }
    const { primary, fallbacks } = result;
    const cameras = [primary, ...fallbacks];
    return NextResponse.json({
      primary: {
        id: primary.id,
        externalId: primary.externalId,
        lat: primary.lat,
        lng: primary.lng,
        name: primary.name,
        roadName: primary.roadName,
        intersection: primary.intersection,
        imageUrl: primary.imageUrl,
        city: primary.city,
        distanceKm: Math.round(primary.distanceKm * 1000) / 1000,
      },
      fallbacks: fallbacks.map((c) => ({
        id: c.id,
        externalId: c.externalId,
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        roadName: c.roadName,
        intersection: c.intersection,
        imageUrl: c.imageUrl,
        city: c.city,
        distanceKm: Math.round(c.distanceKm * 1000) / 1000,
      })),
      cameras: cameras.map((c) => ({
        id: c.id,
        externalId: c.externalId,
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        roadName: c.roadName,
        intersection: c.intersection,
        imageUrl: c.imageUrl,
        city: c.city,
        distanceKm: Math.round(c.distanceKm * 1000) / 1000,
      })),
    });
  } catch (e) {
    console.error("Cameras nearby error:", e);
    return NextResponse.json(
      { error: "Failed to find nearby cameras" },
      { status: 500 },
    );
  }
}
