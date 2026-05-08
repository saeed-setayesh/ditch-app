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
  if (mag == null) return "text-muted";
  if (mag >= 4) return "text-red-600";
  if (mag >= 3) return "text-orange-600";
  if (mag >= 2) return "text-amber-700";
  return "text-deep";
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
    high: "bg-sky/15 text-deep border-sky/30",
    medium: "bg-ice text-deep border-ink/15",
    low: "bg-red-500/10 text-red-700 border-red-300/40",
  };
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${colors[c] ?? "border-ink/10 bg-ice text-muted"}`}>
      {c.charAt(0).toUpperCase() + c.slice(1)} confidence
    </span>
  );
}

function statusBadge(s: string | undefined | null) {
  if (!s) return null;
  const isActive = s === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
        isActive
          ? "border-sky/35 bg-sky/15 text-deep"
          : "border-ink/10 bg-ice text-muted"
      }`}
    >
      {isActive && (
        <span className="size-1.5 animate-pulse rounded-full bg-sky" />
      )}
      {s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}
    </span>
  );
}

/* ── Detail row ── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-24 shrink-0 pt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm text-ink">{children}</span>
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

  const [humanPlaceLine, setHumanPlaceLine] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const [lng, lat] = incident.coordinates;
    setHumanPlaceLine(null);
    void fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { line?: string | null } | null) => {
        if (!cancelled && d?.line) setHumanPlaceLine(d.line);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [incident.id, incident.coordinates[0], incident.coordinates[1]]);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-ink/10 bg-paper sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-ink/15" />
        </div>

        <header className="border-b border-ink/[0.08] px-4 pb-3 pt-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">{categoryIcon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-bold leading-tight text-ink">
                {categoryLabel}
              </h3>
              {from && (
                <p className="mt-1 text-xs leading-snug text-muted">
                  {from}
                  {to ? ` → ${to}` : ""}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {statusBadge(status)}
                {confidenceBadge(confidence)}
                <span className="inline-flex rounded border border-ink/10 bg-ice px-1.5 py-0.5 font-mono-brand text-[10px] font-medium text-deep">
                  {is511 ? "Ontario 511" : "TomTom"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky/30 border-t-sky" />
              <span className="text-sm text-muted">Loading details…</span>
            </div>
          ) : error ? (
            <div className="py-4 text-center text-sm text-red-600">{error}</div>
          ) : detail ? (
            <div className="divide-y divide-ink/[0.08]">
              {/* Severity / delay */}
              {magnitudeOfDelay != null && (
                <Row label="Severity">
                  <span className={`font-medium ${severityColor(magnitudeOfDelay)}`}>
                    {severityLabel(magnitudeOfDelay)}
                  </span>
                  <span className="ml-2 text-xs text-muted">
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
                  <span className="ml-2 text-xs text-muted">
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
              {humanPlaceLine && (
                <Row label="Nearby">{humanPlaceLine}</Row>
              )}
              <Row label="Coords">
                <span className="font-mono-brand text-xs text-deep">
                  {incident.coordinates[1].toFixed(5)}, {incident.coordinates[0].toFixed(5)}
                </span>
              </Row>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted">
              No additional details available.
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-ink/[0.08] px-4 py-3">
          {onViewCamera && (
            <button
              type="button"
              onClick={() => onViewCamera(incident)}
              className="flex-1 rounded-lg border border-deep/25 bg-deep/10 py-2.5 text-center text-sm font-semibold text-deep transition hover:bg-deep/15"
            >
              View nearby camera
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-ink/12 bg-ice py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-ice/80"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

