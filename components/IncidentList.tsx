"use client";

import { useState, useEffect } from "react";
import { haversineKm } from "@/lib/geo";
import { getIconType, getIconComponent } from "./IncidentIcons";
import { Camera, Info, Clock, Navigation, MapPin } from "lucide-react";
import { getRelativeTime } from "@/lib/time";

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
  const IconComponent = getIconComponent(iconType);
  const scoreColor =
    incident.towLabel === "High"
      ? "bg-emerald-500/20 text-emerald-400"
      : incident.towLabel === "Medium"
        ? "bg-amber-500/20 text-amber-400"
        : "bg-zinc-500/20 text-zinc-400";

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
      data-incident-id={incident.id}
      className={`w-full text-left rounded-xl transition-all duration-200 border ${
        isSelected
          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/30"
          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 hover:bg-zinc-100 dark:hover:bg-zinc-700/90 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
    >
      {/* Clickable selection area */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(incident.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(incident.id); } }}
        className="p-3 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <IconComponent size={40} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex-1 min-w-0">
                {incident.description}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {incident.sources && incident.sources.length > 0 && (
                  <>
                    {incident.sources.map((s) => (
                      <span
                        key={s}
                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                          s === "tomtom"
                            ? "bg-blue-500/20 text-blue-300"
                            : s === "511on"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : s === "inrix"
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-zinc-500/20 text-zinc-300"
                        }`}
                      >
                        {s === "tomtom" ? "TomTom" : s === "511on" ? "511" : s === "inrix" ? "INRIX" : s}
                      </span>
                    ))}
                  </>
                )}
                {incident.towLabel != null && (
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${scoreColor}`}
                  >
                    {incident.towLabel}
                  </span>
                )}
                {incident.status != null && (
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                      incident.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-zinc-500/20 text-zinc-500"
                    }`}
                  >
                    {incident.status === "active" ? "Active" : "Cleared"}
                  </span>
                )}
              </div>
            </div>
            {(incident.from || incident.to) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate font-medium mb-1">
                {[incident.from, incident.to].filter(Boolean).join(" → ")}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-500 mt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {distanceKm != null && (
                  <span className="font-medium">
                    {distanceKm < 1
                      ? `${(distanceKm * 1000).toFixed(0)}m away`
                      : `${distanceKm.toFixed(1)}km`}
                  </span>
                )}
                {relativeTime && (
                  <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {relativeTime}
                  </span>
                )}
              </div>
              {incident.etaMinutes != null && incident.etaMinutes >= 0 && (
                <span className="text-zinc-700 dark:text-zinc-400 font-medium">~{incident.etaMinutes} min</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — separate from the selection area */}
      {isSelected && (
        <div className="px-3 pb-3 pt-2 flex flex-wrap items-center gap-2 border-t border-zinc-200 dark:border-zinc-700/50 mt-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(incident)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </button>
          )}
          {onNavigateWaze && (
            <button
              type="button"
              onClick={() => onNavigateWaze(incident)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              title="Open in Waze"
            >
              <MapPin className="w-3.5 h-3.5" />
              Waze
            </button>
          )}
          {onViewCamera && (
            tier === "pro" && isHighSeverity(incident) ? (
              <button
                type="button"
                onClick={() => onViewCamera(incident)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewCamera(incident)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Camera
              </button>
            )
          )}
          {onShowDetails && (
            <button
              type="button"
              onClick={() => onShowDetails(incident)}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
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
  const [typeFilter, setTypeFilter] = useState(INCIDENT_FILTER_OPTIONS[0]);
  const [showActive, setShowActive] = useState(true);

  const filtered = filterIncidents(incidents, typeFilter);
  
  // Filter incidents based on active/all toggle
  const displayedIncidents = showActive 
    ? filtered.filter(inc => inc.status !== "likely_cleared")
    : filtered;

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-3 pt-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowActive(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              showActive
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setShowActive(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !showActive
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-16">
        {displayedIncidents.length === 0 ? (
          <div className="p-6 text-center text-zinc-600 dark:text-zinc-500">
            <p className="text-lg">
              {incidents.length === 0
                ? "No incidents right now"
                : `No ${typeFilter.label.toLowerCase()} incidents`}
            </p>
            <p className="text-sm mt-1">
              {incidents.length === 0
                ? "Traffic is clear."
                : "Try another filter or period."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
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
