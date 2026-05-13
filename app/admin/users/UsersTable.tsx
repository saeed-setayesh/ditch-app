"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  createdAt: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/users");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load");
      setUsers(j.users || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchUser(
    id: string,
    body: { proActive?: boolean; role?: "user" | "admin" },
  ) {
    setBusyId(id);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Update failed");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...j.user } : u)),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading users…</p>;
  }

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ice/80 text-xs font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Stripe</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {users.map((u) => {
              const isPro =
                u.tier === "pro" ||
                u.stripeSubscriptionStatus === "active" ||
                u.stripeSubscriptionStatus === "trialing";
              const pending = busyId === u.id;
              return (
                <tr key={u.id} className="hover:bg-ice/50">
                  <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-md bg-deep/10 px-2 py-0.5 text-xs font-semibold text-deep"
                          : "text-xs text-muted"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        isPro
                          ? "rounded-md bg-sky/15 px-2 py-0.5 text-xs font-semibold text-deep"
                          : "text-xs text-muted"
                      }
                    >
                      {isPro ? "pro" : u.tier}
                    </span>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-[10px] text-muted">
                    {u.stripeSubscriptionStatus ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="space-y-1 px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void patchUser(u.id, { proActive: !isPro })
                      }
                      className="mr-2 rounded-lg border border-ink/12 bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-ice disabled:opacity-50"
                    >
                      {isPro ? "Deactivate Pro" : "Activate Pro"}
                    </button>
                    {u.role === "admin" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          void patchUser(u.id, { role: "user" })
                        }
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Remove admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          void patchUser(u.id, { role: "admin" })
                        }
                        className="rounded-lg border border-deep/20 bg-deep/5 px-2 py-1 text-xs font-semibold text-deep hover:bg-deep/10 disabled:opacity-50"
                      >
                        Make admin
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Activating Pro sets subscription status to <code>active</code> in the
        database (same path as Stripe). If the user has a real Stripe
        subscription, cancel it in Stripe when you deactivate them here.
      </p>
    </div>
  );
}
