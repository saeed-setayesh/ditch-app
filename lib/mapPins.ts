/**
 * Round map pins with white glyphs (ditchappmobile / Incidenta-style).
 * Colors and category mapping match IncidentIcons (pure logic, no React import).
 */

type MapPinKind =
  | "accident"
  | "collision"
  | "fire"
  | "hazard"
  | "jam"
  | "medical"
  | "police"
  | "weather"
  | "roadwork"
  | "breakdown"
  | "other";

function pinKindFromCategory(iconCategory: number): MapPinKind {
  switch (iconCategory) {
    case 1:
      return "accident";
    case 2:
    case 3:
    case 4:
    case 8:
      return "hazard";
    case 5:
    case 7:
    case 9:
      return "roadwork";
    case 6:
      return "jam";
    case 10:
      return "weather";
    case 11:
    case 14:
      return "breakdown";
    default:
      return "other";
  }
}

function pinColorForKind(type: MapPinKind): string {
  switch (type) {
    case "accident":
      return "#F38A1F";
    case "collision":
      return "#22B86C";
    case "fire":
      return "#E63946";
    case "hazard":
      return "#F4C430";
    case "jam":
      return "#8C4FCF";
    case "medical":
      return "#E63946";
    case "police":
      return "#3FA7E6";
    case "weather":
      return "#28C6C8";
    case "roadwork":
      return "#F97316";
    case "breakdown":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
}

const GLYPHS: Record<MapPinKind, string> = {
  accident: `<path d="M3 14l1.5-4 2-1h4l2.5 4h7v4h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-3z"/><path d="M14 5l1 3M18 4l-2 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  collision: `<path d="M2 14l1-3 2-1h4l2 3h4l2-3h2l1 3v3h-2a2 2 0 1 1-4 0h-2a2 2 0 1 1-4 0H4a2 2 0 1 1-4 0v-3z"/>`,
  fire: `<path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s1 2 3 2c0-3-2-4 0-7z"/>`,
  hazard: `<rect x="11" y="6" width="2.2" height="8" rx="1"/><circle cx="12" cy="17" r="1.4"/>`,
  jam: `<rect x="4" y="4" width="11" height="6" rx="2"/><rect x="9" y="14" width="11" height="6" rx="2"/><circle cx="6.5" cy="10.5" r="1.2"/><circle cx="12.5" cy="10.5" r="1.2"/><circle cx="11.5" cy="20.5" r="1.2"/><circle cx="17.5" cy="20.5" r="1.2"/>`,
  medical: `<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"/>`,
  police: `<path d="M6 12a6 6 0 0 1 12 0v4H6v-4z"/><circle cx="12" cy="6" r="2"/><rect x="4" y="16" width="16" height="2" rx="1"/>`,
  weather: `<path d="M7 13a4 4 0 1 1 1.5-7.7A5 5 0 0 1 18 9a3 3 0 0 1 0 6H7z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  roadwork: `<path d="M5 9h14l-2 11H7L5 9zM3 7h18v2H3z"/>`,
  breakdown: `<path d="M2 16h7l3-4h6l4 4v3h-2"/><circle cx="7" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/>`,
  other: `<circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.8"/>`,
};

const PIN_BOX = 36;
const CX = PIN_BOX / 2;

/** Stable key for marker diffing — order-independent. */
export function incidentsMarkerKey(
  incidents: { id: string; coordinates: [number, number]; iconCategory: number }[],
): string {
  return incidents
    .map(
      (i) =>
        `${i.id}:${i.coordinates[0].toFixed(5)}:${i.coordinates[1].toFixed(5)}:${i.iconCategory}`,
    )
    .sort()
    .join("|");
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Cap incidents (mobile / dense views). Optionally sort nearest to userLoc. */
export function capIncidentsForMap<
  T extends { id: string; coordinates: [number, number]; iconCategory: number },
>(
  incidents: T[],
  opts: { maxMarkers: number; selectedId?: string | null; userLocation?: [number, number] | null },
): T[] {
  const { maxMarkers, selectedId, userLocation } = opts;
  if (incidents.length <= maxMarkers) return incidents;

  const selected = selectedId
    ? incidents.find((x) => x.id === selectedId)
    : undefined;
  let rest = selected
    ? incidents.filter((x) => x.id !== selected.id)
    : [...incidents];

  if (userLocation && rest.length > 0) {
    const [ulng, ulat] = userLocation;
    rest = rest
      .map((inc) => ({
        inc,
        d: haversineKm(inc.coordinates, [ulng, ulat]),
      }))
      .sort((x, y) => x.d - y.d)
      .map(({ inc }) => inc);
  } else {
    rest.sort((a, b) => a.id.localeCompare(b.id));
  }

  const budget = Math.max(0, maxMarkers - (selected ? 1 : 0));
  const picked = rest.slice(0, budget);
  if (selected) {
    const out = [selected, ...picked.filter((x) => x.id !== selected.id)];
    return out.slice(0, maxMarkers);
  }
  return picked.slice(0, maxMarkers);
}

export function buildIncidentPinHtml(iconCategory: number, selected: boolean): string {
  const t = pinKindFromCategory(iconCategory);
  const color = pinColorForKind(t);
  const glyph = GLYPHS[t] ?? GLYPHS.other;
  const ring =
    selected
      ? `<circle cx="${CX}" cy="${CX}" r="17.5" fill="none" stroke="#ffffff" stroke-width="3"/>`
      : "";
  /* viewBox centered pin; glyphs from 24×24 Incidenta primitives */
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_BOX}" height="${PIN_BOX}" viewBox="0 0 ${PIN_BOX} ${PIN_BOX}">${ring}<circle cx="${CX}" cy="${CX}" r="15" fill="${color}"/><g transform="translate(${CX},${CX}) scale(0.62) translate(-12,-12)" fill="#fff">${glyph}</g></svg>`;
}

export function suggestedMaxMarkers(): number {
  if (typeof window === "undefined") return 400;
  return window.matchMedia("(max-width: 767px)").matches ? 100 : 400;
}
