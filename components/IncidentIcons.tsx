"use client";

export type IncidentIconType = 
  | "accident" 
  | "collision" 
  | "fire" 
  | "hazard" 
  | "jam" 
  | "medical" 
  | "police" 
  | "weather" 
  | "roadwork"
  | "breakdown"
  | "other";

type IconProps = {
  size?: number;
  className?: string;
};

export function AccidentIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#EF4444" />
      <path
        d="M12 10 L20 10 L22 16 L20 22 L12 22 L10 16 Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="13.5" cy="18" r="2" fill="#EF4444" />
      <circle cx="18.5" cy="18" r="2" fill="#EF4444" />
      <path d="M11 14 L21 14" stroke="#EF4444" strokeWidth="1.5" />
    </svg>
  );
}

export function CollisionIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#10B981" />
      <path
        d="M10 16 L13 12 L16 14 L19 12 L22 16 L19 20 L16 18 L13 20 Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="#10B981" />
    </svg>
  );
}

export function FireIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#DC2626" />
      <path
        d="M16 8 C14 12, 12 14, 12 17 C12 20, 13.5 22, 16 22 C18.5 22, 20 20, 20 17 C20 14, 18 12, 16 8 Z"
        fill="white"
      />
      <path
        d="M16 12 C15 14, 14 15, 14 17 C14 18.5, 14.8 20, 16 20 C17.2 20, 18 18.5, 18 17 C18 15, 17 14, 16 12 Z"
        fill="#DC2626"
      />
    </svg>
  );
}

export function HazardIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#EAB308" />
      <path
        d="M16 6 L26 24 L6 24 Z"
        fill="white"
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M16 12 L16 17"
        stroke="#EAB308"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="20" r="1" fill="#EAB308" />
    </svg>
  );
}

export function JamIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#8B5CF6" />
      <g fill="white">
        <rect x="8" y="10" width="5" height="8" rx="1" />
        <circle cx="9.5" cy="20" r="1.5" />
        <circle cx="11.5" cy="20" r="1.5" />
        
        <rect x="14" y="13" width="5" height="8" rx="1" />
        <circle cx="15.5" cy="23" r="1.5" />
        <circle cx="17.5" cy="23" r="1.5" />
        
        <rect x="20" y="11" width="5" height="8" rx="1" />
        <circle cx="21.5" cy="21" r="1.5" />
        <circle cx="23.5" cy="21" r="1.5" />
      </g>
    </svg>
  );
}

export function MedicalIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#EF4444" />
      <path
        d="M16 9 L16 23 M9 16 L23 16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PoliceIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#3B82F6" />
      <path
        d="M16 8 L12 11 L12 18 C12 21, 14 23, 16 24 C18 23, 20 21, 20 18 L20 11 Z"
        fill="white"
        stroke="white"
        strokeWidth="1"
      />
      <path
        d="M14 14 L15 17 L18 13"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function WeatherIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#06B6D4" />
      <ellipse cx="14" cy="13" rx="5" ry="3" fill="white" />
      <ellipse cx="18" cy="13" rx="5" ry="3.5" fill="white" />
      <path
        d="M11 18 L12 21 M15 18 L16 21 M19 18 L20 21"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RoadworkIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F97316" />
      <path
        d="M16 7 L24 22 L8 22 Z"
        fill="white"
        stroke="white"
        strokeWidth="1"
      />
      <path
        d="M13 15 L19 15 M14 18 L18 18"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BreakdownIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F59E0B" />
      <path
        d="M10 13 L18 13 L20 17 L18 21 L10 21 L8 17 Z"
        fill="white"
        stroke="white"
        strokeWidth="1"
      />
      <circle cx="11.5" cy="19" r="1.5" fill="#F59E0B" />
      <circle cx="16.5" cy="19" r="1.5" fill="#F59E0B" />
      <path
        d="M20 10 L24 14 L24 18 L22 20"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function OtherIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx="16" cy="16" r="16" fill="#6B7280" />
      <circle cx="16" cy="16" r="6" fill="white" />
      <circle cx="16" cy="16" r="2" fill="#6B7280" />
    </svg>
  );
}

// Map icon category numbers to icon types
export function getIconType(iconCategory: number): IncidentIconType {
  switch (iconCategory) {
    case 1: return "accident";
    case 2: return "hazard";
    case 3: return "hazard";
    case 4: return "hazard";
    case 5: return "roadwork";
    case 6: return "jam";
    case 7: return "roadwork";
    case 8: return "hazard";
    case 9: return "roadwork";
    case 10: return "weather";
    case 11: return "breakdown";
    case 14: return "breakdown";
    default: return "other";
  }
}

// Get icon component by type
export function getIconComponent(type: IncidentIconType) {
  switch (type) {
    case "accident": return AccidentIcon;
    case "collision": return CollisionIcon;
    case "fire": return FireIcon;
    case "hazard": return HazardIcon;
    case "jam": return JamIcon;
    case "medical": return MedicalIcon;
    case "police": return PoliceIcon;
    case "weather": return WeatherIcon;
    case "roadwork": return RoadworkIcon;
    case "breakdown": return BreakdownIcon;
    default: return OtherIcon;
  }
}

// Get icon color by type
export function getIconColor(type: IncidentIconType): string {
  switch (type) {
    case "accident": return "#EF4444";
    case "collision": return "#10B981";
    case "fire": return "#DC2626";
    case "hazard": return "#EAB308";
    case "jam": return "#8B5CF6";
    case "medical": return "#EF4444";
    case "police": return "#3B82F6";
    case "weather": return "#06B6D4";
    case "roadwork": return "#F97316";
    case "breakdown": return "#F59E0B";
    default: return "#6B7280";
  }
}
