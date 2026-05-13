"use client";

import FleetSeatsPanel from "@/components/company/FleetSeatsPanel";

export default function CompanyBillingHubPage() {
  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Subscription
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted">
          Seats, Stripe checkout, and member roster — same data as Fleet &
          seats.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Billing</h1>
      </div>

      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <FleetSeatsPanel />
      </div>
    </>
  );
}
