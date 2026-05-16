import type { IncidentType } from "@/components/IncidentIcons";

/**
 * Map overlay filters (FilterPanel) vs TomTom icon categories.
 * Crash-like category 1 matches either "accident" or "collision" chip (same underlying incidents).
 */
export function categoryMatchesDriverFilters(
  iconCategory: number,
  selectedTypes: readonly IncidentType[],
): boolean {
  if (selectedTypes.length === 0) return false;

  if (iconCategory === 1) {
    return (
      selectedTypes.includes("accident") || selectedTypes.includes("collision")
    );
  }

  const kind = filterKindForCategory(iconCategory);
  return selectedTypes.includes(kind);
}

function filterKindForCategory(iconCategory: number): IncidentType {
  switch (iconCategory) {
    case 2:
    case 3:
    case 4:
    case 8:
    case 5:
    case 7:
    case 9:
      return "hazard";
    case 6:
      return "jam";
    case 10:
      return "weather";
    case 11:
    case 14:
      return "accident";
    default:
      return "hazard";
  }
}
