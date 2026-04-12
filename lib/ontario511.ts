/**
 * Ontario 511 traffic cameras API.
 * Live data: https://511on.ca/api/v2/get/cameras
 * Docs: https://511on.ca/help/endpoint/cameras
 */

const ONTARIO_511_CAMERAS_URL =
  "https://511on.ca/api/v2/get/cameras?format=json";

/** Ontario 511 API camera view (one image/angle per camera). */
export type Ontario511View = {
  Id: number;
  Url: string;
  Status?: string;
  Description?: string;
};

/** Ontario 511 API camera record. */
export type Ontario511Camera = {
  Id: number;
  Source?: string;
  SourceId?: string;
  Roadway?: string;
  Direction?: string;
  Latitude: number;
  Longitude: number;
  Location?: string;
  SortOrder?: number;
  Views?: Ontario511View[];
};

export type CameraInput = {
  externalId: string;
  lat: number;
  lng: number;
  name: string;
  roadName?: string | null;
  intersection?: string | null;
  imageUrl: string;
  city?: string;
};

/** DitchApp area (approximate) for filtering Ontario 511 cameras. */
const DitchApp_LAT_MIN = 43.58;
const DitchApp_LAT_MAX = 43.85;
const DitchApp_LNG_MIN = -79.65;
const DitchApp_LNG_MAX = -79.1;

function inDitchAppBox(lat: number, lng: number): boolean {
  return (
    lat >= DitchApp_LAT_MIN &&
    lat <= DitchApp_LAT_MAX &&
    lng >= DitchApp_LNG_MIN &&
    lng <= DitchApp_LNG_MAX
  );
}

/**
 * Ontario 511 does not expose direct image URLs; View.Url is the map/camera page (e.g. https://511on.ca/map/Cctv/436).
 * We store that URL for embedding in an iframe or opening in a new tab.
 */
function imageUrlForView(_viewId: number, pageUrl: string): string {
  return pageUrl || "";
}

/**
 * Fetch all cameras from Ontario 511 and map to our CameraInput shape.
 * Optionally filter to DitchApp area only.
 */
export async function fetchOntario511Cameras(
  options: { DitchAppOnly?: boolean } = {},
): Promise<CameraInput[]> {
  const res = await fetch(ONTARIO_511_CAMERAS_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Ontario 511 API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const list: Ontario511Camera[] = Array.isArray(data) ? data : [];
  const DitchAppOnly = options.DitchAppOnly !== false;

  const out: CameraInput[] = [];
  for (const c of list) {
    const lat = Number(c.Latitude);
    const lng = Number(c.Longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (DitchAppOnly && !inDitchAppBox(lat, lng)) continue;

    const views = c.Views?.filter((v) => v.Status === "Enabled") ?? [];
    const firstView = views[0];
    const viewId = firstView?.Id;
    const pageUrl = firstView?.Url ?? "";
    const imageUrl = pageUrl
      ? imageUrlForView(viewId ?? 0, pageUrl)
      : `https://511on.ca/map/Cctv/${c.Id}`;

    const name = c.Location?.trim() || c.Roadway || `Camera ${c.Id}`;
    const roadName = c.Roadway?.trim() || null;
    const externalId = `511on-${c.Id}-${c.SourceId ?? c.Id}`;

    out.push({
      externalId,
      lat,
      lng,
      name,
      roadName,
      intersection: null,
      imageUrl,
      city: "DitchApp",
    });
  }
  return out;
}

/** Fetch incidents from Ontario 511 API and normalize to a simple incident shape. */
export type Ontario511Incident = {
  Id: number;
  ID?: number;
  Source?: string;
  SourceId?: string;
  Roadway?: string;
  Direction?: string;
  Latitude?: number;
  Longitude?: number;
  Location?: string;
  Updated?: string;
  Description?: string;
  EventType?: string;
  StartDate?: string;
  LastUpdated?: string;
};

export async function fetchOntario511Incidents(
  bbox?: string,
): Promise<Ontario511Incident[]> {
  // Ontario 511 exposes an Events endpoint at /api/v2/get/event
  const url = new URL("https://511on.ca/api/v2/get/event?format=json");
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Ontario 511 incidents fetch failed: ${res.status}`);
  }
  const list = await res.json().catch(() => []);
  if (!Array.isArray(list)) return [];
  const out: Ontario511Incident[] = [];
  for (const it of list) {
    // Try common field names for coordinates
    const lat = Number(
      it?.Latitude ??
        it?.latitude ??
        it?.Location?.Latitude ??
        it?.lat ??
        it?.location?.lat,
    );
    const lng = Number(
      it?.Longitude ??
        it?.longitude ??
        it?.Location?.Longitude ??
        it?.lng ??
        it?.location?.lng,
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (bbox) {
      // bbox is minLon,minLat,maxLon,maxLat
      const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
      if (lng < minLon || lng > maxLon || lat < minLat || lat > maxLat)
        continue;
    }
    out.push({
      Id: Number(it.Id ?? 0),
      Source: it.Source,
      SourceId: it.SourceId,
      Roadway: it.Roadway,
      Direction: it.Direction,
      Latitude: lat,
      Longitude: lng,
      Location: it.Location,
      Updated: it.Updated ?? null,
      Description: it.Description ?? null,
    });
  }
  return out;
}
