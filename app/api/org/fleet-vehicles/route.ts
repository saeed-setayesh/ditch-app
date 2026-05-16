import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  getActiveOrgMember,
  requireOrgAdmin,
} from "@/lib/orgInspectionAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const vehicles = await prisma.fleetVehicle.findMany({
    where: { organizationId: member.organizationId },
    orderBy: { unitNumber: "asc" },
    include: {
      defaultInspectionTemplateVersion: {
        select: {
          id: true,
          version: true,
          template: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!requireOrgAdmin(member)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const unitNumber = String(body.unitNumber ?? "").trim();
  if (!unitNumber) {
    return NextResponse.json({ error: "unitNumber required" }, { status: 400 });
  }

  const vehicleType = String(body.vehicleType ?? "truck").trim() || "truck";
  const plate = body.plate != null ? String(body.plate).trim() || null : null;
  const vin = body.vin != null ? String(body.vin).trim() || null : null;
  const notes = body.notes != null ? String(body.notes).trim() || null : null;
  const active = body.active !== false;
  const defaultInspectionTemplateVersionId =
    typeof body.defaultInspectionTemplateVersionId === "string"
      ? body.defaultInspectionTemplateVersionId.trim() || null
      : null;

  if (defaultInspectionTemplateVersionId) {
    const ver = await prisma.inspectionTemplateVersion.findFirst({
      where: {
        id: defaultInspectionTemplateVersionId,
        template: { organizationId: member.organizationId },
      },
    });
    if (!ver) {
      return NextResponse.json({ error: "Invalid template version" }, { status: 400 });
    }
  }

  try {
    const vehicle = await prisma.fleetVehicle.create({
      data: {
        organizationId: member.organizationId,
        unitNumber,
        vehicleType,
        plate,
        vin,
        notes,
        active,
        defaultInspectionTemplateVersionId,
      },
      include: {
        defaultInspectionTemplateVersion: {
          select: {
            id: true,
            version: true,
            template: { select: { id: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json({ vehicle });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Unit number already exists for this organization" },
        { status: 409 },
      );
    }
    throw e;
  }
}
