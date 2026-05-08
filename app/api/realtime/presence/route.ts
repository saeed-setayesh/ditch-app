import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { orgPeerUserIds } from "@/lib/social/orgPeers";

export const dynamic = "force-dynamic";

function validLat(lat: unknown): lat is number {
  return typeof lat === "number" && lat >= -90 && lat <= 90;
}
function validLng(lng: unknown): lng is number {
  return typeof lng === "number" && lng >= -180 && lng <= 180;
}

/** Upsert this driver’s last known coordinates (polled from the client). */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { lat, lng } = body as { lat?: unknown; lng?: unknown };
  if (!validLat(lat) || !validLng(lng)) {
    return NextResponse.json({ error: "lat/lng invalid" }, { status: 400 });
  }

  await prisma.driverPresence.upsert({
    where: { userId },
    create: { userId, lat, lng },
    update: { lat, lng },
  });
  return NextResponse.json({ ok: true });
}

/** List recent coordinates for seated teammates in the same org. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const peers = await orgPeerUserIds(userId);
  if (peers.length === 0) {
    return NextResponse.json({ peers: [] });
  }

  const rows = await prisma.driverPresence.findMany({
    where: { userId: { in: peers } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    peers: rows.map((r) => ({
      userId: r.userId,
      lat: r.lat,
      lng: r.lng,
      updatedAt: r.updatedAt.toISOString(),
      user: r.user,
    })),
  });
}
