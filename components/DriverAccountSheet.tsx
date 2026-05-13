"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Trash2,
  Crosshair,
  Tag,
  Shield,
} from "lucide-react";
import {
  type DriverShortcut,
  MAX_DRIVER_QUICK_NAVS,
  DRIVER_QUICK_NAV_LABEL_MAX,
  parseDriverQuickNavsJson,
} from "@/lib/driverShortcuts";
import {
  PRO_BENEFITS_HEADLINE,
  getProBenefitBullets,
} from "@/lib/proPlanCopy";

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
  onQuickNavsSaved: (navs: DriverShortcut[]) => void;
  onOpenAlertPreferences: () => void;
};

type DraftNavRow = {
  id: string;
  label: string;
  latStr: string;
  lngStr: string;
};

function quickNavsToDraft(rows: DriverShortcut[]): DraftNavRow[] {
  return rows.map((n) => ({
    id: n.id,
    label: n.label,
    latStr: String(n.lat),
    lngStr: String(n.lng),
  }));
}

function draftToShortcuts(rows: DraftNavRow[]): DriverShortcut[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.label.trim(),
    lat: Number(r.latStr),
    lng: Number(r.lngStr),
  }));
}

export default function DriverAccountSheet({
  open,
  onClose,
  userName,
  userEmail,
  tier: tierProp,
  quickNavs,
  onQuickNavsSaved,
  onOpenAlertPreferences,
}: Props) {
  const { data: session } = useSession();
  const [draftNavs, setDraftNavs] = useState<DraftNavRow[]>([]);
  const [navMessage, setNavMessage] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftNavs(quickNavsToDraft(quickNavs));
    setNavMessage(null);
    setBillingMessage(null);
  }, [open, quickNavs]);

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

  const saveQuickNavs = () => {
    const nonEmpty = draftNavs.filter(
      (r) =>
        r.label.trim().length > 0 ||
        r.latStr.trim().length > 0 ||
        r.lngStr.trim().length > 0,
    );
    const asShortcuts = draftToShortcuts(nonEmpty);
    const parsed = parseDriverQuickNavsJson(asShortcuts);
    if (parsed === null) {
      setNavMessage(
        `Check each destination: label (1–${DRIVER_QUICK_NAV_LABEL_MAX} chars), valid latitude (−90–90) and longitude (−180–180). Max ${MAX_DRIVER_QUICK_NAVS} slots. Remove incomplete rows or fill every field.`,
      );
      return;
    }
    setNavMessage(null);
    onQuickNavsSaved(parsed);
  };

  const addSlot = () => {
    if (draftNavs.length >= MAX_DRIVER_QUICK_NAVS) return;
    setDraftNavs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        latStr: "",
        lngStr: "",
      },
    ]);
  };

  const removeSlot = (id: string) => {
    setDraftNavs((prev) => prev.filter((n) => n.id !== id));
  };

  const updateDraftRow = (id: string, patch: Partial<DraftNavRow>) => {
    setDraftNavs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    );
  };

  const fillLabelFromCoords = async (id: string, latStr: string, lngStr: string) => {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
      const r = await fetch(
        `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      );
      const data = (await r.json()) as { line?: string | null };
      if (data.line)
        updateDraftRow(id, {
          label: data.line.slice(0, DRIVER_QUICK_NAV_LABEL_MAX),
        });
    } catch {
      // ignore
    }
  };

  const useMyLocation = (id: string) => {
    if (!navigator.geolocation) {
      setNavMessage("Location not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateDraftRow(id, { latStr: String(lat), lngStr: String(lng) });
        setNavMessage(null);
      },
      () => setNavMessage("Could not read your location."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const fleetEnabled = billing?.authenticated && billing.organization?.id;

  if (!open) return null;

  const bullets = getProBenefitBullets();

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
            <p className="mt-2 text-xs font-semibold text-ink">
              {PRO_BENEFITS_HEADLINE}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {billingMessage ? (
              <p className="mt-2 text-xs text-red-600">{billingMessage}</p>
            ) : null}
            {!billing?.authenticated ? (
              <p className="mt-2 text-xs text-muted">
                Sign in to subscribe to Pro individually. Fleet billing:{" "}
                <Link href="/company" className="font-medium text-sky underline">
                  Fleet
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {planTier !== "pro" && (
                  <button
                    type="button"
                    disabled={billingBusy}
                    onClick={() => void startProCheckout()}
                    className="rounded-lg bg-sky px-3 py-2 text-sm font-semibold text-paper transition hover:bg-deep disabled:opacity-50"
                  >
                    Upgrade to Pro
                  </button>
                )}
                {billing.portalUser ? (
                  <button
                    type="button"
                    disabled={billingBusy}
                    onClick={() => void openUserPortal()}
                    className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold text-ink transition hover:bg-ice disabled:opacity-50"
                  >
                    Manage subscription
                  </button>
                ) : planTier === "pro" ? (
                  <span className="text-xs text-muted">
                    Billing portal opens after your first Checkout completes.
                  </span>
                ) : null}
              </div>
            )}
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

          <div>
            <h2 className="mb-2 font-display text-sm font-bold text-ink">
              Quick destinations
            </h2>
            <p className="mb-3 text-xs text-muted">
              Add up to {MAX_DRIVER_QUICK_NAVS} places for one-tap navigation on
              the map. No defaults — only what you save here appears.
            </p>
            <div className="space-y-3">
              {draftNavs.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-ink/12 bg-paper p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">
                      Destination
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlot(n.id)}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-700"
                      aria-label="Remove destination"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <label className="mb-2 block">
                    <span className="mb-1 block text-[11px] text-muted">
                      Label
                    </span>
                    <input
                      type="text"
                      value={n.label}
                      maxLength={DRIVER_QUICK_NAV_LABEL_MAX}
                      onChange={(e) =>
                        updateDraftRow(n.id, { label: e.target.value })
                      }
                      placeholder="e.g. Home base"
                      className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
                    />
                  </label>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <label>
                      <span className="mb-1 block text-[11px] text-muted">
                        Lat
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={n.latStr}
                        onChange={(e) =>
                          updateDraftRow(n.id, { latStr: e.target.value })
                        }
                        className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] text-muted">
                        Lng
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={n.lngStr}
                        onChange={(e) =>
                          updateDraftRow(n.id, { lngStr: e.target.value })
                        }
                        className="w-full rounded-lg border border-ink/15 bg-ice/40 px-2 py-2 text-sm text-ink"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => useMyLocation(n.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-ink/12 bg-white px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ice"
                    >
                      <Crosshair className="size-3.5" />
                      Use my location
                    </button>
                    <button
                      type="button"
                      onClick={() => fillLabelFromCoords(n.id, n.latStr, n.lngStr)}
                      className="inline-flex items-center gap-1 rounded-lg border border-ink/12 bg-white px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ice"
                    >
                      <Tag className="size-3.5" />
                      Label from map point
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {draftNavs.length < MAX_DRIVER_QUICK_NAVS ? (
              <button
                type="button"
                onClick={addSlot}
                className="mt-3 w-full rounded-xl border border-dashed border-ink/20 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ice"
              >
                + Add destination ({draftNavs.length}/{MAX_DRIVER_QUICK_NAVS})
              </button>
            ) : null}
            {navMessage ? (
              <p className="mt-2 text-xs text-amber-800">{navMessage}</p>
            ) : null}
            <button
              type="button"
              onClick={saveQuickNavs}
              className="mt-3 w-full rounded-xl bg-sky py-3 text-sm font-semibold text-paper transition hover:bg-deep"
            >
              Save quick destinations
            </button>
          </div>

          <div className="border-t border-ink/10 pt-2">
            <p className="mb-2 font-display text-sm font-bold text-ink">
              App
            </p>
            <nav className="divide-y divide-ink/10 rounded-xl border border-ink/10 overflow-hidden">
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
              className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100"
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
