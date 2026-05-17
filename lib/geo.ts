/**
 * Haversine distance in km between two points (lat/lng in degrees).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Max radius (km) sent to TomTom bbox queries — keeps requests bounded. */
export const MAX_INCIDENT_FETCH_RADIUS_KM = 200;

/**
 * TomTom Traffic Incident Details bbox: `minLon,minLat,maxLon,maxLat`.
 * Uses axis-aligned bounds that fully contain a circle of radius `radiusKm`.
 */
export function bboxFromCenterRadiusKm(
  lat: number,
  lng: number,
  radiusKm: number,
): string {
  const r = Math.min(
    Math.max(radiusKm, 1),
    MAX_INCIDENT_FETCH_RADIUS_KM,
  );
  const latDelta = r / 111;
  const cosLat = Math.cos(toRad(lat));
  const lngDelta = cosLat > 0.02 ? r / (111 * cosLat) : latDelta;
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLng = lng - lngDelta;
  const maxLng = lng + lngDelta;
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

/** GeoJSON polygon approximating a circle (for map radius ring). */
export function circlePolygonGeoJson(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  steps = 72,
): {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
} {
  const R = 6371;
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const θ = (i / steps) * 2 * Math.PI;
    const lat =
      centerLat + (radiusKm / R) * (180 / Math.PI) * Math.cos(θ);
    const cosCL = Math.max(0.02, Math.cos(toRad(centerLat)));
    const lng =
      centerLng +
      ((radiusKm / R) * (180 / Math.PI) * Math.sin(θ)) / cosCL;
    ring.push([lng, lat]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

/**
 * For a LineString, use the first coordinate as the "point" for distance.
 * For a Point, use its single coordinate.
 * Returns [lng, lat] or null.
 */
export function incidentCenter(geometry: {
  type: string;
  coordinates: number[] | number[][];
}): [number, number] | null {
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const c = geometry.coordinates as number[];
    if (c.length >= 2) return [c[0], c[1]];
  }
  if (
    geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  ) {
    const first = geometry.coordinates[0];
    if (Array.isArray(first) && first.length >= 2)
      return [first[0], first[1]];
  }
  return null;
}
