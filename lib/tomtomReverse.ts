/** Server-side reverse geocode (TomTom Search API). Do not expose the key client-side. */

const mem = new Map<string, { at: number; line: string }>();
const TTL_MS = 6 * 60 * 60 * 1000;

function tomTomKey(): string | null {
  return (
    process.env.TOMTOM_API_KEY ||
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY ||
    null
  );
}

export async function reverseGeocodeLine(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = mem.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.line;

  const apiKey = tomTomKey();
  if (!apiKey) return null;

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat}%2C${lng}.json?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    addresses?: { address?: { freeformAddress?: string; streetNumber?: string; streetName?: string; municipality?: string } }[];
  };

  const addr = data.addresses?.[0]?.address;
  if (!addr) return null;
  const line =
    addr.freeformAddress ||
    [addr.streetNumber, addr.streetName, addr.municipality]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (line) {
    mem.set(key, { at: Date.now(), line });
    return line;
  }
  return null;
}
