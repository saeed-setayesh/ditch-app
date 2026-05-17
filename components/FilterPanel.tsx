"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Ambulance,
  CarFront,
  CloudSun,
  Flame,
  MapPinned,
  Route,
  Shield,
  TriangleAlert,
  X,
} from "lucide-react";
import type { IncidentType } from "./IncidentIcons";
import { CollisionGlyph } from "./IncidentIcons";
import {
  DRIVER_MAP_RADIUS_MAX_KM,
  DRIVER_MAP_RADIUS_MIN_KM,
} from "@/lib/driverMapRadius";

export type { IncidentType };

export type FilterState = {
  incidentTypes: IncidentType[];
  radiusKm: number;
  showTrafficFlow: boolean;
};

type FilterPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

/** Filter chip icons — collision uses the same two-car glyph as map/list (TomTom cat 1). */
type IncidentFilterIcon = LucideIcon | typeof CollisionGlyph;

const INCIDENT_TYPES: {
  id: IncidentType;
  label: string;
  Icon: IncidentFilterIcon;
  color: string;
}[] = [
  { id: "accident", label: "Accident", Icon: CarFront, color: "#F38A1F" },
  /*
   * Category 1 is shown if filters include accident OR collision (shared crash bucket).
   * Turning both off hides those incidents; either chip alone shows them.
   */
  { id: "collision", label: "Collision", Icon: CollisionGlyph, color: "#E63946" },
  { id: "fire", label: "Fire", Icon: Flame, color: "#E63946" },
  { id: "hazard", label: "Hazard", Icon: TriangleAlert, color: "#F4C430" },
  { id: "jam", label: "Jam", Icon: Route, color: "#8C4FCF" },
  { id: "medical", label: "Medical", Icon: Ambulance, color: "#E63946" },
  { id: "police", label: "Police", Icon: Shield, color: "#3FA7E6" },
  { id: "weather", label: "Weather", Icon: CloudSun, color: "#28C6C8" },
];

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleIncidentType = (type: IncidentType) => {
    const newTypes = localFilters.incidentTypes.includes(type)
      ? localFilters.incidentTypes.filter((t) => t !== type)
      : [...localFilters.incidentTypes, type];

    const newFilters = { ...localFilters, incidentTypes: newTypes };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRadiusChange = (value: number) => {
    const newFilters = { ...localFilters, radiusKm: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTrafficFlowToggle = () => {
    const newFilters = { ...localFilters, showTrafficFlow: !localFilters.showTrafficFlow };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  if (!isOpen) return null;

  const span = DRIVER_MAP_RADIUS_MAX_KM - DRIVER_MAP_RADIUS_MIN_KM;
  const radiusPct =
    span > 0
      ? ((localFilters.radiusKm - DRIVER_MAP_RADIUS_MIN_KM) / span) * 100
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 md:items-center md:justify-center md:bg-black/50 md:p-4">
      <button
        type="button"
        aria-label="Close filters backdrop"
        className="absolute inset-0 md:hidden"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[min(85dvh,100%)] w-full flex-col overflow-hidden rounded-t-[24px] border border-ink/10 bg-paper shadow-[0_-10px_30px_rgba(0,0,0,0.12)] md:max-h-[90vh] md:max-w-md md:rounded-2xl md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-panel-title"
      >
        <div className="sticky top-0 z-[1] flex shrink-0 items-center justify-between rounded-t-[24px] border-b border-ink/[0.08] bg-paper px-5 pb-3 pt-5 md:rounded-t-2xl">
          <h2
            id="filter-panel-title"
            className="font-display text-2xl font-bold tracking-tight text-ink"
          >
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-ice hover:text-ink"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Type of Incidents
              </h3>
              <div className="grid grid-cols-4 gap-3.5">
                {INCIDENT_TYPES.map((type) => {
                  const { Icon } = type;
                  const isActive = localFilters.incidentTypes.includes(type.id);

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleIncidentType(type.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                        isActive
                          ? "bg-sky/[0.08] ring-2 ring-sky ring-offset-2 ring-offset-paper"
                          : "bg-ice/60 hover:bg-ice"
                      }`}
                    >
                      <div
                        className={`flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.12)] transition-[transform,opacity] ${
                          isActive ? "scale-100 opacity-100" : "opacity-[0.72] hover:opacity-90"
                        }`}
                        style={{
                          background: `linear-gradient(150deg, ${type.color} 0%, color-mix(in srgb, ${type.color} 58%, #0c1724) 100%)`,
                        }}
                      >
                        <Icon
                          className="h-[26px] w-[26px] shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
                          strokeWidth={2.35}
                          aria-hidden
                        />
                      </div>
                      <span
                        className={`text-center text-[11px] font-medium leading-tight ${
                          isActive ? "text-ink" : "text-muted"
                        }`}
                      >
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice text-deep">
                    <MapPinned className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  Radius to Monitor
                </h3>
                <span className="font-mono-brand text-sm font-semibold text-deep">
                  {localFilters.radiusKm} km
                </span>
              </div>
              <div className="space-y-2 px-1.5">
                <div className="flex justify-between font-mono-brand text-[11px] font-semibold text-muted">
                  <span>{DRIVER_MAP_RADIUS_MIN_KM} km</span>
                  <span>{DRIVER_MAP_RADIUS_MAX_KM} km</span>
                </div>
                <input
                  type="range"
                  min={DRIVER_MAP_RADIUS_MIN_KM}
                  max={DRIVER_MAP_RADIUS_MAX_KM}
                  step="1"
                  value={localFilters.radiusKm}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="h-6 w-full cursor-pointer appearance-none rounded-full bg-ice accent-sky"
                  style={{
                    background: `linear-gradient(to right, var(--brand-sky) 0%, var(--brand-sky) ${radiusPct}%, var(--brand-ice) ${radiusPct}%, var(--brand-ice) 100%)`,
                  }}
                />
                <p className="text-center text-xs italic text-muted">
                  Incidents load around your location inside this radius (North
                  America).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-ice/80 px-4 py-3.5">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-sky shadow-sm">
                  <Activity className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                Show Traffic
              </span>
              <button
                type="button"
                onClick={handleTrafficFlowToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  localFilters.showTrafficFlow ? "bg-sky" : "bg-ink/20"
                }`}
              >
                <span
                  className={`inline-block h-[18px] w-[18px] transform rounded-full bg-paper shadow transition-transform ${
                    localFilters.showTrafficFlow
                      ? "translate-x-[22px]"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-sky py-3.5 font-semibold text-paper shadow-[0_4px_14px_rgba(63,167,230,0.35)] transition hover:bg-deep"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
