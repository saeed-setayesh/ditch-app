"use client";

import Link from "next/link";
import FleetSeatsPanel from "@/components/company/FleetSeatsPanel";
import { SignOutButton } from "@/components/SignOutButton";

export default function CompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Fleet & seats
          </h1>
          <p className="mt-1 text-sm text-muted">
            Corporate billing buys driver seats via Stripe Checkout; Pro features
            apply to seated members while the subscription is active.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/company/dashboard"
            className="rounded-lg border border-ink/12 bg-sky px-3 py-2 text-sm font-semibold text-paper hover:bg-deep"
          >
            Operator hub
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-ink/12 bg-ice/80 px-3 py-2 text-sm font-semibold text-ink"
          >
            Driver app
          </Link>
          <SignOutButton className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-ice" />
        </div>
      </div>

      <FleetSeatsPanel />
    </div>
  );
}
