/**
 * INRIX Safety Alerts API - Traffic incidents
 * Docs: https://docs.inrix.com/traffic/incidents/
 * Auth: https://docs.inrix.com/authentication/getting_authorized/
 *
 * Requires INRIX_APP_ID and INRIX_APP_KEY in env.
 * Sign up: https://iq.inrix.com/ (free trial, then paid)
 */

import { createHash } from "crypto";

const UAS_URL = "https://uas-api.inrix.com/v1/appToken";
const INCIDENTS_URL = "https://incident-api.inrix.com/v1/incidents";

let cachedToken: { token: string; expiry: Date } | null = null;

function getAppCredentials(): { appId: string; appKey: string } | null {
  const appId = process.env.INRIX_APP_ID;
  const appKey = process.env.INRIX_APP_KEY;
  if (!appId || !appKey) return null;
  return { appId, appKey };
}

async function getAccessToken(): Promise<string | null> {
  const creds = getAppCredentials();
  if (!creds) return null;

  // Use cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiry.getTime() - Date.now() > 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const str = `${creds.appId}|${creds.appKey}`.toLowerCase();
  const hashToken = createHash("sha1").update(str, "utf8").digest("hex");

  const url = `${UAS_URL}?appId=${encodeURIComponent(creds.appId)}&hashToken=${hashToken}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    console.warn("INRIX appToken failed:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    result?: { token?: string; expiry?: string };
  };
  const token = data.result?.token;
  const expiry = data.result?.expiry;
  if (!token || !expiry) return null;

  cachedToken = { token, expiry: new Date(expiry) };
  return token;
}

/** Convert our bbox (minLon,minLat,maxLon,maxLat) to INRIX format: lat1|lng1,lat2|lng2 (NW,SE) */
function bboxToInrixBox(bbox: string): string {
  const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
  const nwLat = maxLat;
  const nwLng = minLon;
  const seLat = minLat;
  const seLng = maxLon;
  return `${nwLat}|${nwLng},${seLat}|${seLng}`;
}

export type InrixIncident = {
  id: number;
  type: string | number; // "1"=Construction, "2"=Events, "3"=Flow, "4"=Crashes/Hazards
  severity?: number;
  status?: string;
  geometry?: { type: string; coordinates: [number, number] };
  descriptions?: { type: string; lang: string; desc: string }[];
  parameterizedDescription?: { roadName?: string; crossroad1?: string; crossroad2?: string; eventText?: string };
  schedule?: { occurrenceStartTime?: string; occurrenceEndTime?: string };
};

export type InrixIncidentsResponse = {
  result?: { incidents?: InrixIncident[] };
};

export async function fetchInrixIncidents(bbox: string): Promise<InrixIncident[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const box = bboxToInrixBox(bbox);
  const params = new URLSearchParams({
    box,
    incidentType: "Incidents,Construction,Events,Flow",
    incidentoutputfields: "Core,Location,ShortDescription,Schedule",
    status: "Active",
    units: "1", // metric
  });

  const url = `${INCIDENTS_URL}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn("INRIX incidents API failed:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as InrixIncidentsResponse;
  const incidents = data.result?.incidents ?? [];
  return incidents;
}

export function isInrixConfigured(): boolean {
  return getAppCredentials() !== null;
}
