"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type SettingsGet = {
  sources: { stripeSecretKey: string; stripeWebhookSecret: string };
  stripeSecretKey: string;
  stripeSecretKeySet: boolean;
  stripeWebhookSecret: string;
  stripeWebhookSecretSet: boolean;
  stripePublishableKey: string;
  stripePriceProMonthly: string;
  stripePriceOrgSeatMonthly: string;
  hint: string;
};

export default function PlatformSettingsForm() {
  const [data, setData] = useState<SettingsGet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripePriceProMonthly, setStripePriceProMonthly] = useState("");
  const [stripePriceOrgSeatMonthly, setStripePriceOrgSeatMonthly] = useState("");
  const [clearStripeSecretKey, setClearStripeSecretKey] = useState(false);
  const [clearStripeWebhookSecret, setClearStripeWebhookSecret] =
    useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/settings");
      const j = await r.json();
      if (!r.ok) throw new Error((j as { error?: string }).error || "Load failed");
      setData(j as SettingsGet);
      setStripePublishableKey(j.stripePublishableKey ?? "");
      setStripePriceProMonthly(j.stripePriceProMonthly ?? "");
      setStripePriceOrgSeatMonthly(j.stripePriceOrgSeatMonthly ?? "");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        clearStripeSecretKey,
        clearStripeWebhookSecret,
      };
      if (stripeSecretKey.trim()) body.stripeSecretKey = stripeSecretKey.trim();
      if (stripeWebhookSecret.trim())
        body.stripeWebhookSecret = stripeWebhookSecret.trim();
      if (stripePublishableKey.trim())
        body.stripePublishableKey = stripePublishableKey.trim();
      if (stripePriceProMonthly.trim())
        body.stripePriceProMonthly = stripePriceProMonthly.trim();
      if (stripePriceOrgSeatMonthly.trim())
        body.stripePriceOrgSeatMonthly = stripePriceOrgSeatMonthly.trim();

      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Save failed");
      setMessage("Saved. Stripe clients cache was reset.");
      setStripeSecretKey("");
      setStripeWebhookSecret("");
      setClearStripeSecretKey(false);
      setClearStripeWebhookSecret(false);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Loading settings…</p>;
  if (!data) {
    return (
      <p className="text-red-700">{message || "Could not load settings."}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.startsWith("Saved")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-xs text-muted">{data.hint}</p>

      <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted">
          Secret key ({data.sources.stripeSecretKey})
        </p>
        <p className="text-xs">
          Current:{" "}
          <span className="font-mono">
            {data.stripeSecretKeySet ? data.stripeSecretKey || "set" : "unset"}
          </span>
        </p>
        <input
          type="password"
          autoComplete="off"
          placeholder="sk_live_… or sk_test_… (leave blank to keep)"
          value={stripeSecretKey}
          onChange={(e) => setStripeSecretKey(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={clearStripeSecretKey}
            onChange={(e) => setClearStripeSecretKey(e.target.checked)}
          />
          Clear database override (use env STRIPE_SECRET_KEY only)
        </label>
      </div>

      <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted">
          Webhook signing secret ({data.sources.stripeWebhookSecret})
        </p>
        <p className="text-xs">
          Current:{" "}
          <span className="font-mono">
            {data.stripeWebhookSecretSet
              ? data.stripeWebhookSecret || "set"
              : "unset"}
          </span>
        </p>
        <input
          type="password"
          autoComplete="off"
          placeholder="whsec_…"
          value={stripeWebhookSecret}
          onChange={(e) => setStripeWebhookSecret(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={clearStripeWebhookSecret}
            onChange={(e) => setClearStripeWebhookSecret(e.target.checked)}
          />
          Clear database override (use env STRIPE_WEBHOOK_SECRET only)
        </label>
      </div>

      <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-2">
        <label className="block text-xs font-bold uppercase text-muted">
          Publishable key (optional — stored for reference; expose to client via
          env for Checkout.js)
        </label>
        <input
          value={stripePublishableKey}
          onChange={(e) => setStripePublishableKey(e.target.value)}
          placeholder="pk_live_…"
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-2">
        <label className="block text-xs font-bold uppercase text-muted">
          Price ID — Pro monthly (price_…)
        </label>
        <input
          value={stripePriceProMonthly}
          onChange={(e) => setStripePriceProMonthly(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-2">
        <label className="block text-xs font-bold uppercase text-muted">
          Price ID — Org seat monthly (price_…)
        </label>
        <input
          value={stripePriceOrgSeatMonthly}
          onChange={(e) => setStripePriceOrgSeatMonthly(e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-sky px-6 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-deep disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save platform settings"}
      </button>
    </form>
  );
}
