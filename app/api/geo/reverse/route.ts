import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeLine } from "@/lib/tomtomReverse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const line = await reverseGeocodeLine(lat, lng);
    if (!line) {
      return NextResponse.json({
        line: null,
        error: "No result or TomTom key missing",
      });
    }
    return NextResponse.json({ line });
  } catch {
    return NextResponse.json(
      { line: null, error: "Geocode failed" },
      { status: 502 },
    );
  }
}
