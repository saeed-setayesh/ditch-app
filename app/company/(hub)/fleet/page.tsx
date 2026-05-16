"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Truck, Radio, Wrench, Plus, Pencil, Trash2 } from "lucide-react";

type TemplateVersionOption = {
  id: string;
  version: number;
  template: { id: string; name: string };
};

type FleetVehicleRow = {
  id: string;
  unitNumber: string;
  vehicleType: string;
  plate: string | null;
  vin: string | null;
  notes: string | null;
  active: boolean;
  defaultInspectionTemplateVersion: TemplateVersionOption | null;
};

export default function CompanyFleetPage() {
  const { data: session } = useSession();
  const canManageFleet = session?.user?.orgRole === "admin";

  const [vehicles, setVehicles] = useState<FleetVehicleRow[]>([]);
  const [versions, setVersions] = useState<TemplateVersionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FleetVehicleRow | null>(null);
  const [creating, setCreating] = useState(false);

  const [formUnit, setFormUnit] = useState("");
  const [formType, setFormType] = useState("truck");
  const [formPlate, setFormPlate] = useState("");
  const [formVin, setFormVin] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formTemplateVerId, setFormTemplateVerId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, tRes] = await Promise.all([
        fetch("/api/org/fleet-vehicles"),
        fetch("/api/org/inspection-templates"),
      ]);
      if (!vRes.ok) throw new Error((await vRes.json()).error ?? "Failed to load fleet");
      const vJson = (await vRes.json()) as { vehicles: FleetVehicleRow[] };
      setVehicles(vJson.vehicles);

      const opts: TemplateVersionOption[] = [];
      if (tRes.ok) {
        const tJson = (await tRes.json()) as {
          templates: {
            id: string;
            name: string;
            versions: { id: string; version: number }[];
          }[];
        };
        for (const t of tJson.templates) {
          for (const ver of t.versions) {
            opts.push({
              id: ver.id,
              version: ver.version,
              template: { id: t.id, name: t.name },
            });
          }
        }
      }
      setVersions(opts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setFormUnit("");
    setFormType("truck");
    setFormPlate("");
    setFormVin("");
    setFormNotes("");
    setFormActive(true);
    setFormTemplateVerId("");
    setEditing(null);
    setCreating(false);
  }

  function openEdit(v: FleetVehicleRow) {
    setEditing(v);
    setCreating(false);
    setFormUnit(v.unitNumber);
    setFormType(v.vehicleType);
    setFormPlate(v.plate ?? "");
    setFormVin(v.vin ?? "");
    setFormNotes(v.notes ?? "");
    setFormActive(v.active);
    setFormTemplateVerId(v.defaultInspectionTemplateVersion?.id ?? "");
  }

  async function saveVehicle() {
    if (!canManageFleet) return;
    setError(null);
    const unit = formUnit.trim();
    if (!unit) {
      setError("Unit number is required.");
      return;
    }
    const payload = {
      unitNumber: unit,
      vehicleType: formType.trim(),
      plate: formPlate.trim() || null,
      vin: formVin.trim() || null,
      notes: formNotes.trim() || null,
      active: formActive,
      defaultInspectionTemplateVersionId: formTemplateVerId.trim() || null,
    };
    try {
      if (editing) {
        const res = await fetch(`/api/org/fleet-vehicles/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          let msg = body.error ?? "Save failed";
          if (msg === "Admin only") {
            msg = "Only organization admins can change fleet vehicles.";
          }
          throw new Error(msg);
        }
      } else {
        const res = await fetch("/api/org/fleet-vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          let msg = body.error ?? "Create failed";
          if (msg === "Admin only") {
            msg = "Only organization admins can add fleet vehicles.";
          }
          throw new Error(msg);
        }
      }
      resetForm();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function deleteVehicle(id: string) {
    if (!canManageFleet) return;
    if (!confirm("Remove this vehicle from the fleet?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/org/fleet-vehicles/${id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        let msg = body.error ?? "Delete failed";
        if (msg === "Admin only") {
          msg = "Only organization admins can remove fleet vehicles.";
        }
        throw new Error(msg);
      }
      resetForm();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const activeRolling = vehicles.filter((x) => x.active).length;

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Assets
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Fleet
        </h1>
        <p className="mt-1 text-sm text-muted">
          Vehicles linked to inspection templates and driver pre-trip / post-trip runs.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Fleet</h1>
      </div>

      <div className="p-4 md:p-6">
        {!canManageFleet && (
          <div className="mb-4 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm text-muted shadow-sm">
            Fleet changes are limited to{" "}
            <span className="font-semibold text-ink">organization admins</span>.
            Ask an admin to add vehicles, or open the{" "}
            <Link href="/dashboard/inspections/new" className="font-semibold text-sky underline">
              driver inspection
            </Link>{" "}
            flow when vehicles are available.
          </div>
        )}
        {canManageFleet && !loading && versions.length === 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
            No custom checklist templates yet. The first driver inspection will create a{" "}
            <span className="font-semibold">starter checklist</span> automatically; customize anytime under{" "}
            <Link href="/company/inspection-templates" className="font-semibold underline">
              Inspection templates
            </Link>
            .
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Truck className="size-4 text-sky" />
              Fleet units
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">
              {loading ? "…" : vehicles.length}
            </div>
            <p className="text-xs text-muted">
              {loading ? "" : `${activeRolling} active`}
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Radio className="size-4 text-deep" />
              Template links
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">
              {versions.length}
            </div>
            <p className="text-xs text-muted">Published checklist versions</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wrench className="size-4 text-muted" />
              Inspections
            </div>
            <div className="mt-2 text-sm text-muted">
              Drivers run inspections from the driver dashboard when linked to your org.
            </div>
          </div>
        </div>

        {canManageFleet ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setCreating(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-paper shadow-sm transition hover:bg-deep"
            >
              <Plus className="size-4" />
              Add vehicle
            </button>
          </div>
        ) : null}

        {(creating || editing) && canManageFleet && (
          <div className="mb-6 rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">
              {editing ? "Edit vehicle" : "New vehicle"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink">Unit number</span>
                <input
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                  placeholder="T-12"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Type</span>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                >
                  <option value="truck">truck</option>
                  <option value="trailer">trailer</option>
                  <option value="bus">bus</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Plate</span>
                <input
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">VIN</span>
                <input
                  value={formVin}
                  onChange={(e) => setFormVin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-ink">Default checklist version</span>
                <select
                  value={formTemplateVerId}
                  onChange={(e) => setFormTemplateVerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                >
                  <option value="">Organization default (latest)</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.template.name} v{v.version}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-ink">Notes</span>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                Active
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveVehicle()}
                className="rounded-lg bg-sky px-4 py-2 text-sm font-semibold text-paper hover:bg-deep"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-ice"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ice/40 font-mono-brand text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Default checklist</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No vehicles yet. Add a unit and assign a template version (Templates tab).
                  </td>
                </tr>
              ) : (
                vehicles.map((row) => (
                  <tr key={row.id} className="text-ink">
                    <td className="px-4 py-3 font-mono-brand font-bold">
                      {row.unitNumber}
                    </td>
                    <td className="px-4 py-3">{row.vehicleType}</td>
                    <td className="px-4 py-3 text-muted">
                      {row.defaultInspectionTemplateVersion
                        ? `${row.defaultInspectionTemplateVersion.template.name} v${row.defaultInspectionTemplateVersion.version}`
                        : "Latest org default"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.active
                            ? "bg-emerald-500/15 text-emerald-800"
                            : "bg-ink/10 text-muted"
                        }`}
                      >
                        {row.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManageFleet ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="rounded-lg border border-ink/12 p-2 text-ink hover:bg-ice"
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteVehicle(row.id)}
                            className="rounded-lg border border-ink/12 p-2 text-red-700 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
