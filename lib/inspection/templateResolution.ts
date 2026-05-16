import { prisma } from "@/lib/db";
import type { ChecklistSchemaV1 } from "./checklistSchema";
import { isChecklistSchemaV1 } from "./checklistSchema";

export async function resolveTemplateVersionForVehicle(opts: {
  organizationId: string;
  fleetVehicleId: string;
}): Promise<{ versionId: string; schema: ChecklistSchemaV1 } | null> {
  const vehicle = await prisma.fleetVehicle.findFirst({
    where: {
      id: opts.fleetVehicleId,
      organizationId: opts.organizationId,
      active: true,
    },
    select: {
      defaultInspectionTemplateVersionId: true,
    },
  });

  if (vehicle?.defaultInspectionTemplateVersionId) {
    const v = await prisma.inspectionTemplateVersion.findUnique({
      where: { id: vehicle.defaultInspectionTemplateVersionId },
      select: { id: true, checklistSchema: true, template: { select: { organizationId: true } } },
    });
    if (
      v &&
      v.template.organizationId === opts.organizationId &&
      isChecklistSchemaV1(v.checklistSchema)
    ) {
      return { versionId: v.id, schema: v.checklistSchema };
    }
  }

  const latest = await prisma.inspectionTemplateVersion.findFirst({
    where: { template: { organizationId: opts.organizationId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, checklistSchema: true },
  });

  if (
    latest &&
    isChecklistSchemaV1(latest.checklistSchema)
  ) {
    return { versionId: latest.id, schema: latest.checklistSchema };
  }

  return null;
}
