/**
 * JSON shape stored on InspectionTemplateVersion.checklistSchema.
 * Editable by fleet admins — not a regulatory authority claim.
 */

export type ChecklistItemResult = "ok" | "defect" | "na";

export type DefectSeverityOption = "minor" | "major" | "out_of_service";

export type ChecklistItemDef = {
  id: string;
  label: string;
  /** Allow marking N/A */
  allowNa?: boolean;
  /** Require at least one photo when result is defect */
  requirePhotoOnDefect?: boolean;
  /** Optional canned defect labels */
  defectLabels?: string[];
};

export type ChecklistSectionDef = {
  title: string;
  items: ChecklistItemDef[];
};

export type ChecklistSchemaV1 = {
  version: 1;
  sections: ChecklistSectionDef[];
};

export function isChecklistSchemaV1(v: unknown): v is ChecklistSchemaV1 {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.version !== 1) return false;
  if (!Array.isArray(o.sections)) return false;
  for (const sec of o.sections) {
    if (!sec || typeof sec !== "object") return false;
    const s = sec as Record<string, unknown>;
    if (typeof s.title !== "string") return false;
    if (!Array.isArray(s.items)) return false;
    for (const it of s.items) {
      if (!it || typeof it !== "object") return false;
      const i = it as Record<string, unknown>;
      if (typeof i.id !== "string" || typeof i.label !== "string") return false;
    }
  }
  return true;
}

/** Flatten sections/items into stable keys matching stored VehicleInspectionItem.itemKey */
export function flattenChecklistItemKeys(schema: ChecklistSchemaV1): string[] {
  const keys: string[] = [];
  schema.sections.forEach((sec, si) => {
    sec.items.forEach((it, ii) => {
      keys.push(it.id || `sec${si}-it${ii}`);
    });
  });
  return keys;
}

export function getItemDefByKey(
  schema: ChecklistSchemaV1,
  itemKey: string,
): { sectionIndex: number; itemIndex: number; def: ChecklistItemDef } | null {
  for (let si = 0; si < schema.sections.length; si++) {
    const sec = schema.sections[si];
    for (let ii = 0; ii < sec.items.length; ii++) {
      const it = sec.items[ii];
      const key = it.id || `sec${si}-it${ii}`;
      if (key === itemKey) return { sectionIndex: si, itemIndex: ii, def: it };
    }
  }
  return null;
}
