"use client";

import { useState, useEffect, createElement, useRef } from "react";
import { haversineKm } from "@/lib/geo";
import { getIconType, getIconComponent } from "./IncidentIcons";
import { Camera, Info, Clock, Navigation, MapPin } from "lucide-react";
import { getRelativeTime } from "@/lib/time";
import { describeEtaShot } from "@/lib/shotLevel";

export type IncidentForList = {
  id: string;
  coordinates: [number, number];
  description: string;
  iconCategory: number;
  from?: string;
  to?: string;
  magnitudeOfDelay?: number;
  towScore?: number;
  towLabel?: "High" | "Medium" | "Low";
  status?: "active" | "likely_cleared";
  confidence?: "high" | "medium" | "low";
  etaMinutes?: number | null;
  sources?: string[];
  createdAt?: string | Date;
  startTime?: string | Date;
};

const INCIDENT_FILTER_OPTIONS: { value: string; label: string; categories: number[] }[] = [
  { value: "all", label: "All", categories: [] },
  { value: "1", label: "Accidents", categories: [1] },
  { value: "8", label: "Road closed", categories: [8] },
  { value: "14", label: "Broken down", categories: [14] },
  { value: "6", label: "Jam", categories: [6] },
  { value: "7", label: "Lane closed", categories: [7] },
  { value: "9", label: "Road works", categories: [9] },
  { value: "3", label: "Dangerous", categories: [3] },
  { value: "other", label: "Other", categories: [0, 2, 4, 5, 10, 11] },
];

type IncidentListProps = {
  incidents: IncidentForList[];
  userLocation?: [number, number] | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onViewCamera?: (incident: IncidentForList) => void;
  onShowDetails?: (incident: IncidentForList) => void;
  onNavigate?: (incident: IncidentForList) => void;
  onNavigateWaze?: (incident: IncidentForList) => void;
  tier?: "free" | "pro";
  loading?: boolean;
};

function isHighSeverity(incident: IncidentForList): boolean {
  return incident.iconCategory === 1 || incident.towLabel === "High";
}

