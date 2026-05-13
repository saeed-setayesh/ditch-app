import type { FilterState, IncidentType } from "@/components/FilterPanel";

const STORAGE_KEY = "traficapp_driver_map_filters";

const ALL_INCIDENT_TYPES: IncidentType[] = [
  "accident",
  "collision",
  "fire",
  "hazard",
  "jam",
  "medical",
  "police",
  "weather",
];

const ALLOWED = new Set<string>(ALL_INCIDENT_TYPES);

/** Default map filter state (matches former dashboard hard-coded initial state). */
export const DEFAULT_DRIVER_MAP_FILTERS: FilterState = {
  incidentTypes: [...ALL_INCIDENT_TYPES],
  radiusKm: 50,
  showTrafficFlow: true,
};

function normalizeIncidentTypes(raw: unknown): IncidentType[] {
  if (!Array.isArray(raw)) return [...ALL_INCIDENT_TYPES];
  const out: IncidentType[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    const s = typeof x === "string" ? x : null;
    if (!s || !ALLOWED.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s as IncidentType);
  }
  return out.length > 0 ? out : [...ALL_INCIDENT_TYPES];
}

/** Parse stored JSON (API or localStorage). Returns null if unusable. */
export function parseDriverMapFiltersJson(raw: unknown): FilterState | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const incidentTypes = normalizeIncidentTypes(o.incidentTypes);
  let radiusKm = DEFAULT_DRIVER_MAP_FILTERS.radiusKm;
  if (typeof o.radiusKm === "number" && Number.isFinite(o.radiusKm)) {
    radiusKm = Math.min(50, Math.max(1, Math.round(o.radiusKm)));
  }
  let showTrafficFlow = DEFAULT_DRIVER_MAP_FILTERS.showTrafficFlow;
  if (typeof o.showTrafficFlow === "boolean") {
    showTrafficFlow = o.showTrafficFlow;
  }

  return { incidentTypes, radiusKm, showTrafficFlow };
}

export function readDriverMapFiltersFromLocalStorage(): FilterState | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return parseDriverMapFiltersJson(JSON.parse(s));
  } catch {
    return null;
  }
}

export function writeDriverMapFiltersToLocalStorage(filters: FilterState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore quota / private mode
  }
}
