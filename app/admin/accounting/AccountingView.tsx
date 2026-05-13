"use client";

import { useCallback, useEffect, useState } from "react";

type Accounting = {
  configured: boolean;
  balance?: {
    available: { amount: number; currency: string }[];
    pending: { amount: number; currency: string }[];
    livemode: boolean;
  };
  last30Days?: {
    chargeCount: number;
    grossCents: number;
    currency: string;
  };
  recentPayouts?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number | null;
  }[];
  error?: string;
};

function fmtMoney(cents: number, cur: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: cur.toUpperCase(),
  }).format(cents / 100);
}

export default function AccountingView() {
  const [data, setData] = useState<Accounting | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/accounting");
      const j = (await r.json()) as Accounting & { error?: string };
      if (!r.ok) {
        setData({
          configured: false,
          error: j.error || `HTTP ${r.status}`,
        });
        return;
      }
      setData(j);
    } catch {
      setData({ configured: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-muted">Loading Stripe data…</p>;
  if (!data?.configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {data?.error ||
          "Stripe is not configured. Add keys via environment or Platform settings."}
      </div>
    );
  }

  const cur =
    data.last30Days?.currency ||
    data.balance?.available[0]?.currency ||
    "cad";

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Figures are pulled from your connected Stripe account (
        {data.balance?.livemode ? "live" : "test"} mode). For authoritative
        accounting use the{" "}
        <a
          href="https://dashboard.stripe.com"
          className="font-semibold text-sky underline"
          target="_blank"
          rel="noreferrer"
        >
          Stripe Dashboard
        </a>
        .
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Successful charges (30 days)
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">
            {data.last30Days?.chargeCount ?? 0}
          </p>
          <p className="mt-1 text-lg font-semibold text-deep">
            {fmtMoney(data.last30Days?.grossCents ?? 0, cur)} gross
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Balance available
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {(data.balance?.available ?? []).map((b) => (
              <li key={b.currency}>
                {fmtMoney(b.amount, b.currency)}
              </li>
            ))}
            {(!data.balance?.available?.length) && (
              <li className="text-muted">—</li>
            )}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
        <p className="mb-3 text-sm font-bold text-ink">Recent payouts</p>
        <ul className="divide-y divide-ink/10 text-sm">
          {(data.recentPayouts ?? []).slice(0, 10).map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span className="font-mono text-xs text-muted">{p.id}</span>
              <span>
                {fmtMoney(p.amount, p.currency)} · {p.status}
              </span>
            </li>
          ))}
          {!data.recentPayouts?.length && (
            <li className="py-2 text-muted">No payouts in recent fetch.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
