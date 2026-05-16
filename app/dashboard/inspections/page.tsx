"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ClipboardCheck } from "lucide-react";

type Row = {
  id: string;
  kind: string;
  status: string;
  startedAt: string;
  finalizedAt: string | null;
  overallSeverity: string | null;
  fleetVehicle: { unitNumber: string };
};

export default function DriverInspectionsIndexPage() {
  const { data: session, status } = useSession();
  const orgId = session?.user?.organizationId;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/inspections?mine=1");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const json = (await res.json()) as { inspections: Row[] };
      setRows(json.inspections);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && orgId) void load();
    else if (status === "authenticated" && !orgId) setLoading(false);
  }, [status, orgId, load]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ice text-muted">
        Loading…
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-ink">Sign in to view inspections.</p>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-xl font-bold text-ink">
          No fleet linked
        </h1>
        <p className="mt-2 text-sm text-muted">
          Vehicle inspections are available when your account is added to an organization with an active seat.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block font-semibold text-sky hover:underline"
        >
          ← Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ice pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Inspections
          </h1>
          <Link
            href="/dashboard/inspections/new"
            className="rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-paper shadow-sm hover:bg-deep"
          >
            New
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="mt-2 inline-block text-sm font-semibold text-sky hover:underline"
        >
          ← Map
        </Link>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted">No inspections yet. Start a pre-trip or post-trip.</p>
          ) : (
            rows.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/inspections/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper p-4 shadow-sm transition hover:border-sky/40"
              >
                <ClipboardCheck className="size-8 shrink-0 text-sky" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono-brand font-bold text-ink">
                    {r.fleetVehicle.unitNumber}
                  </div>
                  <div className="text-xs text-muted">
                    {r.kind.replace("_", " ")} · {r.status}
                    {r.overallSeverity
                      ? ` · ${r.overallSeverity.replace(/_/g, " ")}`
                      : ""}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(r.startedAt).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
