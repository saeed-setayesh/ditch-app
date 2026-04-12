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
  { id: "accident", label: "Accident", icon: AccidentIcon, color: "#EF4444" },
  { id: "collision", label: "Collision", icon: CollisionIcon, color: "#10B981" },
  { id: "fire", label: "Fire", icon: FireIcon, color: "#DC2626" },
  { id: "hazard", label: "Hazard", icon: HazardIcon, color: "#EAB308" },
  { id: "jam", label: "Jam", icon: JamIcon, color: "#8B5CF6" },
  { id: "medical", label: "Medical", icon: MedicalIcon, color: "#EF4444" },
  { id: "police", label: "Police", icon: PoliceIcon, color: "#3B82F6" },
  { id: "weather", label: "Weather", icon: WeatherIcon, color: "#06B6D4" },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type of Incidents */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Type of Incidents
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {INCIDENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = localFilters.incidentTypes.includes(type.id);
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleIncidentType(type.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/20 ring-2 ring-blue-500"
                        : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className={`transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}>
                      <Icon size={40} />
                    </div>
                    <span className={`text-xs font-medium ${
                      isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                    }`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radius to Monitor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Radius to Monitor
              </h3>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {localFilters.radiusKm === 50 ? "All" : `${localFilters.radiusKm} km`}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={localFilters.radiusKm}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((localFilters.radiusKm - 1) / 49) * 100}%, #E5E7EB ${((localFilters.radiusKm - 1) / 49) * 100}%, #E5E7EB 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>1 KM</span>
                <span>50 KM (All)</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                Set to 50 to show all incidents regardless of distance
              </p>
            </div>
          </div>

          {/* Show Traffic */}
          <div>
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Show Traffic
              </span>
              <button
                type="button"
                onClick={handleTrafficFlowToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localFilters.showTrafficFlow ? "bg-blue-500" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localFilters.showTrafficFlow ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
