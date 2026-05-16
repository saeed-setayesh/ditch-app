import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  assertInspectionAccess,
  getActiveOrgMember,
} from "@/lib/orgInspectionAuth";
import {
  InspectionPdfDocument,
  type InspectionPdfRow,
} from "@/lib/inspection/InspectionPdfDocument";
import { getItemDefByKey, isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${d.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export async function GET(_request: Request, ctx: RouteCtx) {
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
      templateVersion: { include: { template: true } },
      driver: { select: { name: true, email: true } },
      organization: { select: { name: true } },
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

  const schemaRaw = inspection.templateVersion.checklistSchema;
  if (!isChecklistSchemaV1(schemaRaw)) {
    return NextResponse.json({ error: "Invalid checklist" }, { status: 500 });
  }

  const rows: InspectionPdfRow[] = inspection.items.map((it) => {
    const hit = getItemDefByKey(schemaRaw, it.itemKey);
    const sectionTitle =
      hit != null ? schemaRaw.sections[hit.sectionIndex]?.title ?? "—" : "—";
    const itemLabel = hit?.def.label ?? it.itemKey;
    return {
      sectionTitle,
      itemLabel,
      result: it.result,
      severity: it.severity ?? "—",
      notes: it.notes ?? "",
    };
  });

  const driverLabel =
    inspection.driver.name?.trim() ||
    inspection.driver.email ||
    inspection.driverUserId;

  const pdfDoc = (
    <InspectionPdfDocument
      organizationName={inspection.organization.name}
      unitNumber={inspection.fleetVehicle.unitNumber}
      vehicleType={inspection.fleetVehicle.vehicleType}
      driverLabel={driverLabel}
      kind={inspection.kind}
      status={inspection.status}
      startedAt={fmtDate(inspection.startedAt)}
      finalizedAt={fmtDate(inspection.finalizedAt)}
      odometerLabel={
        inspection.odometerKm != null ? `${inspection.odometerKm} km` : "—"
      }
      locationLabel={
        inspection.locationLabel?.trim() ||
        (inspection.lat != null && inspection.lng != null
          ? `${inspection.lat.toFixed(5)}, ${inspection.lng.toFixed(5)}`
          : "—")
      }
      overallSeverity={inspection.overallSeverity ?? "—"}
      templateName={inspection.templateVersion.template.name}
      templateVersion={inspection.templateVersion.version}
      rows={rows}
    />
  );

  const buffer = await renderToBuffer(pdfDoc);

  const filename = `inspection-${inspection.fleetVehicle.unitNumber}-${inspection.id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
