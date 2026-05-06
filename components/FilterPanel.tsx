"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  AccidentIcon,
  CollisionIcon,
  FireIcon,
  HazardIcon,
  JamIcon,
  MedicalIcon,
  PoliceIcon,
  WeatherIcon,
} from "./IncidentIcons";

export type IncidentType =
  | "accident"
  | "collision"
  | "fire"
  | "hazard"
  | "jam"
  | "medical"
  | "police"
  | "weather";

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

const INCIDENT_TYPES: {
  id: IncidentType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}[] = [
  { id: "accident", label: "Accident", icon: AccidentIcon, color: "#F38A1F" },
  { id: "collision", label: "Collision", icon: CollisionIcon, color: "#22B86C" },
  { id: "fire", label: "Fire", icon: FireIcon, color: "#E63946" },
  { id: "hazard", label: "Hazard", icon: HazardIcon, color: "#F4C430" },
  { id: "jam", label: "Jam", icon: JamIcon, color: "#8C4FCF" },
  { id: "medical", label: "Medical", icon: MedicalIcon, color: "#E63946" },
  { id: "police", label: "Police", icon: PoliceIcon, color: "#3FA7E6" },
  { id: "weather", label: "Weather", icon: WeatherIcon, color: "#28C6C8" },
];

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

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

  const radiusPct = ((localFilters.radiusKm - 1) / 49) * 100;

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
                  const Icon = type.icon;
                  const isActive = localFilters.incidentTypes.includes(type.id);

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleIncidentType(type.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                        isActive
                          ? "bg-sky/10 ring-2 ring-sky"
                          : "bg-ice/60 hover:bg-ice"
                      }`}
                    >
                      <div
                        className={`transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}
                      >
                        <Icon size={48} />
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
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">
                  Radius to Monitor
                </h3>
                <span className="font-mono-brand text-sm font-semibold text-deep">
                  {localFilters.radiusKm === 50
                    ? "All"
                    : `${localFilters.radiusKm} km`}
                </span>
              </div>
              <div className="space-y-2 px-1.5">
                <div className="flex justify-between font-mono-brand text-[11px] font-semibold text-muted">
                  <span>1 KM</span>
                  <span>50 KM (All)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={localFilters.radiusKm}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="h-6 w-full cursor-pointer appearance-none rounded-full bg-ice accent-sky"
                  style={{
                    background: `linear-gradient(to right, var(--brand-sky) 0%, var(--brand-sky) ${radiusPct}%, var(--brand-ice) ${radiusPct}%, var(--brand-ice) 100%)`,
                  }}
                />
                <p className="text-center text-xs italic text-muted">
                  Set to 50 to show all incidents regardless of distance
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-ice/80 px-4 py-3.5">
              <span className="text-sm font-semibold text-ink">
                Show Traffic
              </span>
              <button
                type="button"
                onClick={handleTrafficFlowToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
