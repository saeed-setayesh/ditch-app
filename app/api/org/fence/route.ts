import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

function isFeatureCollection(o: unknown): boolean {
  if (!o || typeof o !== "object") return false;
  const gg = o as { type?: string; features?: unknown };
  return (
    gg.type === "FeatureCollection" && Array.isArray(gg.features)
  );
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await prisma.organizationMember.findFirst({
    where: { userId, seatActive: true },
    include: {
      organization: {
        include: { serviceArea: true },
      },
    },
  });
  if (!member) {
    return NextResponse.json({ geoJson: null });
  }
  return NextResponse.json({
    geoJson: member.organization.serviceArea?.geoJson ?? null,
  });
}

export async function PUT(request: NextRequest) {
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

  const member = await prisma.organizationMember.findFirst({
    where: { userId, role: "admin", seatActive: true },
    select: { organizationId: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const geoJson = (body as { geoJson?: unknown }).geoJson;
  if (!isFeatureCollection(geoJson)) {
    return NextResponse.json(
      { error: "geoJson must be a GeoJSON FeatureCollection" },
      { status: 400 },
    );
  }

  await prisma.organizationServiceArea.upsert({
    where: { organizationId: member.organizationId },
    create: {
      organizationId: member.organizationId,
      geoJson: geoJson as object,
    },
    update: {
      geoJson: geoJson as object,
    },
  });

  return NextResponse.json({ ok: true });
}
