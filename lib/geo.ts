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
