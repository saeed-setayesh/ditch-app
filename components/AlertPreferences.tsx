"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { CITIES } from "@/lib/cities";
import {
  MAX_RADIUS_FREE_KM,
  MAX_RADIUS_PRO_KM,
  PRO_BENEFITS_HEADLINE,
  getProBenefitBullets,
} from "@/lib/proPlanCopy";

const INCIDENT_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Accident" },
  { value: 8, label: "Road closed" },
  { value: 14, label: "Broken down vehicle" },
  { value: 7, label: "Lane closed" },
  { value: 9, label: "Road works" },
  { value: 6, label: "Jam" },
  { value: 3, label: "Dangerous conditions" },
];

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

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
  onClose?: () => void;
  initialRadius?: number;
  initialTypes?: number[];
  initialSeverityMin?: number | null;
  initialQuietStart?: string | null;
  initialQuietEnd?: string | null;
  initialCityId?: string;
  initialTier?: "free" | "pro";
  initialMinTowScore?: number | null;
  initialIncidentSources?: string[];
  onSaved?: (prefs: { cityId?: string; incidentSources?: string[] }) => void;
};

const MAX_RADIUS_FREE = MAX_RADIUS_FREE_KM;
const MAX_RADIUS_PRO = MAX_RADIUS_PRO_KM;

