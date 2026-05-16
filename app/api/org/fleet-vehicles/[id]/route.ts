import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  getActiveOrgMember,
  requireOrgAdmin,
} from "@/lib/orgInspectionAuth";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!requireOrgAdmin(member)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.fleetVehicle.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.unitNumber !== undefined) {
    const u = String(body.unitNumber).trim();
    if (!u) return NextResponse.json({ error: "unitNumber empty" }, { status: 400 });
    data.unitNumber = u;
  }
  if (body.vehicleType !== undefined) {
    data.vehicleType = String(body.vehicleType || "truck").trim();
  }
  if (body.plate !== undefined) data.plate = String(body.plate).trim() || null;
  if (body.vin !== undefined) data.vin = String(body.vin).trim() || null;
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.defaultInspectionTemplateVersionId !== undefined) {
    const vid =
      typeof body.defaultInspectionTemplateVersionId === "string"
        ? body.defaultInspectionTemplateVersionId.trim() || null
        : null;
    if (vid) {
      const ver = await prisma.inspectionTemplateVersion.findFirst({
        where: { id: vid, template: { organizationId: member.organizationId } },
      });
      if (!ver) {
        return NextResponse.json({ error: "Invalid template version" }, { status: 400 });
      }
    }
    data.defaultInspectionTemplateVersionId = vid;
  }

  try {
    const vehicle = await prisma.fleetVehicle.update({
      where: { id },
      data,
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

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!requireOrgAdmin(member)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.fleetVehicle.findFirst({
    where: { id, organizationId: member.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.fleetVehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
