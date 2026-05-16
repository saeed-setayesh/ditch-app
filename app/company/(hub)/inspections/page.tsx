"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileDown } from "lucide-react";

type Row = {
  id: string;
  kind: string;
  status: string;
  startedAt: string;
  finalizedAt: string | null;
  overallSeverity: string | null;
  odometerKm: number | null;
  fleetVehicle: { unitNumber: string; vehicleType: string };
  driver: { id: string; name: string | null; email: string | null };
};

export default function CompanyInspectionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q =
        status === "draft" || status === "finalized"
          ? `?status=${encodeURIComponent(status)}`
          : "";
      const res = await fetch(`/api/org/inspections${q}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const json = (await res.json()) as { inspections: Row[] };
      setRows(json.inspections);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Compliance
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Inspection log
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pre-trip and post-trip inspection submissions from drivers in your organization.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Inspections</h1>
      </div>

      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold text-ink hover:bg-ice"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ice/40 font-mono-brand text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Kind</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Overall</th>
                <th className="px-4 py-3 font-semibold">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No inspections yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="text-ink">
                    <td className="px-4 py-3 text-muted">
                      {new Date(r.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono-brand font-semibold">
                      {r.fleetVehicle.unitNumber}
                    </td>
                    <td className="px-4 py-3">
                      {r.driver.name?.trim() || r.driver.email || r.driver.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{r.kind.replace("_", " ")}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">
                      {r.overallSeverity?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/org/inspections/${r.id}/pdf`}
                        className="inline-flex items-center gap-1 font-semibold text-sky hover:underline"
                      >
                        <FileDown className="size-4" />
                        Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted">
          Configure checklists under{" "}
          <Link href="/company/inspection-templates" className="font-semibold text-sky">
            Templates
          </Link>
          .
        </p>
      </div>
    </>
  );
}
