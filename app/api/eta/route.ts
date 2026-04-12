import { NextRequest, NextResponse } from "next/server";
import { getRouteEta } from "@/lib/routing";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

function parseCoord(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Missing from or to (format: lat,lng)" },
      { status: 400 }
    );
  }
  const [fromLatS, fromLngS] = fromParam.split(",").map((x) => x.trim());
  const [toLatS, toLngS] = toParam.split(",").map((x) => x.trim());
  const fromLat = parseCoord(fromLatS);
  const fromLng = parseCoord(fromLngS);
  const toLat = parseCoord(toLatS);
  const toLng = parseCoord(toLngS);
  if (
    fromLat == null ||
    fromLng == null ||
    toLat == null ||
    toLng == null ||
    fromLat < LAT_MIN ||
    fromLat > LAT_MAX ||
    fromLng < LNG_MIN ||
    fromLng > LNG_MAX ||
    toLat < LAT_MIN ||
    toLat > LAT_MAX ||
    toLng < LNG_MIN ||
    toLng > LNG_MAX
  ) {
    return NextResponse.json(
      { error: "Invalid coordinates (lat -90..90, lng -180..180)" },
      { status: 400 }
    );
  }
  const origin: [number, number] = [fromLat, fromLng];
  const destination: [number, number] = [toLat, toLng];
  const result = await getRouteEta(origin, destination);
  if (result == null) {
    return NextResponse.json(
      { error: "Route not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(result);
}
