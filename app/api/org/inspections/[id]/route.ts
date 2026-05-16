import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  assertInspectionAccess,
  getActiveOrgMember,
} from "@/lib/orgInspectionAuth";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  const { id } = await ctx.params;

  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ sectionIndex: "asc" }, { itemIndex: "asc" }] },
      fleetVehicle: true,
      templateVersion: true,
      attachments: { orderBy: { createdAt: "asc" } },
      driver: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = await assertInspectionAccess({
    userId,
    member,
    inspection,
    needWrite: false,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  return NextResponse.json({ inspection });
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  const { id } = await ctx.params;

  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id },
    select: {
      id: true,
      organizationId: true,
      driverUserId: true,
      status: true,
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = await assertInspectionAccess({
    userId,
    member,
    inspection,
    needWrite: true,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.odometerKm !== undefined) {
    const n = Number(body.odometerKm);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Invalid odometerKm" }, { status: 400 });
    }
    data.odometerKm = n;
  }
  if (body.lat !== undefined) {
    const n = Number(body.lat);
    data.lat = Number.isFinite(n) ? n : null;
  }
  if (body.lng !== undefined) {
    const n = Number(body.lng);
    data.lng = Number.isFinite(n) ? n : null;
  }
  if (body.locationLabel !== undefined) {
    data.locationLabel =
      body.locationLabel === null
        ? null
        : String(body.locationLabel).trim().slice(0, 500) || null;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) {
        await tx.vehicleInspection.update({
          where: { id },
          data,
        });
      }

      const items = body.items;
      if (Array.isArray(items)) {
        for (const raw of items) {
          if (!raw || typeof raw !== "object") continue;
          const row = raw as Record<string, unknown>;
          const itemId = typeof row.id === "string" ? row.id : "";
          if (!itemId) continue;
          const result = String(row.result ?? "");
          if (!["ok", "defect", "na"].includes(result)) {
            throw new Error(`INVALID_RESULT:${itemId}`);
          }
          let severity: string | null =
            row.severity === null || row.severity === undefined
              ? null
              : String(row.severity);
          if (severity && !["minor", "major", "out_of_service"].includes(severity)) {
            throw new Error(`INVALID_SEVERITY:${itemId}`);
          }
          if (result !== "defect") severity = null;

          const owned = await tx.vehicleInspectionItem.findFirst({
            where: { id: itemId, inspectionId: id },
          });
          if (!owned) continue;

          await tx.vehicleInspectionItem.update({
            where: { id: itemId },
            data: {
              result,
              severity,
              defectLabel:
                row.defectLabel === null || row.defectLabel === undefined
                  ? null
                  : String(row.defectLabel).slice(0, 500),
              notes:
                row.notes === null || row.notes === undefined
                  ? null
                  : String(row.notes).slice(0, 4000),
            },
          });
        }
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("INVALID_RESULT") || msg.startsWith("INVALID_SEVERITY")) {
      return NextResponse.json({ error: "Invalid item payload" }, { status: 400 });
    }
    throw e;
  }

  const full = await prisma.vehicleInspection.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ sectionIndex: "asc" }, { itemIndex: "asc" }] },
      fleetVehicle: true,
      templateVersion: true,
      attachments: { orderBy: { createdAt: "asc" } },
      driver: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ inspection: full });
}
