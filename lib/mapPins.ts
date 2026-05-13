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

/** 24×24 Lucide-style glyphs (white on colored pin); paths match lucide-react exports. */
const GLYPHS: Record<MapPinKind, string> = {
  accident: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/></g>`,
  collision: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></g>`,
  fire: `<path fill="#ffffff" d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>`,
  hazard: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></g>`,
  jam: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></g>`,
  medical: `<g fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></g>`,
  police: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></g>`,
  weather: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></g>`,
  roadwork: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/></g>`,
  breakdown: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></g>`,
  other: `<g fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></g>`,
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
  /* viewBox centered pin; inner coords are Lucide 24×24 */
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_BOX}" height="${PIN_BOX}" viewBox="0 0 ${PIN_BOX} ${PIN_BOX}">${ring}<circle cx="${CX}" cy="${CX}" r="15" fill="${color}"/><g transform="translate(${CX},${CX}) scale(0.6) translate(-12,-12)">${glyph}</g></svg>`;
}

export function suggestedMaxMarkers(): number {
  if (typeof window === "undefined") return 400;
  return window.matchMedia("(max-width: 767px)").matches ? 100 : 400;
}