export default function AlertPreferences({
  onClose,
  initialRadius = 2,
  initialTypes = [],
  initialSeverityMin = null,
  initialQuietStart = null,
  initialQuietEnd = null,
  initialCityId = "DitchApp",
  initialTier = "free",
  initialMinTowScore = null,
  initialIncidentSources = ["tomtom"],
  onSaved,
}: Props) {
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [types, setTypes] = useState<number[]>(initialTypes);
  const [severityMin, setSeverityMin] = useState<number | "">(
    initialSeverityMin ?? "",
  );
  const [quietStart, setQuietStart] = useState(initialQuietStart ?? "22:00");
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd ?? "06:00");
  const [cityId, setCityId] = useState(initialCityId);
  const [minTowScore, setMinTowScore] = useState<number | "">(
    initialMinTowScore ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const DEFAULT_SOURCES = ["tomtom", "511on"];
  const [incidentSources, setIncidentSources] = useState<string[]>(
    Array.from(
      new Set([...(initialIncidentSources ?? []), ...DEFAULT_SOURCES]),
    ),
  );
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    setIncidentSources(
      Array.from(
        new Set([...(initialIncidentSources ?? []), ...DEFAULT_SOURCES]),
      ),
    );
  }, [initialIncidentSources]);

  const planTier: "free" | "pro" =
    billing == null
      ? initialTier
      : billing.tier === "pro"
        ? "pro"
        : "free";

  const maxRadius = planTier === "pro" ? MAX_RADIUS_PRO : MAX_RADIUS_FREE;
  const cappedRadius = Math.min(radiusKm, maxRadius);

  const startProCheckout = async () => {
    setBillingBusy(true);
    setMessage(null);
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
      setMessage(data.error ?? "Could not start checkout.");
    } catch {
      setMessage("Could not start checkout.");
    } finally {
      setBillingBusy(false);
    }
  };

  const openUserPortal = async () => {
    setBillingBusy(true);
    setMessage(null);
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
      setMessage(data.error ?? "Billing portal unavailable.");
    } catch {
      setMessage("Billing portal unavailable.");
    } finally {
      setBillingBusy(false);
    }
  };

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch("/api/push/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          radiusKm: cappedRadius,
          incidentTypeFilter: types.length > 0 ? types : null,
          severityMin: severityMin === "" ? null : severityMin,
          quietHoursStart: quietStart || null,
          quietHoursEnd: quietEnd || null,
          cityId: cityId || null,
          minTowScore:
            planTier === "pro" && minTowScore !== "" ? minTowScore : null,
          incidentSources,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setMessage("Preferences saved.");
      onSaved?.({ cityId, incidentSources });
      onClose?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [
    radiusKm,
    cappedRadius,
    types,
    severityMin,
    quietStart,
    quietEnd,
    cityId,
    planTier,
    minTowScore,
    incidentSources,
    onSaved,
    onClose,
  ]);

  const toggleType = (value: number) => {
    setTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };

  const fleetEnabled = billing?.authenticated && billing.organization?.id;

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-display font-bold text-ink">Alert preferences</h3>

      <div>
        <label className="mb-1 block text-sm text-muted">
          City (alerts & map)
        </label>
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-ink/10 bg-ice/40 p-3">
        <p className="text-sm font-semibold text-ink">
          Plan ·{" "}
          {planTier === "pro"
            ? "Pro"
            : "Free"}
        </p>
        {planTier !== "pro" ? (
          <p className="mt-2 text-xs font-semibold text-ink">
            {PRO_BENEFITS_HEADLINE}
          </p>
        ) : null}
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
          {getProBenefitBullets().map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Unlocked with a Pro subscription through Stripe.
        </p>
        {!billing?.authenticated ? (
          <p className="mt-2 text-xs text-muted">
            Sign in to manage an individual subscription. Fleet seats live under{" "}
            <Link href="/company" className="font-medium text-sky underline">
              Fleet billing
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
                className="rounded-lg bg-sky px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-deep disabled:opacity-50"
              >
                Upgrade to Pro
              </button>
            )}
            {billing.portalUser ? (
              <button
                type="button"
                disabled={billingBusy}
                onClick={() => void openUserPortal()}
                className="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-ice disabled:opacity-50"
              >
                Manage billing
              </button>
            ) : (
              planTier === "pro" && (
                <span className="text-xs text-muted">
                  Stripe customer portal appears after Checkout completes once.
                </span>
              )
            )}
          </div>
        )}
        {fleetEnabled ? (
          <p className="mt-2 text-xs text-muted">
            Organization billing:{" "}
            <Link href="/company" className="font-medium text-sky underline">
              open fleet page
            </Link>
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Incident sources
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={incidentSources.includes("tomtom")}
              onChange={() =>
                setIncidentSources((prev) =>
                  prev.includes("tomtom")
                    ? prev.filter((s) => s !== "tomtom")
                    : [...prev, "tomtom"],
                )
              }
              className="rounded border-ink/25 text-sky focus:ring-sky"
            />
            <span className="text-sm text-ink">TomTom (live incidents)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={incidentSources.includes("511on")}
              onChange={() =>
                setIncidentSources((prev) =>
                  prev.includes("511on")
                    ? prev.filter((s) => s !== "511on")
                    : [...prev, "511on"],
                )
              }
              className="rounded border-ink/25 text-sky focus:ring-sky"
            />
            <span className="text-sm text-ink">Ontario 511</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={incidentSources.includes("inrix")}
              onChange={() =>
                setIncidentSources((prev) =>
                  prev.includes("inrix")
                    ? prev.filter((s) => s !== "inrix")
                    : [...prev, "inrix"],
                )
              }
              className="rounded border-ink/25 text-sky focus:ring-sky"
            />
            <span className="text-sm text-ink">INRIX (requires API key)</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-muted">
          Select sources to combine for live incident data. INRIX needs
          INRIX_APP_ID and INRIX_APP_KEY in .env.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Alert radius (km) — max {maxRadius} on {planTier}
        </label>
        <input
          type="number"
          min={0.5}
          max={maxRadius}
          step={0.5}
          value={radiusKm > maxRadius ? maxRadius : radiusKm}
          onChange={(e) =>
            setRadiusKm(Math.min(parseFloat(e.target.value) || 2, maxRadius))
          }
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">
          Incident types to alert
        </label>
        <div className="flex flex-wrap gap-2">
          {INCIDENT_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                checked={types.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
                className="rounded border-ink/25 text-sky focus:ring-sky"
              />
              <span className="text-sm text-ink">{opt.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Leave empty for all types.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Min severity (0–4)
        </label>
        <select
          value={severityMin === "" ? "" : severityMin}
          onChange={(e) =>
            setSeverityMin(
              e.target.value === "" ? "" : parseInt(e.target.value, 10),
            )
          }
          className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
        >
          <option value="">Any</option>
          <option value={0}>0 – Unknown</option>
          <option value={1}>1 – Minor</option>
          <option value={2}>2 – Moderate</option>
          <option value={3}>3 – Major</option>
          <option value={4}>4 – Road closure</option>
        </select>
      </div>

      {planTier === "pro" && (
        <div>
          <label className="mb-1 block text-sm text-muted">
            Min tow score (Pro) — only alert if incident score ≥
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={minTowScore === "" ? "" : minTowScore}
            onChange={(e) =>
              setMinTowScore(
                e.target.value === "" ? "" : parseInt(e.target.value, 10),
              )
            }
            placeholder="0–100, e.g. 50"
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-muted">
          Quiet hours (no alerts)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
          />
          <span className="text-muted">to</span>
          <input
            type="time"
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${message.includes("saved") ? "text-deep" : "text-amber-700"}`}
        >
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-sky px-4 py-2 font-semibold text-paper transition hover:bg-deep disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink/12 bg-ice/80 px-4 py-2 font-semibold text-ink transition hover:bg-ice"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
