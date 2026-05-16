"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type VehicleOpt = {
  id: string;
  unitNumber: string;
  vehicleType: string;
  active: boolean;
};

export default function NewInspectionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const orgId = session?.user?.organizationId;
  const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [kind, setKind] = useState<"PRE_TRIP" | "POST_TRIP">("PRE_TRIP");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const load = useCallback(async () => {
    setVehiclesLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/fleet-vehicles");
      const json = (await res.json()) as { vehicles?: VehicleOpt[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load fleet");
      setVehicles((json.vehicles ?? []).filter((v) => v.active));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && orgId) void load();
  }, [status, orgId, load]);

  async function start() {
    if (!vehicleId) {
      setError("Choose a vehicle");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/org/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fleetVehicleId: vehicleId, kind }),
      });
      const data = (await res.json()) as { inspection?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start inspection");
      router.push(`/dashboard/inspections/${data.inspection!.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <div className="p-8 text-muted">Loading…</div>;
  }

  if (!orgId) {
    return (
      <div className="p-8">
        <p className="text-muted">No fleet linked.</p>
        <Link href="/dashboard" className="mt-4 inline-block font-semibold text-sky">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ice px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard/inspections"
          className="text-sm font-semibold text-sky hover:underline"
        >
          ← Inspections
        </Link>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          New inspection
        </h1>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <label className="mt-6 block text-sm font-medium text-ink">
          Vehicle
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={vehiclesLoading}
            className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-base text-ink disabled:opacity-60"
          >
            <option value="">
              {vehiclesLoading ? "Loading fleet…" : "Select unit…"}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.unitNumber} ({v.vehicleType})
              </option>
            ))}
          </select>
        </label>

        {!vehiclesLoading && !error && vehicles.length === 0 ? (
          <p className="mt-4 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm text-muted">
            No active vehicles are available yet. Ask a fleet{" "}
            <span className="font-semibold text-ink">organization admin</span> to add units in{" "}
            <Link href="/company/fleet" className="font-semibold text-sky underline">
              Company hub → Fleet
            </Link>
            .
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          {(["PRE_TRIP", "POST_TRIP"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-xl border px-4 py-4 text-sm font-bold transition ${
                kind === k
                  ? "border-sky bg-sky text-paper"
                  : "border-ink/15 bg-paper text-ink hover:bg-ice"
              }`}
            >
              {k === "PRE_TRIP" ? "Pre-trip" : "Post-trip"}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || !vehicleId || vehiclesLoading || vehicles.length === 0}
          onClick={() => void start()}
          className="mt-8 w-full rounded-xl bg-sky py-4 text-base font-bold text-paper shadow-sm hover:bg-deep disabled:opacity-40"
        >
          {busy ? "Starting…" : "Start inspection"}
        </button>

        {typeof navigator !== "undefined" && !navigator.onLine ? (
          <p className="mt-4 text-center text-sm font-semibold text-amber-800">
            You appear offline. Inspections need a connection to save.
          </p>
        ) : null}
      </div>
    </div>
  );
}
