"use client";

import { useEffect, useState, useCallback } from "react";

export type OrgPayload = {
  id: string;
  name: string;
  role: string;
  seatActive: boolean;
  subscription: {
    seatQuantity: number;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  members: {
    id: string;
    role: string;
    seatActive: boolean;
    user: { id: string; name: string | null; email: string | null };
  }[];
};

/** Fleet org creation, seats checkout, and members — shared by /company and hub billing. */
export default function FleetSeatsPanel() {
  const [org, setOrg] = useState<OrgPayload | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [seatQty, setSeatQty] = useState(3);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/organization");
    if (!res.ok) {
      setOrg(null);
      return;
    }
    const data = (await res.json()) as {
      organization: OrgPayload | null;
    };
    setOrg(data.organization ?? null);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createOrg = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "My fleet" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setName("");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const buySeats = async () => {
    if (!org) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "org_seats",
          organizationId: org.id,
          quantity: seatQty,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error(data.error ?? "Checkout unavailable");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Checkout unavailable");
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "organization" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error(data.error ?? "Portal unavailable");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Portal unavailable");
    } finally {
      setBusy(false);
    }
  };

  if (org === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <>
      {msg ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {msg}
        </p>
      ) : null}

      {!org ? (
        <div className="space-y-3 rounded-xl border border-ink/10 bg-paper p-6 shadow-sm">
          <p className="text-sm text-ink">
            Create a fleet organization (one per account). Stripe customer is
            created automatically — then buy seats to cover your drivers.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fleet name"
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-ink"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void createOrg()}
            className="rounded-lg bg-sky px-4 py-2 font-semibold text-paper transition hover:bg-deep disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Create organization"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-ink/10 bg-paper p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">
              {org.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Your role: {org.role}. Seat assignment:{" "}
              {org.seatActive ? "active" : "inactive"}.
            </p>
            {org.subscription ? (
              <p className="mt-3 text-sm text-ink">
                Subscription:{" "}
                <span className="font-semibold capitalize">
                  {org.subscription.status}
                </span>
                · {org.subscription.seatQuantity} seat
                {org.subscription.seatQuantity === 1 ? "" : "s"}
                {org.subscription.currentPeriodEnd
                  ? ` · renews ${new Date(
                      org.subscription.currentPeriodEnd,
                    ).toLocaleDateString()}`
                  : ""}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No Stripe subscription recorded yet — purchase seats below.
              </p>
            )}
          </section>

          {org.role === "admin" ? (
            <section className="rounded-xl border border-ink/10 bg-paper p-6 shadow-sm">
              <h3 className="font-semibold text-ink">Buy or adjust seats</h3>
              <p className="mt-1 text-xs text-muted">
                Checkout quantity becomes the Stripe subscription line quantity
                (per-seat priced). Use the Stripe customer portal afterward to
                change quantity or cancel.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Seats</span>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={seatQty}
                    onChange={(e) =>
                      setSeatQty(
                        Math.max(
                          1,
                          Math.min(250, parseInt(e.target.value, 10) || 1),
                        ),
                      )
                    }
                    className="w-24 rounded-lg border border-ink/15 px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void buySeats()}
                  className="rounded-lg bg-sky px-4 py-2 font-semibold text-paper hover:bg-deep disabled:opacity-50"
                >
                  Open Checkout
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void openPortal()}
                  className="rounded-lg border border-ink/15 px-4 py-2 font-semibold text-ink hover:bg-ice disabled:opacity-50"
                >
                  Manage org billing
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-ink/10 bg-paper p-6 shadow-sm">
            <h3 className="font-semibold text-ink">Members</h3>
            <ul className="mt-3 divide-y divide-ink/10">
              {org.members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    {m.user.name || m.user.email || m.user.id}
                    <span className="ml-2 text-muted">
                      ({m.role}
                      {m.seatActive ? ", seated" : ""})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
