"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SignaturePad, {
  clearSignatureCanvas,
  signatureCanvasToPngBlob,
} from "@/components/inspection/SignaturePad";
import type { ChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";
import { isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";

type ItemRow = {
  id: string;
  itemKey: string;
  sectionIndex: number;
  itemIndex: number;
  result: string;
  severity: string | null;
  defectLabel: string | null;
  notes: string | null;
};

type AttachmentRow = {
  id: string;
  kind: string;
  itemId: string | null;
  publicUrl: string | null;
};

type InspectionPayload = {
  id: string;
  status: string;
  kind: string;
  startedAt: string;
  finalizedAt: string | null;
  overallSeverity: string | null;
  odometerKm: number | null;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  fleetVehicle: { unitNumber: string; vehicleType: string };
  organization: { name: string };
  templateVersion: { checklistSchema: unknown; version: number };
  items: ItemRow[];
  attachments: AttachmentRow[];
};

export default function DriverInspectionRunner({ id }: { id: string }) {
  const [inspection, setInspection] = useState<InspectionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState<string | null>(null);
  const sigRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/org/inspections/${id}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const json = (await res.json()) as { inspection: InspectionPayload };
      setInspection(json.inspection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveMeta(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/org/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const json = (await res.json()) as { inspection: InspectionPayload };
      setInspection(json.inspection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveItems(nextItems: ItemRow[]) {
    setBusy(true);
    try {
      const res = await fetch(`/api/org/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: nextItems.map((i) => ({
            id: i.id,
            result: i.result,
            severity: i.severity,
            defectLabel: i.defectLabel,
            notes: i.notes,
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const json = (await res.json()) as { inspection: InspectionPayload };
      setInspection(json.inspection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function updateItem(rowId: string, patch: Partial<ItemRow>) {
    if (!inspection || inspection.status === "finalized") return;
    const next = inspection.items.map((i) =>
      i.id === rowId ? { ...i, ...patch } : i,
    );
    setInspection({ ...inspection, items: next });
  }

  async function uploadPhoto(itemRowId: string, file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "photo");
      fd.set("itemId", itemRowId);
      const res = await fetch(`/api/org/inspections/${id}/attachments`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSignatureBlob(blob: Blob) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", new File([blob], "signature.png", { type: "image/png" }));
      fd.set("kind", "signature");
      const res = await fetch(`/api/org/inspections/${id}/attachments`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setFinalizeMsg(null);
    setBusy(true);
    try {
      await saveItems(inspection!.items);
      const res = await fetch(`/api/org/inspections/${id}/finalize`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Finalize failed");
      await load();
    } catch (e: unknown) {
      setFinalizeMsg(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setBusy(false);
    }
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void saveMeta({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          locationLabel: null,
        });
      },
      () => setError("Could not read location (permission denied?)"),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  if (error && !inspection) {
    return (
      <div className="px-4 py-12">
        <p className="text-red-800">{error}</p>
        <Link href="/dashboard/inspections" className="mt-4 block font-semibold text-sky">
          ← Back
        </Link>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  const schemaRaw = inspection.templateVersion.checklistSchema;
  const schema: ChecklistSchemaV1 | null = isChecklistSchemaV1(schemaRaw)
    ? schemaRaw
    : null;

  const finalized = inspection.status === "finalized";
  const sigAttachment = inspection.attachments.find((a) => a.kind === "signature");

  const photoCountForItem = (itemRowId: string) =>
    inspection.attachments.filter((a) => a.kind === "photo" && a.itemId === itemRowId)
      .length;

  return (
    <div className="min-h-dvh bg-ice px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard/inspections"
          className="text-sm font-semibold text-sky hover:underline"
        >
          ← Inspections
        </Link>

        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">
          {inspection.fleetVehicle.unitNumber}
        </h1>
        <p className="text-sm text-muted">
          {inspection.kind.replace("_", " ")} · {inspection.status}
          {inspection.overallSeverity
            ? ` · ${inspection.overallSeverity.replace(/_/g, " ")}`
            : ""}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}
        {finalizeMsg && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {finalizeMsg}
          </div>
        )}

        {typeof navigator !== "undefined" && !navigator.onLine ? (
          <p className="mt-4 text-sm font-semibold text-amber-800">
            Offline — reconnect to save or finalize.
          </p>
        ) : null}

        {finalized && (
          <a
            href={`/api/org/inspections/${id}/pdf`}
            className="mt-4 inline-flex rounded-xl border border-ink/15 bg-paper px-4 py-2 text-sm font-bold text-sky"
          >
            Download PDF
          </a>
        )}

        <div className="mt-6 rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-muted">
            Trip details
          </div>
          <label className="mt-3 block text-sm font-medium text-ink">
            Odometer (km)
            <input
              type="number"
              min={0}
              disabled={finalized}
              value={inspection.odometerKm ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                setInspection({
                  ...inspection,
                  odometerKm: v !== null && Number.isFinite(v) ? v : null,
                });
              }}
              onBlur={() => {
                if (!finalized && inspection.odometerKm != null) {
                  void saveMeta({ odometerKm: inspection.odometerKm });
                }
              }}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink disabled:bg-ice"
            />
          </label>
          <button
            type="button"
            disabled={finalized || busy}
            onClick={() => captureLocation()}
            className="mt-3 w-full rounded-lg border border-ink/15 py-2 text-sm font-semibold text-ink hover:bg-ice disabled:opacity-40"
          >
            Capture GPS
          </button>
          {inspection.lat != null && inspection.lng != null && (
            <p className="mt-2 font-mono-brand text-xs text-muted">
              {inspection.lat.toFixed(5)}, {inspection.lng.toFixed(5)}
            </p>
          )}
        </div>

        {schema ? (
          <div className="mt-6 space-y-8">
            {schema.sections.map((sec, si) => (
              <section key={si}>
                <h2 className="font-display text-lg font-bold text-ink">{sec.title}</h2>
                <div className="mt-3 space-y-4">
                  {sec.items.map((def, ii) => {
                    const itemKey = def.id || `sec${si}-it${ii}`;
                    const row = inspection.items.find((i) => i.itemKey === itemKey);
                    if (!row) return null;
                    const photos = photoCountForItem(row.id);

                    return (
                      <div
                        key={row.id}
                        className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm"
                      >
                        <div className="text-sm font-semibold text-ink">{def.label}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(["ok", "defect", "na"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              disabled={finalized}
                              onClick={() => {
                                updateItem(row.id, {
                                  result: r,
                                  severity:
                                    r === "defect" ? row.severity ?? "minor" : null,
                                  defectLabel:
                                    r === "defect" ? row.defectLabel : null,
                                });
                              }}
                              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                                row.result === r
                                  ? "bg-sky text-paper"
                                  : "border border-ink/15 bg-ice text-ink"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>

                        {row.result === "defect" && (
                          <>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(["minor", "major", "out_of_service"] as const).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={finalized}
                                  onClick={() => updateItem(row.id, { severity: s })}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                    row.severity === s
                                      ? "bg-deep text-paper"
                                      : "border border-ink/15 bg-white text-ink"
                                  }`}
                                >
                                  {s.replace(/_/g, " ")}
                                </button>
                              ))}
                            </div>
                            {def.defectLabels && def.defectLabels.length > 0 && (
                              <select
                                disabled={finalized}
                                value={row.defectLabel ?? ""}
                                onChange={(e) =>
                                  updateItem(row.id, {
                                    defectLabel: e.target.value || null,
                                  })
                                }
                                className="mt-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink disabled:bg-ice"
                              >
                                <option value="">Defect label…</option>
                                {def.defectLabels.map((l) => (
                                  <option key={l} value={l}>
                                    {l}
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        )}

                        <textarea
                          disabled={finalized}
                          placeholder="Notes"
                          value={row.notes ?? ""}
                          onChange={(e) =>
                            updateItem(row.id, { notes: e.target.value || null })
                          }
                          rows={2}
                          className="mt-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink disabled:bg-ice"
                        />

                        {def.requirePhotoOnDefect && row.result === "defect" && (
                          <p className="mt-2 text-xs font-semibold text-amber-900">
                            Photo required for this defect ({photos} uploaded)
                          </p>
                        )}

                        {!finalized && (
                          <label className="mt-3 block text-xs font-semibold text-muted">
                            Add photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="mt-1 block w-full text-sm"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                if (f) void uploadPhoto(row.id, f);
                              }}
                            />
                          </label>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {inspection.attachments
                            .filter((a) => a.kind === "photo" && a.itemId === row.id)
                            .map((a) => (
                              <a
                                key={a.id}
                                href={`/api/org/inspection-files?attachmentId=${encodeURIComponent(a.id)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-sky underline"
                              >
                                Photo
                              </a>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-muted">Invalid checklist schema.</p>
        )}

        {!finalized && (
          <div className="mt-8 rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="text-sm font-bold text-ink">Driver signature</div>
            <p className="mt-1 text-xs text-muted">
              Sign with finger or stylus before finalizing.
            </p>
            <SignaturePad ref={sigRef} className="mt-3 touch-none h-36 w-full rounded-xl border border-ink/15 bg-white" />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => clearSignatureCanvas(sigRef.current)}
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const blob = await signatureCanvasToPngBlob(sigRef.current);
                  if (!blob) return;
                  await uploadSignatureBlob(blob);
                  clearSignatureCanvas(sigRef.current);
                }}
                className="rounded-lg bg-sky px-4 py-2 text-sm font-semibold text-paper"
              >
                Save signature
              </button>
            </div>
            {sigAttachment && (
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                Signature on file.
              </p>
            )}
          </div>
        )}

        {!finalized && (
          <div className="mt-6 flex flex-col gap-3 pb-8">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveItems(inspection.items)}
              className="w-full rounded-xl border border-ink/15 py-3 text-sm font-bold text-ink hover:bg-ice"
            >
              Save checklist progress
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void finalize()}
              className="w-full rounded-xl bg-deep py-4 text-base font-bold text-paper shadow-sm hover:bg-ink disabled:opacity-40"
            >
              Finalize inspection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
