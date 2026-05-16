"use client";

import { useEffect, useState } from "react";
import {
  Crosshair,
  Tag,
  Trash2,
} from "lucide-react";
import {
  type DriverShortcut,
  MAX_DRIVER_QUICK_NAVS,
  DRIVER_QUICK_NAV_LABEL_MAX,
  parseDriverQuickNavsJson,
} from "@/lib/driverShortcuts";

type DraftNavRow = {
  id: string;
  label: string;
  latStr: string;
  lngStr: string;
};

function quickNavsToDraft(rows: DriverShortcut[]): DraftNavRow[] {
  return rows.map((n) => ({
    id: n.id,
    label: n.label,
    latStr: String(n.lat),
    lngStr: String(n.lng),
  }));
}

function draftToShortcuts(rows: DraftNavRow[]): DriverShortcut[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.label.trim(),
    lat: Number(r.latStr),
    lng: Number(r.lngStr),
  }));
}

type Props = {
  quickNavs: DriverShortcut[];
  onQuickNavsSaved: (navs: DriverShortcut[]) => void;
};

export default function DriverQuickNavEditor({
  quickNavs,
  onQuickNavsSaved,
}: Props) {
  const [draftNavs, setDraftNavs] = useState<DraftNavRow[]>([]);
  const [navMessage, setNavMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftNavs(quickNavsToDraft(quickNavs));
    setNavMessage(null);
  }, [quickNavs]);

  const saveQuickNavs = () => {
    const nonEmpty = draftNavs.filter(
      (r) =>
        r.label.trim().length > 0 ||
        r.latStr.trim().length > 0 ||
        r.lngStr.trim().length > 0,
    );
    const asShortcuts = draftToShortcuts(nonEmpty);
    const parsed = parseDriverQuickNavsJson(asShortcuts);
    if (parsed === null) {
      setNavMessage(
        `Check each destination: label (1–${DRIVER_QUICK_NAV_LABEL_MAX} chars), valid latitude (−90–90) and longitude (−180–180). Max ${MAX_DRIVER_QUICK_NAVS} slots. Remove incomplete rows or fill every field.`,
      );
      return;
    }
    setNavMessage(null);
    onQuickNavsSaved(parsed);
  };

  const addSlot = () => {
    if (draftNavs.length >= MAX_DRIVER_QUICK_NAVS) return;
    setDraftNavs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        latStr: "",
        lngStr: "",
      },
    ]);
  };

  const removeSlot = (id: string) => {
    setDraftNavs((prev) => prev.filter((n) => n.id !== id));
  };

  const updateDraftRow = (id: string, patch: Partial<DraftNavRow>) => {
    setDraftNavs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    );
  };

  const fillLabelFromCoords = async (
    id: string,
    latStr: string,
    lngStr: string,
  ) => {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
      const r = await fetch(
        `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      );
      const data = (await r.json()) as { line?: string | null };
      if (data.line)
        updateDraftRow(id, {
          label: data.line.slice(0, DRIVER_QUICK_NAV_LABEL_MAX),
        });
    } catch {
      // ignore
    }
  };

  const useMyLocation = (id: string) => {
    if (!navigator.geolocation) {
      setNavMessage("Location not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateDraftRow(id, { latStr: String(lat), lngStr: String(lng) });
        setNavMessage(null);
      },
      () => setNavMessage("Could not read your location."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Add up to {MAX_DRIVER_QUICK_NAVS} places for one-tap navigation on the
        map. No defaults — only what you save here appears.
      </p>
      <div className="space-y-3">
        {draftNavs.map((n) => (
          <div
            key={n.id}
            className="rounded-xl border border-ink/12 bg-paper p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">
                Destination
              </span>
              <button
                type="button"
                onClick={() => removeSlot(n.id)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-700"
                aria-label="Remove destination"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <label className="mb-2 block">
              <span className="mb-1 block text-[11px] text-muted">Label</span>
              <input
                type="text"
                value={n.label}
                maxLength={DRIVER_QUICK_NAV_LABEL_MAX}
                onChange={(e) =>
                  updateDraftRow(n.id, { label: e.target.value })
                }
                placeholder="e.g. Home base"
                className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
              />
            </label>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[11px] text-muted">Lat</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={n.latStr}
                  onChange={(e) =>
                    updateDraftRow(n.id, { latStr: e.target.value })
                  }
                  className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] text-muted">Lng</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={n.lngStr}
                  onChange={(e) =>
                    updateDraftRow(n.id, { lngStr: e.target.value })
                  }
                  className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => useMyLocation(n.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-ink/12 bg-white px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ice dark:bg-paper dark:hover:bg-ice"
              >
                <Crosshair className="size-3.5" />
                Use my location
              </button>
              <button
                type="button"
                onClick={() => fillLabelFromCoords(n.id, n.latStr, n.lngStr)}
                className="inline-flex items-center gap-1 rounded-lg border border-ink/12 bg-white px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ice dark:bg-paper dark:hover:bg-ice"
              >
                <Tag className="size-3.5" />
                Label from map point
              </button>
            </div>
          </div>
        ))}
      </div>
      {draftNavs.length < MAX_DRIVER_QUICK_NAVS ? (
        <button
          type="button"
          onClick={addSlot}
          className="mt-3 w-full rounded-xl border border-dashed border-ink/20 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ice"
        >
          + Add destination ({draftNavs.length}/{MAX_DRIVER_QUICK_NAVS})
        </button>
      ) : null}
      {navMessage ? (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
          {navMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={saveQuickNavs}
        className="mt-3 w-full rounded-xl bg-sky py-3 text-sm font-semibold text-paper transition hover:bg-deep"
      >
        Save quick destinations
      </button>
    </div>
  );
}
