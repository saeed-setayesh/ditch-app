import { NextRequest, NextResponse } from "next/server";
import { fetchIncidentDetails, normalizeIncidents, type NormalizedIncident } from "@/lib/tomtom";
import { computeTowScore } from "@/lib/scoring";
import { getCityById, getDefaultCity } from "@/lib/cities";
import { prisma } from "@/lib/db";
import { fetchOntario511Incidents } from "@/lib/ontario511";
import { fetchInrixIncidents } from "@/lib/inrix";
import { haversineKm } from "@/lib/geo";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type IncidentWithScore = NormalizedIncident & {
  towScore: number;
  towLabel: "High" | "Medium" | "Low";
  sources?: string[];
};

export async function GET(request: NextRequest) {
  try {
    const cityId = request.nextUrl.searchParams.get("city");
    const minScoreParam = request.nextUrl.searchParams.get("minScore");
    const minScore = minScoreParam != null ? parseInt(minScoreParam, 10) : null;
    const deviceId = request.nextUrl.searchParams.get("deviceId");

    const city = cityId ? getCityById(cityId) : getDefaultCity();
    const bbox = city?.bbox ?? getDefaultCity().bbox;
    // Determine preferred incident sources via session or deviceId
    const userId = await getSessionUserId();
    let sources: string[] = ["tomtom"];
    try {
      let pref: { incidentSources: string | null } | null = null;
      if (userId) {
        pref = await prisma.pushSubscription.findFirst({
          where: { userId },
          select: { incidentSources: true },
        });
      }
      if (!pref && deviceId) {
        pref = await prisma.pushSubscription.findFirst({
          where: { deviceId },
          select: { incidentSources: true },
        });
      }
      if (pref?.incidentSources) {
        sources = pref.incidentSources.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      // ignore and fallback to tomtom
    }

    // Fetch incidents from selected sources and merge them, preferring TomTom fields when duplicates.
    const rawFromTomtom: NormalizedIncident[] = [];
    const rawFrom511: NormalizedIncident[] = [];
    const rawFromInrix: NormalizedIncident[] = [];

    if (sources.includes("tomtom")) {
      const { incidents } = await fetchIncidentDetails(bbox);
      rawFromTomtom.push(...normalizeIncidents(incidents));
    }
    if (sources.includes("inrix")) {
      try {
        const listInrix = await fetchInrixIncidents(bbox);
        const mappedInrix: NormalizedIncident[] = listInrix
          .filter((it) => it.geometry?.coordinates?.length === 2)
          .map((it) => {
            const [lng, lat] = it.geometry!.coordinates;
            const t = Number(it.type);
            let iconCategory = 0;
            if (t === 4) iconCategory = 1; // Crashes/Hazards -> accident
            else if (t === 3) iconCategory = 6; // Flow -> jam
            else if (t === 1) iconCategory = 9; // Construction
            else if (t === 2) iconCategory = 8; // Events -> closure
            const desc =
              (it.descriptions?.find((d) => d.type === "short")?.desc) ??
              it.parameterizedDescription?.eventText ??
              it.parameterizedDescription?.roadName ??
              "Incident";
            const startTime = it.schedule?.occurrenceStartTime;
            const endTime = it.schedule?.occurrenceEndTime;
            return {
              id: `inrix-${it.id}`,
              coordinates: [lng, lat],
              description: desc,
              iconCategory,
              from: it.parameterizedDescription?.crossroad1,
              to: it.parameterizedDescription?.crossroad2,
              magnitudeOfDelay: undefined,
              startTime,
              endTime,
              lastReportTime: startTime,
              status: it.status === "active" ? "active" : "likely_cleared",
              confidence: "high" as const,
            } as NormalizedIncident;
          });
        rawFromInrix.push(...mappedInrix);
      } catch (e) {
        console.warn("Failed to fetch INRIX incidents:", e);
      }
    }
    if (sources.includes("511on")) {
      try {
        const list511 = await fetchOntario511Incidents(bbox);
        const mapped511: NormalizedIncident[] = list511.map((it) => {
          const lat = Number(it.Latitude);
          const lng = Number(it.Longitude);
          // Map Ontario 511 EventType to our iconCategory
          const et = String(it.EventType ?? "").toLowerCase();
          let iconCategory = 0;
          if (et.includes("accident") || et.includes("incident")) iconCategory = 1;
          else if (et.includes("roadwork")) iconCategory = 9;
          else if (et.includes("closure") || et.includes("closed")) iconCategory = 8;
          else if (et.includes("weather") || et.includes("fog") || et.includes("rain") || et.includes("ice")) iconCategory = 4;
          // convert unix timestamps if present
          const startTime = it.StartDate ? new Date(Number(it.StartDate) * 1000).toISOString() : it.Updated ?? undefined;
          const lastReport = it.LastUpdated ? new Date(Number(it.LastUpdated) * 1000).toISOString() : it.Updated ?? undefined;
          return {
            id: `511-${it.ID ?? it.Id}`,
            coordinates: [lng, lat],
            description: it.Description ?? it.Location ?? it.Roadway ?? "Incident",
            iconCategory,
            from: undefined,
            to: undefined,
            magnitudeOfDelay: undefined,
            startTime: startTime,
            endTime: undefined,
            lastReportTime: lastReport,
            status: "active",
            confidence: "medium",
          } as NormalizedIncident;
        });
        rawFrom511.push(...mapped511);
      } catch (e) {
        console.warn("Failed to fetch Ontario 511 incidents:", e);
      }
    }

    // Merge by proximity (100m) / id. Build a map keyed by canonical id.
    const dedupeRadiusKm = 0.1; // 100 meters
    type Merged = NormalizedIncident & { sources?: string[] };
    const merged: Merged[] = [];

    const addOrMerge = (inc: NormalizedIncident, sourceLabel: string) => {
      const [lng, lat] = inc.coordinates;
      // find existing by same external id or by proximity
      let found = merged.find((m) => {
        if (m.id && inc.id && m.id === inc.id) return true;
        const [mlng, mlat] = m.coordinates;
        return haversineKm(lat, lng, mlat, mlng) <= dedupeRadiusKm;
      });
      if (!found) {
        const copy: Merged = { ...inc, sources: [sourceLabel] };
        merged.push(copy);
      } else {
        // merge fields: prefer existing (TomTom) values, but fill gaps from other source
        found.sources = Array.from(new Set([...(found.sources ?? []), sourceLabel]));
        // prefer non-empty description
        if ((!found.description || found.description === "") && inc.description) found.description = inc.description;
        if ((!found.from || found.from === "") && inc.from) found.from = inc.from;
        if ((!found.to || found.to === "") && inc.to) found.to = inc.to;
        if (!found.magnitudeOfDelay && inc.magnitudeOfDelay) found.magnitudeOfDelay = inc.magnitudeOfDelay;
        // prefer earlier startTime if available
        if (!found.startTime && inc.startTime) found.startTime = inc.startTime;
        if (!found.lastReportTime && inc.lastReportTime) found.lastReportTime = inc.lastReportTime;
      }
    };

    for (const t of rawFromTomtom) addOrMerge(t, "tomtom");
    for (const i of rawFromInrix) addOrMerge(i, "inrix");
    for (const o of rawFrom511) addOrMerge(o, "511on");

    const normalized = merged as NormalizedIncident[];

    const withScores: IncidentWithScore[] = normalized.map((inc) => {
      const { towScore, towLabel } = computeTowScore({
        iconCategory: inc.iconCategory,
        magnitudeOfDelay: inc.magnitudeOfDelay,
        from: inc.from,
        to: inc.to,
        startTime: inc.startTime,
      });
      const sources = (inc as any).sources ?? ["tomtom"];
      return { ...inc, towScore, towLabel, sources };
    });

    const filtered =
      minScore != null && Number.isFinite(minScore)
        ? withScores.filter((i) => i.towScore >= minScore)
        : withScores;

    const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - TWENTY_FOUR_H_MS;
    const recentWindow = filtered.filter((inc) => {
      const t = inc.lastReportTime ?? inc.startTime;
      if (!t) return true;
      return new Date(t).getTime() >= cutoff;
    });

    // Sort by newest first (lastReportTime or startTime), then by towScore
    const getIncidentTime = (inc: IncidentWithScore): number => {
      const t = inc.lastReportTime ?? inc.startTime;
      return t ? new Date(t).getTime() : 0;
    };
    const sorted = [...recentWindow].sort((a, b) => {
      const timeA = getIncidentTime(a);
      const timeB = getIncidentTime(b);
      if (timeB !== timeA) return timeB - timeA; // newest first
      return b.towScore - a.towScore; // then by severity
    });
    return NextResponse.json({
      incidents: sorted,
      city: city?.name ?? getDefaultCity().name,
    });
  } catch (e) {
    console.error("Incidents API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
