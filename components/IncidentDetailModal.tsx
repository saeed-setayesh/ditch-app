"use client";

import { useEffect, useState } from "react";

export type IncidentMini = {
  id: string;
  coordinates: [number, number];
  description: string;
  iconCategory: number;
  from?: string;
  to?: string;
  sources?: string[];
};

/* ── helpers ── */

const CATEGORY_LABELS: Record<number, string> = {
  0: "Unknown",
  1: "Accident",
  2: "Fog",
  3: "Dangerous conditions",
  4: "Rain",
  5: "Ice",
  6: "Jam",
  7: "Lane closed",
  8: "Road closed",
  9: "Road works",
  10: "Wind",
  11: "Flooding",
  14: "Broken-down vehicle",
};

const CATEGORY_ICONS: Record<number, string> = {
  1: "🚨",
  3: "⚠️",
  6: "🚗",
  7: "🚧",
  8: "⛔",
  9: "🔧",
  14: "🚙",
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

function severityColor(mag: number | undefined | null): string {
  if (mag == null) return "text-zinc-400";
  if (mag >= 4) return "text-red-400";
  if (mag >= 3) return "text-orange-400";
  if (mag >= 2) return "text-amber-400";
  return "text-yellow-400";
}

function severityLabel(mag: number | undefined | null): string {
  if (mag == null) return "Unknown";
  if (mag >= 4) return "Severe";
  if (mag >= 3) return "Major";
  if (mag >= 2) return "Moderate";
  if (mag >= 1) return "Minor";
  return "Minimal";
}

function confidenceBadge(c: string | undefined | null) {
  if (!c) return null;
  const colors: Record<string, string> = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[c] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"}`}>
      {c.charAt(0).toUpperCase() + c.slice(1)} confidence
    </span>
  );
}

function statusBadge(s: string | undefined | null) {
  if (!s) return null;
  const isActive = s === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
        isActive
          ? "bg-green-500/15 text-green-400 border-green-500/30"
          : "bg-zinc-700/60 text-zinc-400 border-zinc-600"
      }`}
    >
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
      {s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}
    </span>
  );
}

/* ── Detail row ── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="shrink-0 w-24 text-[11px] font-medium text-zinc-500 uppercase tracking-wider pt-0.5">
        {label}
      </span>
      <span className="text-sm text-zinc-200 flex-1 min-w-0">{children}</span>
    </div>
  );
}

/* ── Component ── */

export default function IncidentDetailModal({
  incident,
  onClose,
  onViewCamera,
}: {
  incident: IncidentMini;
  onClose: () => void;
  onViewCamera?: (incident: IncidentMini) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const source =
          incident.sources && incident.sources.length > 0
            ? incident.sources[0]
            : "tomtom";
        const [lng, lat] = incident.coordinates;
        const url = `/api/incidents/detail?source=${encodeURIComponent(source)}&lat=${lat}&lng=${lng}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load detail");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [incident]);

  /* extract fields from detail response */
  const inc = (detail?.incident ?? {}) as Record<string, unknown>;
  const source = (detail?.source as string) ?? "tomtom";
  const description = (inc.description as string) ?? incident.description;
  const from = (inc.from as string) ?? incident.from;
  const to = (inc.to as string) ?? incident.to;
  const iconCategory = (inc.iconCategory as number) ?? incident.iconCategory;
  const startTime = inc.startTime as string | null | undefined;
  const endTime = inc.endTime as string | null | undefined;
  const lastReport = inc.lastReportTime as string | null | undefined;
  const status = inc.status as string | undefined;
  const confidence = inc.confidence as string | undefined;
  const magnitudeOfDelay = inc.magnitudeOfDelay as number | undefined;
  const categoryLabel = CATEGORY_LABELS[iconCategory] ?? description;
  const categoryIcon = CATEGORY_ICONS[iconCategory] ?? "📍";

  /* 511on fields */
  const eventType = inc.EventType as string | undefined;
  const desc511 = inc.Description as string | undefined;
  const roadwayName = inc.RoadwayName as string | undefined;
  const direction = inc.Direction as string | undefined;
  const lanesAffected = inc.LanesAffected as string | undefined;
  const startDate511 = inc.StartDate as string | undefined;
  const lastUpdated511 = inc.LastUpdated as string | undefined;

  const is511 = source === "511on";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-t-2xl sm:rounded-xl border border-zinc-800 w-full sm:max-w-md max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <header className="px-4 pt-2 pb-3 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{categoryIcon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-zinc-100 leading-tight">
                {categoryLabel}
              </h3>
              {from && (
                <p className="text-xs text-zinc-400 mt-1 leading-snug">
                  {from}
                  {to ? ` → ${to}` : ""}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {statusBadge(status)}
                {confidenceBadge(confidence)}
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border bg-zinc-700/60 text-zinc-300 border-zinc-600">
                  {is511 ? "Ontario 511" : "TomTom"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <div className="w-5 h-5 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-sm text-zinc-500">Loading details…</span>
            </div>
          ) : error ? (
            <div className="py-4 text-center text-red-400 text-sm">{error}</div>
          ) : detail ? (
            <div className="divide-y divide-zinc-800">
              {/* Severity / delay */}
              {magnitudeOfDelay != null && (
                <Row label="Severity">
                  <span className={`font-medium ${severityColor(magnitudeOfDelay)}`}>
                    {severityLabel(magnitudeOfDelay)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">
                    (delay magnitude {magnitudeOfDelay})
                  </span>
                </Row>
              )}

              {/* 511 specific: event type & description */}
              {is511 && eventType && (
                <Row label="Event type">{eventType}</Row>
              )}
              {is511 && desc511 && (
                <Row label="Description">
                  <span className="whitespace-pre-wrap">{desc511}</span>
                </Row>
              )}
              {is511 && roadwayName && (
                <Row label="Roadway">{roadwayName}{direction ? ` — ${direction}` : ""}</Row>
              )}
              {is511 && lanesAffected && (
                <Row label="Lanes">{lanesAffected}</Row>
              )}

              {/* Time info */}
              <Row label="Started">
                <span>{formatTime(startTime ?? startDate511)}</span>
                {(startTime || startDate511) && (
                  <span className="text-xs text-zinc-500 ml-2">
                    ({timeAgo(startTime ?? startDate511)})
                  </span>
                )}
              </Row>
              {(endTime || lastReport || lastUpdated511) && (
                <Row label={endTime ? "Expected end" : "Last update"}>
                  {formatTime(endTime ?? lastReport ?? lastUpdated511)}
                </Row>
              )}

              {/* Location */}
              <Row label="Location">
                <span className="font-mono text-xs">
                  {incident.coordinates[1].toFixed(5)}, {incident.coordinates[0].toFixed(5)}
                </span>
              </Row>
            </div>
          ) : (
            <div className="py-6 text-center text-zinc-500 text-sm">
              No additional details available.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
          {onViewCamera && (
            <button
              type="button"
              onClick={() => onViewCamera(incident)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors text-center"
            >
              View nearby camera
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors text-center"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

