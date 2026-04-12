export type IncidentForScoring = {
  iconCategory: number;
  magnitudeOfDelay?: number;
  from?: string;
  to?: string;
  startTime?: string;
};

const HIGHWAY_KEYWORDS = [
  "highway",
  "401",
  "400",
  "404",
  "427",
  "dvp",
  "don valley",
  "gardiner",
  "qew",
  "highway",
];

function isHighway(from?: string, to?: string): boolean {
  const text = [from, to].filter(Boolean).join(" ").toLowerCase();
  return HIGHWAY_KEYWORDS.some((k) => text.includes(k));
}

function isRushHour(date: Date): boolean {
  const h = date.getHours();
  const d = date.getDay();
  const isWeekday = d >= 1 && d <= 5;
  const morningRush = h >= 6 && h <= 9;
  const eveningRush = h >= 16 && h <= 19;
  return isWeekday && (morningRush || eveningRush);
}

/**
 * Tow-likelihood score 0–100 and label.
 * Accident (1), road closed (8), broken down (14) = higher; jam (6) etc = lower.
 * magnitudeOfDelay (major = higher). Highway from/to = higher. Rush hour = higher.
 */
export function computeTowScore(
  incident: IncidentForScoring,
  options?: { timeOfDay?: Date; historicalCount?: number }
): { towScore: number; towLabel: "High" | "Medium" | "Low" } {
  let score = 0;
  const now = options?.timeOfDay ?? new Date();

  // Icon category: accident = 40, road closed / broken down = 25, lane closed / road works = 15, jam = 10, rest = 5
  switch (incident.iconCategory) {
    case 1:
      score += 40;
      break;
    case 8:
    case 14:
      score += 25;
      break;
    case 7:
    case 9:
      score += 15;
      break;
    case 6:
      score += 10;
      break;
    default:
      score += 5;
  }

  // Magnitude of delay: 4 (undefined/closure) = 20, 3 (major) = 15, 2 = 10, 1 = 5
  const mag = incident.magnitudeOfDelay ?? 0;
  if (mag >= 4) score += 20;
  else if (mag === 3) score += 15;
  else if (mag === 2) score += 10;
  else if (mag === 1) score += 5;

  // Highway: +15
  if (isHighway(incident.from, incident.to)) score += 15;

  // Rush hour: +10
  if (isRushHour(now)) score += 10;

  // Historical bonus (optional): cap +10
  if (options?.historicalCount != null && options.historicalCount > 0) {
    score += Math.min(10, Math.floor(options.historicalCount / 2));
  }

  const towScore = Math.min(100, Math.round(score));
  let towLabel: "High" | "Medium" | "Low" = "Low";
  if (towScore >= 60) towLabel = "High";
  else if (towScore >= 35) towLabel = "Medium";

  return { towScore, towLabel };
}
