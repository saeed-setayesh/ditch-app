"use client";

import type { LucideIcon } from "lucide-react";
import {
  Ambulance,
  CarFront,
  CircleQuestionMark,
  CloudSun,
  Construction,
  Flame,
  Route,
  Shield,
  TriangleAlert,
  Wrench,
} from "lucide-react";

/** Filterable incident kinds (subset of `IncidentIconType`). */
export type IncidentType =
  | "accident"
  | "collision"
  | "fire"
  | "hazard"
  | "jam"
  | "medical"
  | "police"
  | "weather";

export type IncidentIconType =
  | IncidentType
  | "roadwork"
  | "breakdown"
  | "other";

type IconProps = {
  size?: number;
  className?: string;
};

const STROKE = 2.25;

function makeIcon(Icon: LucideIcon, color: string) {
  return function IncidentIcon({ size = 32, className = "" }: IconProps) {
    const iconPx = Math.round(size * 0.5);
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.14)] ${className}`}
        style={{ width: size, height: size, backgroundColor: color, color: "#ffffff" }}
        aria-hidden
      >
        <Icon className="shrink-0" width={iconPx} height={iconPx} strokeWidth={STROKE} />
      </div>
    );
  };
}

/** Lucide-shaped props — used inside FilterPanel gradient circles (`currentColor` = white). */
export function CollisionGlyph({
  className,
  strokeWidth: _strokeWidth,
  width,
  height,
}: {
  className?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      width={width}
      height={height}
      aria-hidden
    >
      <path
        d="M3 15.5 L6.5 9.5 L11 9 L12.5 14 L11 17.5 H5 Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.8" cy="17.8" r="1.35" fill="currentColor" />
      <circle cx="10.6" cy="17.8" r="1.35" fill="currentColor" />
      <path
        d="M21 8.5 L17.5 14.5 L13 15 L11.5 10 L13 6.5 H19 Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.2" cy="6.8" r="1.35" fill="currentColor" />
      <circle cx="13.4" cy="6.8" r="1.35" fill="currentColor" />
      <path
        d="M11 11.5 L13 13.5 M13 11.5 L11 13.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12.5" r="1.8" fill="currentColor" fillOpacity={0.95} />
    </svg>
  );
}

/** Two-car impact — matches map pin collision glyph style. */
export function CollisionIcon({ size = 32, className = "" }: IconProps) {
  const glyphPx = Math.round(size * 0.52);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.14)] ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "#E63946",
      }}
      aria-hidden
    >
      <CollisionGlyph width={glyphPx} height={glyphPx} className="shrink-0" />
    </div>
  );
}

export const AccidentIcon = makeIcon(CarFront, "#F38A1F");
export const FireIcon = makeIcon(Flame, "#E63946");
export const HazardIcon = makeIcon(TriangleAlert, "#F4C430");
export const JamIcon = makeIcon(Route, "#8C4FCF");
export const MedicalIcon = makeIcon(Ambulance, "#E63946");
export const PoliceIcon = makeIcon(Shield, "#3FA7E6");
export const WeatherIcon = makeIcon(CloudSun, "#28C6C8");
export const RoadworkIcon = makeIcon(Construction, "#F97316");
export const BreakdownIcon = makeIcon(Wrench, "#F59E0B");
export const OtherIcon = makeIcon(CircleQuestionMark, "#6B7280");

export function getIconType(iconCategory: number): IncidentIconType {
  switch (iconCategory) {
    case 1:
      return "collision";
    case 2:
    case 3:
    case 4:
    case 8:
      return "hazard";
    case 5:
    case 7:
    case 9:
      return "roadwork";
    case 6:
      return "jam";
    case 10:
      return "weather";
    case 11:
    case 14:
      return "breakdown";
    default:
      return "other";
  }
}

export function getIconComponent(type: IncidentIconType) {
  switch (type) {
    case "accident":
      return AccidentIcon;
    case "collision":
      return CollisionIcon;
    case "fire":
      return FireIcon;
    case "hazard":
      return HazardIcon;
    case "jam":
      return JamIcon;
    case "medical":
      return MedicalIcon;
    case "police":
      return PoliceIcon;
    case "weather":
      return WeatherIcon;
    case "roadwork":
      return RoadworkIcon;
    case "breakdown":
      return BreakdownIcon;
    default:
      return OtherIcon;
  }
}

export function getIconColor(type: IncidentIconType): string {
  switch (type) {
    case "accident":
      return "#F38A1F";
    case "collision":
      return "#E63946";
    case "fire":
      return "#E63946";
    case "hazard":
      return "#F4C430";
    case "jam":
      return "#8C4FCF";
    case "medical":
      return "#E63946";
    case "police":
      return "#3FA7E6";
    case "weather":
      return "#28C6C8";
    case "roadwork":
      return "#F97316";
    case "breakdown":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
}
