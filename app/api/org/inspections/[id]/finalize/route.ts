import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  assertInspectionAccess,
  getActiveOrgMember,
} from "@/lib/orgInspectionAuth";
import { isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";
import {
  computeOverallSeverity,
  validateItemsAgainstSchema,
} from "@/lib/inspection/finalizeInspection";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  const { id } = await ctx.params;

  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id },
    include: {
      items: true,
      attachments: true,
      templateVersion: true,
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

  const schemaRaw = inspection.templateVersion.checklistSchema;
  if (!isChecklistSchemaV1(schemaRaw)) {
    return NextResponse.json({ error: "Invalid checklist schema" }, { status: 500 });
  }

  const schema = schemaRaw;

  const photoCounts = new Map<string, number>();
  let hasSignature = false;
  for (const a of inspection.attachments) {
    if (a.kind === "signature") hasSignature = true;
    if (a.kind === "photo" && a.itemId) {
      const itemRow = inspection.items.find((i) => i.id === a.itemId);
      if (itemRow) {
        photoCounts.set(itemRow.itemKey, (photoCounts.get(itemRow.itemKey) ?? 0) + 1);
      }
    }
  }

  const itemInputs = inspection.items.map((i) => ({
    itemKey: i.itemKey,
    result: i.result,
    severity: i.severity,
    defectLabel: i.defectLabel,
    notes: i.notes,
  }));

  const v = validateItemsAgainstSchema(
    schema,
    itemInputs,
    photoCounts,
    hasSignature,
  );
  if (!v.ok) {
    return NextResponse.json({ error: v.message }, { status: 400 });
  }

  const overallSeverity = computeOverallSeverity(
    inspection.items.map((i) => ({ result: i.result, severity: i.severity })),
  );

  const updated = await prisma.vehicleInspection.update({
    where: { id },
    data: {
      status: "finalized",
      finalizedAt: new Date(),
      overallSeverity,
    },
    include: {
      items: { orderBy: [{ sectionIndex: "asc" }, { itemIndex: "asc" }] },
      fleetVehicle: true,
      templateVersion: true,
      attachments: true,
      driver: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ inspection: updated });
}