function IncidentCard({
  incident,
  distanceKm,
  isSelected,
  onSelect,
  onViewCamera,
  onShowDetails,
  onNavigate,
  onNavigateWaze,
  tier,
}: {
  incident: IncidentForList;
  distanceKm: number | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewCamera?: (incident: IncidentForList) => void;
  onShowDetails?: (incident: IncidentForList) => void;
  onNavigate?: (incident: IncidentForList) => void;
  onNavigateWaze?: (incident: IncidentForList) => void;
  tier?: "free" | "pro";
}) {
  const [relativeTime, setRelativeTime] = useState<string>("");
  
  const iconType = getIconType(incident.iconCategory);
  const scoreColor =
    incident.towLabel === "High"
      ? "bg-deep/15 text-deep"
      : incident.towLabel === "Medium"
        ? "bg-sky/15 text-deep"
        : "bg-ink/10 text-muted";

  const shot = describeEtaShot(incident.etaMinutes, incident.confidence);

  // Update relative time every minute
  useEffect(() => {
    const updateTime = () => {
      if (incident.createdAt || incident.startTime) {
        const timeToUse = incident.createdAt || incident.startTime;
        setRelativeTime(getRelativeTime(timeToUse!));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [incident.createdAt, incident.startTime]);

  return (
    <div
      data-list-incident-id={incident.id}
      className={`w-full border-b border-ink/10 text-left transition-colors duration-150 ${
        isSelected
          ? "bg-sky/15 hover:bg-sky/18"
          : "bg-transparent hover:bg-sky/10"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(incident.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(incident.id);
          }
        }}
        className="cursor-pointer px-4 py-3.5 outline-none focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky/55"
      >
        <div className="flex items-start gap-3">
          <div className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.14)] [&_svg]:h-full [&_svg]:w-full">
            {createElement(getIconComponent(iconType), { size: 38 })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-ink">
                {incident.description}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {incident.sources && incident.sources.length > 0 && (
                  <>
                    {incident.sources.map((s) => (
                      <span
                        key={s}
                        className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono-brand text-[10px] font-medium ${
                          s === "tomtom"
                            ? "bg-sky/15 text-deep"
                            : s === "511on"
                              ? "bg-deep/10 text-deep"
                              : s === "inrix"
                                ? "bg-ink/10 text-muted"
                                : "bg-ink/10 text-muted"
                        }`}
                      >
                        {s === "tomtom"
                          ? "TomTom"
                          : s === "511on"
                            ? "511"
                            : s === "inrix"
                              ? "INRIX"
                              : s}
                      </span>
                    ))}
                  </>
                )}
                {incident.towLabel != null && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${scoreColor}`}
                  >
                    {incident.towLabel}
                  </span>
                )}
                {incident.status != null && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      incident.status === "active"
                        ? "bg-sky/20 text-deep"
                        : "bg-ink/10 text-muted"
                    }`}
                  >
                    {incident.status === "active" ? "Active" : "Cleared"}
                  </span>
                )}
              </div>
            </div>
            {(incident.from || incident.to) && (
              <p className="mb-1 truncate text-sm font-medium text-muted">
                {[incident.from, incident.to].filter(Boolean).join(" → ")}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-start justify-between gap-2 text-xs text-muted">
              <div className="flex flex-wrap items-center gap-2">
                {distanceKm != null && (
                  <span className="font-mono-brand font-medium text-deep">
                    {distanceKm < 1
                      ? `${(distanceKm * 1000).toFixed(0)}m away`
                      : `${distanceKm.toFixed(1)}km`}
                  </span>
                )}
                {relativeTime && (
                  <span className="flex items-center gap-1 italic text-muted">
                    <Clock className="h-3 w-3" />
                    {relativeTime}
                  </span>
                )}
              </div>
              {shot != null && incident.etaMinutes != null && incident.etaMinutes >= 0 ? (
                <span className="flex max-w-[11rem] flex-col items-end text-right leading-tight">
                  <span className="font-mono-brand font-semibold text-ink">
                    ~{incident.etaMinutes} min
                  </span>
                  <span className={`text-[10px] font-medium ${shot.toneClass}`}>
                    {shot.line}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/[0.06] px-4 pb-3 pt-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(incident)}
              className="flex items-center gap-1.5 rounded-[10px] bg-sky/15 px-3 py-1.5 text-xs font-semibold text-deep transition hover:bg-sky/25"
            >
              <Navigation className="h-3.5 w-3.5" />
              Directions
            </button>
          )}
          {onNavigateWaze && (
            <button
              type="button"
              onClick={() => onNavigateWaze(incident)}
              className="flex items-center gap-1.5 rounded-[10px] bg-deep/10 px-3 py-1.5 text-xs font-semibold text-deep transition hover:bg-deep/15"
              title="Open in Waze"
            >
              <MapPin className="h-3.5 w-3.5" />
              Waze
            </button>
          )}
          {onViewCamera &&
            (tier === "pro" && isHighSeverity(incident) ? (
              <button
                type="button"
                onClick={() => onViewCamera(incident)}
                className="flex items-center gap-1.5 rounded-[10px] bg-deep/10 px-3 py-1.5 text-xs font-semibold text-deep transition hover:bg-deep/15"
              >
                <Camera className="h-3.5 w-3.5" />
                Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewCamera(incident)}
                className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-ice"
              >
                <Camera className="h-3.5 w-3.5" />
                Camera
              </button>
            ))}
          {onShowDetails && (
            <button
              type="button"
              onClick={() => onShowDetails(incident)}
              className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold text-deep transition hover:bg-sky/10"
            >
              <Info className="h-3.5 w-3.5" />
              Details
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function filterIncidents(
  incidents: IncidentForList[],
  filter: { value: string; categories: number[] }
): IncidentForList[] {
  if (filter.value === "all" || filter.categories.length === 0) return incidents;
  if (filter.value === "other") {
    const otherSet = new Set(filter.categories);
    return incidents.filter((inc) => otherSet.has(inc.iconCategory));
  }
  const set = new Set(filter.categories);
  return incidents.filter((inc) => set.has(inc.iconCategory));
}

export default function IncidentList({
  incidents,
  userLocation,
  selectedId,
  onSelect,
  onViewCamera,
  onShowDetails,
  onNavigate,
  onNavigateWaze,
  tier,
  loading,
}: IncidentListProps) {
  const typeFilter = INCIDENT_FILTER_OPTIONS[0];
  const [showActive, setShowActive] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const filtered = filterIncidents(incidents, typeFilter);
  
  // Filter incidents based on active/all toggle
  const displayedIncidents = showActive 
    ? filtered.filter(inc => inc.status !== "likely_cleared")
    : filtered;

  useEffect(() => {
    if (!selectedId || !scrollAreaRef.current) return;
    const frame = requestAnimationFrame(() => {
      const escaped =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(selectedId)
          : selectedId;
      const row = scrollAreaRef.current?.querySelector(
        `[data-list-incident-id="${escaped}"]`,
      );
      row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, showActive, incidents.length]);

  if (loading) {
    return (
      <div className="space-y-0 p-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-2 h-20 animate-pulse rounded-lg bg-white/45"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="shrink-0 px-3 pb-2 pt-1">
        <div className="grid grid-cols-2 gap-0 rounded-[14px] bg-ice/90 p-1">
          <button
            type="button"
            onClick={() => setShowActive(true)}
            className={`rounded-[10px] py-2 text-center text-sm font-semibold transition-colors ${
              showActive
                ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                : "text-muted hover:bg-white/70 hover:text-ink"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setShowActive(false)}
            className={`rounded-[10px] py-2 text-center text-sm font-semibold transition-colors ${
              !showActive
                ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                : "text-muted hover:bg-white/70 hover:text-ink"
            }`}
          >
            All
          </button>
        </div>
      </div>
      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto pb-6"
      >
        {displayedIncidents.length === 0 ? (
          <div className="p-6 text-center text-muted">
            <p className="text-lg text-ink">
              {incidents.length === 0
                ? "No incidents right now"
                : `No ${typeFilter.label.toLowerCase()} incidents`}
            </p>
            <p className="mt-1 text-sm">
              {incidents.length === 0
                ? "Traffic is clear."
                : "Try another filter or period."}
            </p>
          </div>
        ) : (
          <div>
            {displayedIncidents.map((inc) => {
              const [lng, lat] = inc.coordinates;
              const distanceKm =
                userLocation != null
                  ? haversineKm(userLocation[1], userLocation[0], lat, lng)
                  : null;
              return (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  distanceKm={distanceKm}
                  isSelected={selectedId === inc.id}
                  onSelect={onSelect}
                  onViewCamera={onViewCamera}
                  onShowDetails={onShowDetails}
                  onNavigate={onNavigate}
                  onNavigateWaze={onNavigateWaze}
                  tier={tier}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
