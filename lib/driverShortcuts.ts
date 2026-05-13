/**
 * Driver-defined quick destinations (WGS84: lat, lng). No server defaults — user adds up to
 * {@link MAX_DRIVER_QUICK_NAVS} in Account.
 */
export type DriverShortcut = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const MAX_DRIVER_QUICK_NAVS = 3;
export const DRIVER_QUICK_NAV_LABEL_MAX = 80;
export const DRIVER_QUICK_NAVS_STORAGE_KEY = "traficapp_driver_quick_navs";

/** Validate API / DB JSON. Returns `null` if invalid. */
export function parseDriverQuickNavsJson(raw: unknown): DriverShortcut[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_DRIVER_QUICK_NAVS) return null;
  const out: DriverShortcut[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : null;
    const labelRaw = typeof o.label === "string" ? o.label.trim() : "";
    if (!id || !labelRaw || labelRaw.length > DRIVER_QUICK_NAV_LABEL_MAX) return null;
    const lat =
      typeof o.lat === "number" && Number.isFinite(o.lat)
        ? o.lat
        : typeof o.lat === "string"
          ? Number(o.lat)
          : NaN;
    const lng =
      typeof o.lng === "number" && Number.isFinite(o.lng)
        ? o.lng
        : typeof o.lng === "string"
          ? Number(o.lng)
          : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    out.push({ id, label: labelRaw, lat, lng });
  }
  return out;
}

export function readDriverQuickNavsFromLocalStorage(): DriverShortcut[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DRIVER_QUICK_NAVS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const navs = parseDriverQuickNavsJson(parsed);
    return navs ?? [];
  } catch {
    return [];
  }
}

export function writeDriverQuickNavsToLocalStorage(navs: DriverShortcut[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRIVER_QUICK_NAVS_STORAGE_KEY, JSON.stringify(navs));
  } catch {
    // ignore quota
  }
}
