"use client";

import { Truck, Radio, Wrench } from "lucide-react";

const FLEET_ROWS = [
  { id: "T-04", driver: "M. Chen", status: "En route", zone: "401 WB", health: "ok" },
  { id: "T-08", driver: "A. Patel", status: "Idle", zone: "Yard", health: "ok" },
  { id: "T-11", driver: "J. Okonkwo", status: "On scene", zone: "QEW", health: "svc" },
  { id: "T-12", driver: "R. Santos", status: "Offline", zone: "—", health: "off" },
];

export default function CompanyFleetPage() {
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
          Trucks and assignment status (sample data for layout).
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Fleet</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Truck className="size-4 text-sky" />
              Active trucks
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">14</div>
            <p className="text-xs text-muted">9 rolling · 5 yard / off-shift</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Radio className="size-4 text-deep" />
              In service
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">11</div>
            <p className="text-xs text-muted">GPS + dispatcher link OK</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Wrench className="size-4 text-muted" />
              Maintenance
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">1</div>
            <p className="text-xs text-muted">T-12 scheduled shop</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-paper shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ice/40 font-mono-brand text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {FLEET_ROWS.map((row) => (
                <tr key={row.id} className="text-ink">
                  <td className="px-4 py-3 font-mono-brand font-bold">{row.id}</td>
                  <td className="px-4 py-3">{row.driver}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === "En route"
                          ? "bg-sky/20 text-deep"
                          : row.status === "On scene"
                            ? "bg-amber-100 text-amber-900"
                            : row.status === "Idle"
                              ? "bg-ice text-muted"
                              : "bg-ink/10 text-muted"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.zone}</td>
                  <td className="px-4 py-3">
                    {row.health === "ok" ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        Online
                      </span>
                    ) : row.health === "svc" ? (
                      <span className="text-xs font-semibold text-amber-800">
                        Degraded
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
