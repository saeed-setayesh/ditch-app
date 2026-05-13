"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function CompanySettingsPage() {
  const { data: session } = useSession();
  const orgName = session?.user?.orgName ?? "";

  const [notifyDispatch, setNotifyDispatch] = useState(true);
  const [notifyBilling, setNotifyBilling] = useState(true);
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Workspace
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Operator preferences (local only until backend settings ship).
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Settings</h1>
      </div>

      <div className="mx-auto max-w-xl space-y-6 p-4 md:p-6">
        <section className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-ink">
            Organization
          </h2>
          <p className="mt-1 text-sm text-muted">
            Name is managed in Stripe and fleet onboarding.
          </p>
          <label className="mt-4 block text-sm font-medium text-ink">
            Display name
          </label>
          <input
            type="text"
            readOnly
            value={orgName}
            className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-ink/12 bg-ice/50 px-3 py-2 text-ink"
          />
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-ink">
            Notifications
          </h2>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-b border-ink/8 py-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                Dispatch alerts
              </div>
              <div className="text-xs text-muted">New high-priority jobs</div>
            </div>
            <input
              type="checkbox"
              checked={notifyDispatch}
              onChange={(e) => setNotifyDispatch(e.target.checked)}
              className="size-5 accent-sky"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                Billing emails
              </div>
              <div className="text-xs text-muted">Invoices & seat changes</div>
            </div>
            <input
              type="checkbox"
              checked={notifyBilling}
              onChange={(e) => setNotifyBilling(e.target.checked)}
              className="size-5 accent-sky"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
          <h2 className="font-display text-base font-bold text-ink">
            Display density
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tables and queue spacing on this device.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                density === "comfortable"
                  ? "border-sky bg-sky/10 text-deep"
                  : "border-ink/12 text-muted hover:bg-ice"
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                density === "compact"
                  ? "border-sky bg-sky/10 text-deep"
                  : "border-ink/12 text-muted hover:bg-ice"
              }`}
            >
              Compact
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
