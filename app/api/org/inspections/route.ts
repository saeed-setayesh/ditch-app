import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getActiveOrgMember } from "@/lib/orgInspectionAuth";
import { resolveTemplateVersionForVehicle } from "@/lib/inspection/templateResolution";
import { ensureDefaultInspectionTemplate } from "@/lib/inspection/defaultOrgInspectionTemplate";
import { isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const url = new URL(request.url);
  const mineOnly = url.searchParams.get("mine") === "1";
  const statusFilter = url.searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = {
    organizationId: member.organizationId,
  };
  if (member.role !== "admin") {
    where.driverUserId = userId;
  } else if (mineOnly) {
    where.driverUserId = userId;
  }
  if (statusFilter === "draft" || statusFilter === "finalized") {
    where.status = statusFilter;
  }

  const inspections = await prisma.vehicleInspection.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 100,
    select: {
      id: true,
      kind: true,
      status: true,
      startedAt: true,
      finalizedAt: true,
      overallSeverity: true,
      odometerKm: true,
      fleetVehicle: { select: { unitNumber: true, vehicleType: true } },
      driver: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ inspections });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fleetVehicleId = String(body.fleetVehicleId ?? "").trim();
  const kindRaw = String(body.kind ?? "PRE_TRIP").toUpperCase();
  const kind = kindRaw === "POST_TRIP" ? "POST_TRIP" : "PRE_TRIP";

  if (!fleetVehicleId) {
    return NextResponse.json({ error: "fleetVehicleId required" }, { status: 400 });
  }

  const vehicle = await prisma.fleetVehicle.findFirst({
    where: {
      id: fleetVehicleId,
      organizationId: member.organizationId,
      active: true,
    },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  let resolved = await resolveTemplateVersionForVehicle({
    organizationId: member.organizationId,
    fleetVehicleId,
  });

  if (!resolved) {
    const seeded = await ensureDefaultInspectionTemplate(member.organizationId);
    if (seeded) {
      resolved = seeded;
    }
  }

  if (!resolved) {
    return NextResponse.json(
      {
        error:
          "No inspection template configured. Create a template in Company hub → Inspection templates, or assign a default checklist version on each vehicle.",
      },
      { status: 400 },
    );
  }

  const { versionId, schema } = resolved;
  if (!isChecklistSchemaV1(schema)) {
    return NextResponse.json({ error: "Invalid stored checklist schema" }, { status: 500 });
  }

  const inspection = await prisma.$transaction(async (tx) => {
    const insp = await tx.vehicleInspection.create({
      data: {
        organizationId: member.organizationId,
        fleetVehicleId,
        driverUserId: userId,
        kind,
        templateVersionId: versionId,
        status: "draft",
      },
    });

    for (let si = 0; si < schema.sections.length; si++) {
      const sec = schema.sections[si];
      for (let ii = 0; ii < sec.items.length; ii++) {
        const it = sec.items[ii];
        const itemKey = it.id || `sec${si}-it${ii}`;
        await tx.vehicleInspectionItem.create({
          data: {
            inspectionId: insp.id,
            itemKey,
            sectionIndex: si,
            itemIndex: ii,
            result: "ok",
          },
        });
      }
    }

    return insp;
  });

  const full = await prisma.vehicleInspection.findUnique({
    where: { id: inspection.id },
    include: {
      items: { orderBy: [{ sectionIndex: "asc" }, { itemIndex: "asc" }] },
      fleetVehicle: true,
      templateVersion: true,
      attachments: true,
    },
  });

  return NextResponse.json({ inspection: full });
}
