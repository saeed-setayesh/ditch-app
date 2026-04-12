import { getDefaultCity } from "./cities";

// TomTom expects outer braces and no URL-encoding of the fields value
const INCIDENT_FIELDS =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,events{description},from,to,magnitudeOfDelay,startTime,endTime,lastReportTime}}}";

export type TomTomIncident = {
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
  properties: {
    id?: string;
    iconCategory: number;
    events?: Array<{ description: string }>;
    from?: string;
    to?: string;
    magnitudeOfDelay?: number;
    startTime?: string;
    endTime?: string;
    lastReportTime?: string;
  };
};

export type NormalizedIncident = {
  id: string;
  coordinates: [number, number];
  description: string;
  iconCategory: number;
  from?: string;
  to?: string;
  magnitudeOfDelay?: number;
  startTime?: string;
  endTime?: string;
  lastReportTime?: string;
  status?: "active" | "likely_cleared";
  confidence?: "high" | "medium" | "low";
};

function getApiKey(): string {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY is not set");
  return key;
}

import { incidentCenter as getIncidentCenter } from "./geo";

export async function fetchIncidentDetails(
  bbox?: string,
  trafficModelId?: string
): Promise<{ incidents: TomTomIncident[]; trafficModelId: string | null }> {
  const key = getApiKey();
  const useBbox = bbox ?? getDefaultCity().bbox;
  const params = new URLSearchParams({
    key,
    bbox: useBbox,
    language: "en-GB",
    timeValidityFilter: "present",
  });
  if (trafficModelId) params.set("t", trafficModelId);
  // TomTom requires 'fields' with literal braces (no encoding)
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?${params.toString()}&fields=${INCIDENT_FIELDS}`;
  const res = await fetch(url, {
    headers: { "Accept-Encoding": "gzip" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TomTom API error ${res.status}: ${text}`);
  }

  const trafficModelIdHeader = res.headers.get("TrafficModelID") ?? null;
  const data = (await res.json()) as { incidents?: TomTomIncident[] };
  const incidents = data.incidents ?? [];

  return { incidents, trafficModelId: trafficModelIdHeader };
}

export function normalizeIncidents(incidents: TomTomIncident[]): NormalizedIncident[] {
  const normalized: NormalizedIncident[] = [];

  for (const inc of incidents) {
    const coords = getIncidentCenter(inc.geometry);
    if (!coords) continue;

    const [lng, lat] = coords;
    const desc =
      inc.properties.events?.[0]?.description ??
      iconCategoryLabel(inc.properties.iconCategory);
    const id =
      inc.properties.id ??
      `${lat.toFixed(5)}_${lng.toFixed(5)}_${inc.properties.iconCategory}`;

    const endTime = inc.properties.endTime
      ? new Date(inc.properties.endTime).getTime()
      : null;
    const now = Date.now();
    const status: "active" | "likely_cleared" =
      endTime == null || endTime > now ? "active" : "likely_cleared";

    const lastReport = inc.properties.lastReportTime
      ? new Date(inc.properties.lastReportTime).getTime()
      : null;
    const ageMinutes = lastReport != null ? (now - lastReport) / 60000 : null;
    let confidence: "high" | "medium" | "low" = "medium";
    if (ageMinutes != null) {
      if (ageMinutes <= 15) confidence = "high";
      else if (ageMinutes > 60) confidence = "low";
    }

    normalized.push({
      id,
      coordinates: [lng, lat],
      description: desc,
      iconCategory: inc.properties.iconCategory,
      from: inc.properties.from,
      to: inc.properties.to,
      magnitudeOfDelay: inc.properties.magnitudeOfDelay,
      startTime: inc.properties.startTime,
      endTime: inc.properties.endTime,
      lastReportTime: inc.properties.lastReportTime,
      status,
      confidence,
    });
  }

  return normalized;
}

export function iconCategoryLabel(cat: number): string {
  const labels: Record<number, string> = {
    0: "Unknown",
    1: "Accident",
    2: "Fog",
    3: "Dangerous conditions",
    4: "Rain",
    5: "Ice",
    6: "Jam",
    7: "Lane closed",
    8: "Road closed",
    9: "Road works",
    10: "Wind",
    11: "Flooding",
    14: "Broken down vehicle",
  };
  return labels[cat] ?? "Incident";
}
