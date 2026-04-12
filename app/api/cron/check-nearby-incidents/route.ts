import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchIncidentDetails, normalizeIncidents, iconCategoryLabel } from "@/lib/tomtom";
import { computeTowScore } from "@/lib/scoring";
import { sendPushNotification } from "@/lib/push";
import { haversineKm } from "@/lib/geo";
import { getDefaultCity } from "@/lib/cities";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function inQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const nowM = now.getHours() * 60 + now.getMinutes();
  let startM = sh * 60 + sm;
  let endM = eh * 60 + em;
  if (startM <= endM) return nowM >= startM && nowM < endM;
  return nowM >= startM || nowM < endM;
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "")
    ?? request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const city = getDefaultCity();
    const { incidents: rawIncidents } = await fetchIncidentDetails(city.bbox);
    const normalized = normalizeIncidents(rawIncidents);

    // Persist snapshots for history/heatmap
    await prisma.incidentSnapshot.createMany({
      data: normalized.map((inc) => {
        const [lng, lat] = inc.coordinates;
        return {
          externalId: inc.id,
          lat,
          lng,
          city: city.name,
          iconCategory: inc.iconCategory,
          magnitudeOfDelay: inc.magnitudeOfDelay ?? null,
          description: inc.description,
          from_: inc.from ?? null,
          to_: inc.to ?? null,
          startTime: inc.startTime ? new Date(inc.startTime) : null,
          endTime: inc.endTime ? new Date(inc.endTime) : null,
        };
      }),
      skipDuplicates: true,
    });

    const incidents = normalized.map((inc) => {
      const { towScore, towLabel } = computeTowScore({
        iconCategory: inc.iconCategory,
        magnitudeOfDelay: inc.magnitudeOfDelay,
        from: inc.from,
        to: inc.to,
        startTime: inc.startTime,
      });
      return { ...inc, towScore, towLabel };
    });

    const subs = await prisma.pushSubscription.findMany({
      where: {
        lastLat: { not: null },
        lastLng: { not: null },
        NOT: { endpoint: { startsWith: "preferences:" } },
      },
    });

    let sent = 0;
    for (const sub of subs) {
      if (inQuietHours(sub.quietHoursStart, sub.quietHoursEnd)) continue;

      const lat = sub.lastLat!;
      const lng = sub.lastLng!;
      const radiusKm = sub.radiusKm ?? 2;
      const typeFilter = sub.incidentTypeFilter
        ? new Set(sub.incidentTypeFilter.split(",").map((s) => parseInt(s.trim(), 10)))
        : null;
      const severityMin = sub.severityMin ?? null;
      const minTowScore = sub.minTowScore ?? null;

      for (const inc of incidents) {
        if (typeFilter != null && !typeFilter.has(inc.iconCategory)) continue;
        if (severityMin != null && (inc.magnitudeOfDelay ?? 0) < severityMin) continue;
        if (minTowScore != null && inc.towScore < minTowScore) continue;

        const [incLng, incLat] = inc.coordinates;
        const distanceKm = haversineKm(lat, lng, incLat, incLng);
        if (distanceKm > radiusKm) continue;

        const existing = await prisma.notificationLog.findUnique({
          where: {
            subscriptionId_incidentId: {
              subscriptionId: sub.id,
              incidentId: inc.id,
            },
          },
        });
        if (existing) continue;

        const label = iconCategoryLabel(inc.iconCategory);
        const road = inc.from || inc.to || "nearby";
        const title = `${label} ${distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(1)} km`} away`;
        const body = `${inc.description} — ${road}`;

        const ok = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title, body, url: "/" }
        );
        if (ok) {
          await prisma.notificationLog.create({
            data: {
              subscriptionId: sub.id,
              incidentId: inc.id,
            },
          });
          sent++;
        }
      }
    }

    return NextResponse.json({ ok: true, incidents: incidents.length, subscriptions: subs.length, sent });
  } catch (e) {
    console.error("Cron check-nearby-incidents error:", e);
    return NextResponse.json(
      { error: "Cron failed" },
      { status: 500 }
    );
  }
}
