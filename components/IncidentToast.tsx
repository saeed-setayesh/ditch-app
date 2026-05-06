"use client";

import { useEffect } from "react";

export type ToastIncident = {
  id: string;
  description: string;
  iconCategory: number;
};

type Props = {
  incident: ToastIncident;
  onDismiss: () => void;
  duration?: number;
};

const ICON_LABELS: Record<number, string> = {
  1: "Accident",
  6: "Traffic jam",
  8: "Road closed",
  9: "Road works",
  10: "Weather",
  11: "Breakdown",
  14: "Breakdown",
  3: "Hazard",
  4: "Hazard",
  7: "Lane closed",
};

function getIncidentLabel(cat: number): string {
  return ICON_LABELS[cat] ?? "Incident";
}

export default function IncidentToast({
  incident,
  onDismiss,
  duration = 5000,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const label = getIncidentLabel(incident.iconCategory);
  const desc =
    incident.description?.length > 60
      ? `${incident.description.slice(0, 60)}…`
      : incident.description ?? "New incident reported";

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper p-4 shadow-lg"
      style={{ animation: "toastSlideIn 0.3s ease-out" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/15">
        <span className="text-lg">🚨</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">New {label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-ice hover:text-ink"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
