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
  billingProMonthlyDollars: string;
  billingProCurrency: string;
  billingProProductName: string;
  billingOrgSeatMonthlyDollars: string;
  billingOrgSeatCurrency: string;
  billingOrgSeatProductName: string;
  oauthGoogleEnabled: boolean;
  oauthGoogleClientId: string;
  oauthGoogleClientSecretSet: boolean;
  oauthAppleEnabled: boolean;
  oauthAppleClientId: string;
  oauthAppleClientSecretSet: boolean;
  oauthAppleTeamId: string;
  oauthAppleKeyId: string;
  oauthApplePrivateKeySet: boolean;
  oauthMicrosoftEnabled: boolean;
  oauthMicrosoftClientId: string;
  oauthMicrosoftClientSecretSet: boolean;
  oauthMicrosoftIssuer: string;
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
  const [stripePriceOrgSeatMonthly, setStripePriceOrgSeatMonthly] =
    useState("");
  const [clearStripeSecretKey, setClearStripeSecretKey] = useState(false);
  const [clearStripeWebhookSecret, setClearStripeWebhookSecret] =
    useState(false);

  const [billingProMonthlyDollars, setBillingProMonthlyDollars] =
    useState("");
  const [billingProCurrency, setBillingProCurrency] = useState("usd");
  const [billingProProductName, setBillingProProductName] = useState("");
  const [clearBillingProAmount, setClearBillingProAmount] = useState(false);

  const [billingOrgSeatMonthlyDollars, setBillingOrgSeatMonthlyDollars] =
    useState("");
  const [billingOrgSeatCurrency, setBillingOrgSeatCurrency] = useState("usd");
  const [billingOrgSeatProductName, setBillingOrgSeatProductName] =
    useState("");
  const [clearBillingOrgSeatAmount, setClearBillingOrgSeatAmount] =
    useState(false);

  const [oauthGoogleEnabled, setOauthGoogleEnabled] = useState(false);
  const [oauthGoogleClientId, setOauthGoogleClientId] = useState("");
  const [oauthGoogleClientSecret, setOauthGoogleClientSecret] = useState("");
  const [clearOauthGoogleClientSecret, setClearOauthGoogleClientSecret] =
    useState(false);

  const [oauthAppleEnabled, setOauthAppleEnabled] = useState(false);
  const [oauthAppleClientId, setOauthAppleClientId] = useState("");
  const [oauthAppleTeamId, setOauthAppleTeamId] = useState("");
  const [oauthAppleKeyId, setOauthAppleKeyId] = useState("");
  const [oauthAppleClientSecret, setOauthAppleClientSecret] = useState("");
  const [oauthApplePrivateKey, setOauthApplePrivateKey] = useState("");
  const [clearOauthAppleClientSecret, setClearOauthAppleClientSecret] =
    useState(false);
  const [clearOauthApplePrivateKey, setClearOauthApplePrivateKey] =
    useState(false);

  const [oauthMicrosoftEnabled, setOauthMicrosoftEnabled] = useState(false);
  const [oauthMicrosoftClientId, setOauthMicrosoftClientId] = useState("");
  const [oauthMicrosoftClientSecret, setOauthMicrosoftClientSecret] =
    useState("");
  const [oauthMicrosoftIssuer, setOauthMicrosoftIssuer] = useState("");
  const [clearOauthMicrosoftClientSecret, setClearOauthMicrosoftClientSecret] =
    useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/settings");
      const j = await r.json();
      if (!r.ok) throw new Error((j as { error?: string }).error || "Load failed");
      const d = j as SettingsGet;
      setData(d);
      setStripePublishableKey(d.stripePublishableKey ?? "");
      setStripePriceProMonthly(d.stripePriceProMonthly ?? "");
      setStripePriceOrgSeatMonthly(d.stripePriceOrgSeatMonthly ?? "");
      setBillingProMonthlyDollars(d.billingProMonthlyDollars ?? "");
      setBillingProCurrency(d.billingProCurrency || "usd");
      setBillingProProductName(d.billingProProductName ?? "");
      setBillingOrgSeatMonthlyDollars(d.billingOrgSeatMonthlyDollars ?? "");
      setBillingOrgSeatCurrency(d.billingOrgSeatCurrency || "usd");
      setBillingOrgSeatProductName(d.billingOrgSeatProductName ?? "");
      setOauthGoogleEnabled(d.oauthGoogleEnabled);
      setOauthGoogleClientId(d.oauthGoogleClientId ?? "");
      setOauthAppleEnabled(d.oauthAppleEnabled);
      setOauthAppleClientId(d.oauthAppleClientId ?? "");
      setOauthAppleTeamId(d.oauthAppleTeamId ?? "");
      setOauthAppleKeyId(d.oauthAppleKeyId ?? "");
      setOauthMicrosoftEnabled(d.oauthMicrosoftEnabled);
      setOauthMicrosoftClientId(d.oauthMicrosoftClientId ?? "");
      setOauthMicrosoftIssuer(d.oauthMicrosoftIssuer ?? "");
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
        clearBillingProAmount,
        clearBillingOrgSeatAmount,
        clearOauthGoogleClientSecret,
        clearOauthAppleClientSecret,
        clearOauthApplePrivateKey,
        clearOauthMicrosoftClientSecret,

        oauthGoogleEnabled,
        oauthGoogleClientId,
        oauthAppleEnabled,
        oauthAppleClientId,
        oauthAppleTeamId,
        oauthAppleKeyId,
        oauthMicrosoftEnabled,
        oauthMicrosoftClientId,
        oauthMicrosoftIssuer,

        billingProMonthlyDollars,
        billingProCurrency,
        billingProProductName,
        billingOrgSeatMonthlyDollars,
        billingOrgSeatCurrency,
        billingOrgSeatProductName,
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

      if (oauthGoogleClientSecret.trim())
        body.oauthGoogleClientSecret = oauthGoogleClientSecret.trim();
      if (oauthAppleClientSecret.trim())
        body.oauthAppleClientSecret = oauthAppleClientSecret.trim();
      if (oauthApplePrivateKey.trim())
        body.oauthApplePrivateKey = oauthApplePrivateKey.trim();
      if (oauthMicrosoftClientSecret.trim())
        body.oauthMicrosoftClientSecret = oauthMicrosoftClientSecret.trim();

      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j as { error?: string }).error || "Save failed");
      setMessage("Saved. OAuth and Stripe caches were reset.");
      setStripeSecretKey("");
      setStripeWebhookSecret("");
      setOauthGoogleClientSecret("");
      setOauthAppleClientSecret("");
      setOauthApplePrivateKey("");
      setOauthMicrosoftClientSecret("");
      setClearStripeSecretKey(false);
      setClearStripeWebhookSecret(false);
      setClearBillingProAmount(false);
      setClearBillingOrgSeatAmount(false);
      setClearOauthGoogleClientSecret(false);
      setClearOauthAppleClientSecret(false);
      setClearOauthApplePrivateKey(false);
      setClearOauthMicrosoftClientSecret(false);
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
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

      <details className="rounded-xl border border-sky/25 bg-sky/5 p-4">
        <summary className="cursor-pointer font-display text-sm font-bold text-ink">
          Setup instructions (environment, OAuth URLs, Stripe)
        </summary>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted [&_code]:rounded [&_code]:bg-ink/5 [&_code]:px-1">
          <p>
            <strong className="text-ink">Host URL &amp; cookie signing:</strong>{" "}
            Set <code>AUTH_SECRET</code> (long random string) and{" "}
            <code>AUTH_URL</code> or <code>NEXTAUTH_URL</code> to your public
            origin (e.g. <code>https://your-domain.com</code>). Auth.js builds
            OAuth redirect URLs from this; local dev uses{" "}
            <code>http://localhost:3000</code>.
          </p>
          <p>
            <strong className="text-ink">Google:</strong> Google Cloud Console →
            APIs &amp; Services → Credentials → OAuth client ID (Web). Add
            authorized redirect URI:{" "}
            <code>{`{YOUR_SITE}/api/auth/callback/google`}</code>. Paste Client
            ID and Client secret below and enable the toggle.
          </p>
          <p>
            <strong className="text-ink">Apple:</strong> Apple Developer →
            Identifiers → Services ID with Sign in with Apple. Return URL:{" "}
            <code>{`{YOUR_SITE}/api/auth/callback/apple`}</code>. Apple requires
            HTTPS (no plain localhost). Either paste a rotating client secret JWT,
            or provide Team ID + Key ID + Services ID + the full{" "}
            <code>.p8</code> private key text (the server generates JWTs).
          </p>
          <p>
            <strong className="text-ink">Microsoft:</strong> Azure Portal →
            Microsoft Entra ID → App registrations. Platform: Web. Redirect URI:{" "}
            <code>{`{YOUR_SITE}/api/auth/callback/microsoft-entra-id`}</code>.
            Create a client secret; copy Application (client) ID and secret.
            Optional issuer: leave blank for multi-tenant{" "}
            <code>/common</code>, or set{" "}
            <code>
              https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/
            </code>{" "}
            for one tenant only.
          </p>
          <p>
            <strong className="text-ink">Stripe:</strong> Dashboard → Developers
            → API keys (<code>sk_…</code>, webhook <code>whsec_…</code>). For Pro
            billing you can either create a Product with a monthly recurring{" "}
            <code>price_…</code> ID and paste it here, or leave Price ID empty and
            set the monthly amount + currency below (Checkout uses dynamic{" "}
            <code>price_data</code>). If both are set, the Stripe Price ID wins.
            Minimum charge is typically USD $0.50.
          </p>
        </div>
      </details>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-ink">
          Social sign-in (database-stored)
        </h3>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={oauthGoogleEnabled}
              onChange={(e) => setOauthGoogleEnabled(e.target.checked)}
            />
            Enable Google
          </label>
          <input
            value={oauthGoogleClientId}
            onChange={(e) => setOauthGoogleClientId(e.target.value)}
            placeholder="Google Client ID"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted">
            Client secret:{" "}
            {data.oauthGoogleClientSecretSet ? "stored — enter to replace" : "not set"}
          </p>
          <input
            type="password"
            autoComplete="off"
            placeholder="Google Client Secret (leave blank to keep)"
            value={oauthGoogleClientSecret}
            onChange={(e) => setOauthGoogleClientSecret(e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearOauthGoogleClientSecret}
              onChange={(e) => setClearOauthGoogleClientSecret(e.target.checked)}
            />
            Clear Google client secret from database
          </label>
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={oauthAppleEnabled}
              onChange={(e) => setOauthAppleEnabled(e.target.checked)}
            />
            Enable Apple
          </label>
          <input
            value={oauthAppleClientId}
            onChange={(e) => setOauthAppleClientId(e.target.value)}
            placeholder="Services ID (Apple Client ID)"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={oauthAppleTeamId}
              onChange={(e) => setOauthAppleTeamId(e.target.value)}
              placeholder="Team ID"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
            />
            <input
              value={oauthAppleKeyId}
              onChange={(e) => setOauthAppleKeyId(e.target.value)}
              placeholder="Key ID"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
            />
          </div>
          <textarea
            value={oauthApplePrivateKey}
            onChange={(e) => setOauthApplePrivateKey(e.target.value)}
            placeholder="Optional: full .p8 private key (PEM). If set with Team ID + Key ID, server generates client secret JWT."
            rows={4}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 font-mono text-xs"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearOauthApplePrivateKey}
              onChange={(e) => setClearOauthApplePrivateKey(e.target.checked)}
            />
            Clear stored Apple private key
          </label>
          <p className="text-xs text-muted">
            Manual client secret JWT (optional alternative to .p8):{" "}
            {data.oauthAppleClientSecretSet ? "stored" : "not set"}
          </p>
          <input
            type="password"
            autoComplete="off"
            placeholder="Apple client secret JWT (leave blank to keep)"
            value={oauthAppleClientSecret}
            onChange={(e) => setOauthAppleClientSecret(e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearOauthAppleClientSecret}
              onChange={(e) =>
                setClearOauthAppleClientSecret(e.target.checked)
              }
            />
            Clear manual Apple client secret from database
          </label>
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={oauthMicrosoftEnabled}
              onChange={(e) => setOauthMicrosoftEnabled(e.target.checked)}
            />
            Enable Microsoft (Entra ID)
          </label>
          <input
            value={oauthMicrosoftClientId}
            onChange={(e) => setOauthMicrosoftClientId(e.target.value)}
            placeholder="Application (client) ID"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted">
            Client secret:{" "}
            {data.oauthMicrosoftClientSecretSet
              ? "stored — enter to replace"
              : "not set"}
          </p>
          <input
            type="password"
            autoComplete="off"
            placeholder="Client secret value (leave blank to keep)"
            value={oauthMicrosoftClientSecret}
            onChange={(e) => setOauthMicrosoftClientSecret(e.target.value)}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearOauthMicrosoftClientSecret}
              onChange={(e) =>
                setClearOauthMicrosoftClientSecret(e.target.checked)
              }
            />
            Clear Microsoft client secret from database
          </label>
          <input
            value={oauthMicrosoftIssuer}
            onChange={(e) => setOauthMicrosoftIssuer(e.target.value)}
            placeholder="Issuer (optional — blank = …/common/v2.0/)"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-ink">
          Pro &amp; fleet pricing
        </h3>
        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <p className="text-xs text-muted">
            If a Stripe Price ID is set below, it is used for Checkout. Otherwise
            use monthly amount + currency (minimum ≈ $0.50 USD equivalent).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase text-muted">
              Pro — monthly amount
              <input
                type="text"
                inputMode="decimal"
                value={billingProMonthlyDollars}
                onChange={(e) => setBillingProMonthlyDollars(e.target.value)}
                placeholder="e.g. 9.99"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-bold uppercase text-muted">
              Currency (ISO)
              <input
                value={billingProCurrency}
                onChange={(e) => setBillingProCurrency(e.target.value)}
                placeholder="usd"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase text-muted">
            Checkout line item name
            <input
              value={billingProProductName}
              onChange={(e) => setBillingProProductName(e.target.value)}
              placeholder="Pro — monthly"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearBillingProAmount}
              onChange={(e) => setClearBillingProAmount(e.target.checked)}
            />
            Clear stored Pro amount (use Price ID or env only)
          </label>

          <div className="border-t border-ink/10 pt-3 mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase text-muted">
              Org seat — monthly amount / seat
              <input
                type="text"
                inputMode="decimal"
                value={billingOrgSeatMonthlyDollars}
                onChange={(e) =>
                  setBillingOrgSeatMonthlyDollars(e.target.value)
                }
                placeholder="e.g. 12.00"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-bold uppercase text-muted">
              Currency
              <input
                value={billingOrgSeatCurrency}
                onChange={(e) => setBillingOrgSeatCurrency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase text-muted">
            Seat line item name
            <input
              value={billingOrgSeatProductName}
              onChange={(e) => setBillingOrgSeatProductName(e.target.value)}
              placeholder="Fleet seat — monthly"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={clearBillingOrgSeatAmount}
              onChange={(e) => setClearBillingOrgSeatAmount(e.target.checked)}
            />
            Clear stored org seat amount
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-ink">Stripe API</h3>

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
            Publishable key (optional reference / client)
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
            Price ID — Pro monthly (price_…), optional if amount above set
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
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-sky px-6 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-deep disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save all platform settings"}
      </button>
    </form>
  );
}
