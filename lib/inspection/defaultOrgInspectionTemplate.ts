import { prisma } from "@/lib/db";
import type { ChecklistSchemaV1 } from "./checklistSchema";
import { isChecklistSchemaV1 } from "./checklistSchema";

export const DEFAULT_AUTO_TEMPLATE_NAME = "Standard inspection";

/** Minimal valid checklist so drivers can start inspections before admins customize templates. */
export const MINIMAL_CHECKLIST_SCHEMA_V1: ChecklistSchemaV1 = {
  version: 1,
  sections: [
    {
      title: "Vehicle walk-around",
      items: [
        { id: "lights_signals", label: "Lights & signals" },
        { id: "tires_wheels", label: "Tires & wheels" },
        { id: "brakes_steering", label: "Brakes & steering" },
        {
          id: "fluid_leaks",
          label: "Fluids — leaks under vehicle",
        },
        {
          id: "coupling",
          label: "Coupling / fifth wheel (if applicable)",
          allowNa: true,
        },
      ],
    },
  ],
};

/**
 * When an organization has no inspection templates yet, create one with a minimal checklist.
 * Returns null if templates already exist (admin should configure them under Company → Templates).
 */
export async function ensureDefaultInspectionTemplate(
  organizationId: string,
): Promise<{ versionId: string; schema: ChecklistSchemaV1 } | null> {
  return prisma.$transaction(async (tx) => {
    const existingNamed = await tx.inspectionTemplate.findFirst({
      where: { organizationId, name: DEFAULT_AUTO_TEMPLATE_NAME },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (existingNamed?.versions[0]) {
      const schema = existingNamed.versions[0].checklistSchema;
      if (isChecklistSchemaV1(schema)) {
        return { versionId: existingNamed.versions[0].id, schema };
      }
    }

    const existingCount = await tx.inspectionTemplate.count({
      where: { organizationId },
    });
    if (existingCount > 0) return null;

    try {
      const template = await tx.inspectionTemplate.create({
        data: {
          organizationId,
          name: DEFAULT_AUTO_TEMPLATE_NAME,
          description:
            "Auto-created starter checklist. Replace or extend under Company → Inspection templates.",
        },
      });
      const version = await tx.inspectionTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          checklistSchema: MINIMAL_CHECKLIST_SCHEMA_V1 as object,
        },
      });
      const schema = version.checklistSchema;
      if (!isChecklistSchemaV1(schema)) return null;
      return { versionId: version.id, schema };
    } catch {
      const fallback = await tx.inspectionTemplate.findFirst({
        where: { organizationId, name: DEFAULT_AUTO_TEMPLATE_NAME },
        include: {
          versions: { orderBy: { version: "desc" }, take: 1 },
        },
      });
      const v = fallback?.versions[0];
      const schema = v?.checklistSchema;
      if (!v || !isChecklistSchemaV1(schema)) return null;
      return { versionId: v.id, schema };
    }
  });
}
