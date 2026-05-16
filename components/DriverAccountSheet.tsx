"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { type DriverShortcut, MAX_DRIVER_QUICK_NAVS } from "@/lib/driverShortcuts";
import { useDriverDashboardTheme } from "@/components/DriverDashboardTheme";

type BillingStatus = {
  authenticated: boolean;
  tier: string;
  stripeCustomer?: boolean;
  portalUser?: boolean;
  organization?: {
    id: string;
    portalOrganization?: boolean;
  } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userName: string | null;
  userEmail: string | null;
  tier: "free" | "pro";
  quickNavs: DriverShortcut[];
  onOpenAlertPreferences: () => void;
};

export default function DriverAccountSheet({
  open,
  onClose,
  userName,
  userEmail,
  tier: tierProp,
  quickNavs,
  onOpenAlertPreferences,
}: Props) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useDriverDashboardTheme();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBillingMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let c = true;
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (c && d) setBilling(d as BillingStatus);
      })
      .catch(() => {});
    return () => {
      c = false;
    };
  }, [open]);

  const planTier: "free" | "pro" =
    billing == null
      ? tierProp
      : billing.tier === "pro" || tierProp === "pro"
        ? "pro"
        : "free";

  const startProCheckout = async () => {
    setBillingBusy(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pro" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setBillingMessage(data.error ?? "Could not start checkout.");
    } catch {
      setBillingMessage("Could not start checkout.");
    } finally {
      setBillingBusy(false);
    }
  };

  const openUserPortal = async () => {
    setBillingBusy(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "user" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setBillingMessage(data.error ?? "Billing portal unavailable.");
    } catch {
      setBillingMessage("Billing portal unavailable.");
    } finally {
      setBillingBusy(false);
    }
  };

  const fleetEnabled = billing?.authenticated && billing.organization?.id;
  const filledSlots = quickNavs.filter((n) => n.label.trim().length > 0).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[48] flex justify-start bg-black/40 md:bg-black/35">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close account"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-r border-ink/10 bg-paper shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-account-title"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-ink/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-ice"
            aria-label="Back to map"
          >
            <ChevronLeft className="size-6" strokeWidth={2} />
          </button>
          <h1
            id="driver-account-title"
            className="font-display text-xl font-bold text-ink"
          >
            Account
          </h1>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-ice/60">
              <span className="font-display text-lg font-bold text-muted">
                {(userName ?? userEmail ?? "?").slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              {userName ? (
                <p className="truncate font-semibold text-ink">{userName}</p>
              ) : null}
              {userEmail ? (
                <p className="truncate text-sm text-muted">{userEmail}</p>
              ) : (
                <p className="text-sm text-muted">Not signed in</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-ink/10 bg-ice/35 p-4">
            <p className="text-sm font-semibold text-ink">
              Plan · {planTier === "pro" ? "Pro" : "Free"}
            </p>
            {billingMessage ? (
              <p className="mt-2 text-xs text-red-600">{billingMessage}</p>
            ) : null}
            {planTier !== "pro" && billing?.authenticated ? (
              <div className="relative mt-4 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/15">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-950 opacity-95 dark:from-sky-400 dark:via-indigo-700 dark:to-slate-950"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.35),_transparent_55%)] opacity-90 dark:opacity-40" />
                <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <p className="font-display text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    Get Pro
                  </p>
                  <button
                    type="button"
                    disabled={billingBusy}
                    onClick={() => void startProCheckout()}
                    className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 shadow-md transition hover:bg-white/95 disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  >
                    Get Pro
                  </button>
                </div>
              </div>
            ) : null}
            {!billing?.authenticated ? (
              <p className="mt-3 text-xs text-muted">
                Sign in to subscribe to Pro individually. Fleet billing:{" "}
                <Link href="/company" className="font-medium text-sky underline">
                  Fleet
                </Link>
                .
              </p>
            ) : planTier === "pro" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {billing.portalUser ? (
                  <button
                    type="button"
                    disabled={billingBusy}
                    onClick={() => void openUserPortal()}
                    className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold text-ink transition hover:bg-ice disabled:opacity-50"
                  >
                    Manage subscription
                  </button>
                ) : (
                  <span className="text-xs text-muted">
                    Billing portal opens after your first Checkout completes.
                  </span>
                )}
              </div>
            ) : null}
            {fleetEnabled ? (
              <p className="mt-2 text-xs text-muted">
                Org billing:{" "}
                <Link href="/company" className="font-medium text-sky underline">
                  open fleet page
                </Link>
              </p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Manage subscription updates your payment method, plan, invoices,
              and billing details in Stripe.
            </p>
          </div>

          <div className="rounded-xl border border-ink/10 bg-ice/35 p-4">
            <h2 className="mb-1 font-display text-sm font-bold text-ink">
              Quick destinations
            </h2>
            <p className="text-xs text-muted">
              {filledSlots > 0
                ? `${filledSlots} saved destination${filledSlots === 1 ? "" : "s"} (max ${MAX_DRIVER_QUICK_NAVS}).`
                : `No saved spots yet — add up to ${MAX_DRIVER_QUICK_NAVS} for one-tap navigation.`}
            </p>
            <Link
              href="/dashboard/quick-nav"
              onClick={onClose}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky underline-offset-2 hover:underline"
            >
              Manage destinations →
            </Link>
          </div>

          <div className="border-t border-ink/10 pt-2">
            <p className="mb-2 font-display text-sm font-bold text-ink">
              App
            </p>
            <nav className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10">
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-ice"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun className="size-4 text-muted" strokeWidth={2} />
                  ) : (
                    <Moon className="size-4 text-muted" strokeWidth={2} />
                  )}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
                <ChevronRight className="size-4 text-muted" />
              </button>
              {session?.user?.isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ice"
                  onClick={onClose}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="size-4 text-deep" />
                    Admin
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              ) : null}
              <Link
                href="/insights"
                className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ice"
                onClick={onClose}
              >
                Insights
                <ChevronRight className="size-4 text-muted" />
              </Link>
              <Link
                href="/social"
                className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ice"
                onClick={onClose}
              >
                Crowd
                <ChevronRight className="size-4 text-muted" />
              </Link>
              <Link
                href="/company"
                className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ice"
                onClick={onClose}
              >
                Fleet
                <ChevronRight className="size-4 text-muted" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAlertPreferences();
                }}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-ice"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted" />
                  Notifications &amp; alerts
                </span>
                <ChevronRight className="size-4 text-muted" />
              </button>
            </nav>
          </div>

          {session?.user ? (
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/55"
            >
              Sign out
            </button>
          ) : (
            <p className="text-center text-sm text-muted">
              <Link href="/login" className="font-semibold text-sky underline">
                Sign in
              </Link>{" "}
              to sync preferences and subscribe to Pro.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
