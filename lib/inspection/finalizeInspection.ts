import type { ChecklistSchemaV1 } from "./checklistSchema";
import { getItemDefByKey } from "./checklistSchema";

export type OverallSeverity = "ok" | "defects" | "out_of_service";

export type ItemRowInput = {
  itemKey: string;
  result: string;
  severity: string | null;
  defectLabel: string | null;
  notes: string | null;
};

export function computeOverallSeverity(
  items: { result: string; severity: string | null }[],
): OverallSeverity {
  let hasDefect = false;
  for (const row of items) {
    if (row.result === "defect") {
      hasDefect = true;
      if (row.severity === "out_of_service") return "out_of_service";
    }
  }
  if (hasDefect) return "defects";
  return "ok";
}

export function validateItemsAgainstSchema(
  schema: ChecklistSchemaV1,
  items: ItemRowInput[],
  attachmentsByItemKey: Map<string, number>,
  hasSignature: boolean,
): { ok: true } | { ok: false; message: string } {
  const keys = new Set<string>();
  schema.sections.forEach((sec, si) => {
    sec.items.forEach((it, ii) => {
      keys.add(it.id || `sec${si}-it${ii}`);
    });
  });

  const byKey = new Map(items.map((i) => [i.itemKey, i]));
  for (const key of keys) {
    const row = byKey.get(key);
    if (!row) return { ok: false, message: `Missing result for item ${key}` };
    if (!["ok", "defect", "na"].includes(row.result)) {
      return { ok: false, message: `Invalid result for ${key}` };
    }
    const hit = getItemDefByKey(schema, key);
    if (row.result === "na" && hit?.def.allowNa === false) {
      return { ok: false, message: `N/A not allowed for ${key}` };
    }
    if (row.result === "defect") {
      if (!row.severity || !["minor", "major", "out_of_service"].includes(row.severity)) {
        return { ok: false, message: `Defect severity required for ${key}` };
      }
      const needPhoto = hit?.def.requirePhotoOnDefect === true;
      if (needPhoto && (attachmentsByItemKey.get(key) ?? 0) < 1) {
        return { ok: false, message: `Photo required for defect on ${key}` };
      }
    }
    if (row.result !== "defect" && row.severity) {
      return { ok: false, message: `Severity should be empty when not defect (${key})` };
    }
  }

  for (const row of items) {
    if (!keys.has(row.itemKey)) {
      return { ok: false, message: `Unknown itemKey ${row.itemKey}` };
    }
  }

  if (!hasSignature) {
    return { ok: false, message: "Driver signature is required before finalize" };
  }

  return { ok: true };
}
