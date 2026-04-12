function getApiKey(): string {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY is not set");
  return key;
}

/**
 * TomTom Routing API: traffic-aware ETA from origin to destination.
 * Origin/destination: [lat, lng] (latitude, longitude).
 * Returns travelTimeInSeconds or null on error.
 */
export async function getRouteEta(
  origin: [number, number],
  destination: [number, number]
): Promise<{ travelTimeInSeconds: number } | null> {
  const key = getApiKey();
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;
  // TomTom format: lat,lng:lat,lng (origin:destination)
  const path = `${origLat},${origLng}:${destLat},${destLng}`;
  const params = new URLSearchParams({
    key,
    traffic: "true",
    travelMode: "car",
  });
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${path}/json?${params.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{ summary?: { travelTimeInSeconds?: number } }>;
    };
    const seconds = data.routes?.[0]?.summary?.travelTimeInSeconds;
    if (seconds == null) return null;
    return { travelTimeInSeconds: seconds };
  } catch {
    return null;
  }
}
