import { haversineKm } from "@/lib/geo";
import { getCamerasByCity } from "@/lib/cameras";

const RADIUS_KM_INITIAL = 0.5; // 500 m
const RADIUS_KM_EXPANDED = 3; // 3 km (highways; Ontario 511 cameras can be spaced)
const MAX_CAMERAS = 3;

const MAJOR_ROAD_KEYWORDS = [
  "highway",
  "401",
  "404",
  "427",
  "dvp",
  "don valley",
  "gardiner",
  "qew",
  "expressway",
];

export type CameraCandidate = {
  id: string;
  externalId: string;
  lat: number;
  lng: number;
  name: string;
  roadName: string | null;
  intersection: string | null;
  imageUrl: string;
  city: string;
  distanceKm: number;
  sameRoad: boolean;
  majorRoad: boolean;
};

function normalizeRoad(s: string | null | undefined): string {
  if (!s || typeof s !== "string") return "";
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function roadMatches(incidentRoad: string, cameraRoad: string | null): boolean {
  if (!cameraRoad) return false;
  const a = normalizeRoad(incidentRoad);
  const b = normalizeRoad(cameraRoad);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || a === b;
}

function isMajorRoad(roadName: string | null): boolean {
  if (!roadName) return false;
  const r = normalizeRoad(roadName);
  return MAJOR_ROAD_KEYWORDS.some((kw) => r.includes(kw));
}

export async function findNearbyCameras(
  incidentLat: number,
  incidentLng: number,
  roadFrom?: string | null,
  roadTo?: string | null,
  city: string = "DitchApp",
): Promise<{ primary: CameraCandidate; fallbacks: CameraCandidate[] } | null> {
  const cameras = await getCamerasByCity(city);
  if (cameras.length === 0) return null;

  const incidentRoads = [roadFrom, roadTo].filter(Boolean) as string[];

  const withDistance: CameraCandidate[] = cameras.map((c) => {
    const distanceKm = haversineKm(incidentLat, incidentLng, c.lat, c.lng);
    const sameRoad = incidentRoads.some((r) => roadMatches(r, c.roadName));
    const majorRoad = isMajorRoad(c.roadName);
    return {
      id: c.id,
      externalId: c.externalId,
      lat: c.lat,
      lng: c.lng,
      name: c.name,
      roadName: c.roadName,
      intersection: c.intersection,
      imageUrl: c.imageUrl,
      city: c.city,
      distanceKm,
      sameRoad,
      majorRoad,
    };
  });

  // Try initial radius, then expanded
  let inRadius = withDistance.filter((c) => c.distanceKm <= RADIUS_KM_INITIAL);
  if (inRadius.length === 0) {
    inRadius = withDistance.filter((c) => c.distanceKm <= RADIUS_KM_EXPANDED);
  }
  if (inRadius.length === 0) return null;

  // Rank: same road first, then major road, then by distance
  inRadius.sort((a, b) => {
    if (a.sameRoad !== b.sameRoad) return a.sameRoad ? -1 : 1;
    if (a.majorRoad !== b.majorRoad) return a.majorRoad ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });

  const result = inRadius.slice(0, MAX_CAMERAS);
  const primary = result[0];
  const fallbacks = result.slice(1);
  return { primary, fallbacks };
}
