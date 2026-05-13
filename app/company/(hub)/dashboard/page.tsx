"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Bell,
  MapPin,
  Radio,
  Shield,
  UserPlus,
  Webhook,
} from "lucide-react";

const POLL_MS = 90_000;

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

/** Overview — no TomTom; dispatch is /company/dispatch */
export default function CompanyDashboardPage() {
  const { data: session } = useSession();
  const orgName = session?.user?.orgName ?? "";
  const orgRole = session?.user?.orgRole;

  const roleLabel =
    orgRole === "admin"
      ? "Admin"
      : orgRole === "driver"
        ? "Driver"
        : orgRole
          ? orgRole.charAt(0).toUpperCase() + orgRole.slice(1)
          : "Member";

  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<
    { id: string; description: string }[]
  >([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const params = new URLSearchParams({ city: "DitchApp" });
      if (deviceId) params.set("deviceId", deviceId);
      const res = await fetch(`/api/incidents?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load incidents summary");
      const data = await res.json();
      const list = (data.incidents ?? []) as {
        id: string;
        description?: string;
      }[];
      setLiveCount(list.length);
      setPreview(
        list.slice(0, 5).map((i) => ({
          id: i.id,
          description: i.description ?? "Incident",
        })),
      );
      setSummaryError(null);
    } catch (e) {
      setSummaryError(
        e instanceof Error ? e.message : "Failed to refresh summary",
      );
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
    const t = setInterval(() => void fetchSummary(), POLL_MS);
    return () => clearInterval(t);
  }, [fetchSummary]);

  const liveLabel = liveCount === null ? "—" : String(liveCount);

  const kpiCards: [string, string, string][] = [
    ["Live incidents", liveLabel, "DitchApp · API feed"],
    ["Active jobs", "9", "TMS integration pending"],
    ["Avg response", "11m", "Target 12m"],
    ["Today revenue", "$4,820", "Estimate · sample"],
  ];

  return (
    <>
      <div className="hidden border-b border-ink/8 bg-paper px-6 py-6 md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Overview
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {orgName} · {roleLabel}. Key metrics and operator tools (UI previews
          for upcoming backend features). Open{" "}
          <Link href="/company/dispatch" className="font-semibold text-deep hover:text-sky">
            Dispatch
          </Link>{" "}
          for the live map and full queue — the map loads only there.
        </p>
      </div>

      <div className="border-b border-ink/8 bg-paper px-4 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Dashboard</h1>
        <p className="mt-0.5 text-xs text-muted">{orgName}</p>
      </div>

      <div className="space-y-6 p-4 pb-10 md:space-y-8 md:p-6 md:pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map(([label, value, sub]) => (
            <div
              key={label}
              className="flex flex-col rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm sm:p-6"
            >
              <div className="min-h-[2.5rem] font-mono-brand text-[10px] font-semibold uppercase leading-snug tracking-wide text-muted sm:text-[11px]">
                {label}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                  {value}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{sub}</p>
            </div>
          ))}
        </div>

        {summaryError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
            {summaryError}
          </p>
        ) : null}

        <Link
          href="/company/dispatch"
          className="group flex flex-col gap-5 rounded-2xl border-2 border-sky/25 bg-gradient-to-br from-paper via-ice/50 to-sky/10 p-6 shadow-sm transition hover:border-sky/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
        >
          <div className="flex flex-1 items-start gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-paper shadow-md">
              <MapPin className="size-7" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="font-display text-xl font-bold text-ink">
                Live dispatch
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted">
                Full-screen TomTom map, traffic flow, incident queue, filters,
                and geolocation — same experience as the driver app map view.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-end rounded-xl bg-deep px-5 py-3 text-sm font-semibold text-paper sm:self-center">
            Open dispatch
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm sm:p-7">
            <h3 className="font-display text-base font-bold text-ink">
              Recent incidents
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Preview from the API. Use Dispatch for the interactive list and
              map.
            </p>
            <ul className="mt-5 divide-y divide-ink/10">
              {preview.length === 0 ? (
                <li className="py-4 text-sm text-muted">
                  {liveCount === null
                    ? "Loading…"
                    : "No incidents in the current response."}
                </li>
              ) : (
                preview.map((row) => (
                  <li key={row.id} className="py-4 first:pt-0">
                    <span className="font-mono-brand text-[10px] font-medium text-muted">
                      {row.id.slice(0, 10)}…
                    </span>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-ink">
                      {row.description}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm sm:p-7">
            <h3 className="font-display text-base font-bold text-ink">
              Quick links
            </h3>
            <nav className="mt-4 flex flex-col gap-2">
              {[
                ["/company/dispatch", "Dispatch", "Map & queue"],
                ["/company/fleet", "Fleet", "Trucks & status"],
                ["/company/jobs", "Jobs", "Tickets"],
                ["/company/billing", "Billing", "Seats & Stripe"],
              ].map(([href, title, sub]) => (
                <Link
                  key={href as string}
                  href={href as string}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-ice/30 px-4 py-3.5 text-left transition hover:border-sky/30 hover:bg-ice/60"
                >
                  <span className="font-semibold text-ink">{title}</span>
                  <span className="text-xs text-muted">{sub}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Feature UI previews (no backend yet) */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">
            Operator tools
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Layouts for capabilities we discussed — wire to APIs when ready.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Radio className="size-4 text-sky" />
                Assignment board
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Drag cards between columns when job APIs exist.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Unassigned", "2", "bg-amber-50 border-amber-200/60"],
                  ["Assigned", "5", "bg-sky/10 border-sky/30"],
                  ["On scene", "3", "bg-emerald-50 border-emerald-200/60"],
                ].map(([title, n, box]) => (
                  <div
                    key={title as string}
                    className={`rounded-xl border p-3 ${box as string}`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      {title}
                    </div>
                    <div className="mt-2 font-display text-xl font-bold text-ink">
                      {n}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="rounded-md border border-ink/10 bg-paper/80 px-2 py-2 text-[11px] text-ink">
                        JOB-2041 · sample
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <UserPlus className="size-4 text-deep" />
                Seat invites
              </div>
              <p className="mt-2 text-xs text-muted">
                Invite drivers to claim an org seat.
              </p>
              <label className="mt-4 block text-xs font-medium text-ink">
                Work email
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="driver@fleet.com"
                  readOnly
                  className="h-11 flex-1 rounded-xl border border-ink/15 bg-ice/40 px-3 text-sm text-ink"
                />
                <button
                  type="button"
                  disabled
                  className="h-11 shrink-0 rounded-xl bg-ink/20 px-4 text-sm font-semibold text-ink/50"
                >
                  Send invite
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Webhook className="size-4 text-muted" />
                Webhooks & activity
              </div>
              <ul className="mt-4 space-y-2">
                {[
                  ["job.created", "2m ago", "staging endpoint"],
                  ["assignment.updated", "14m ago", "T-04"],
                  ["billing.invoice_paid", "1h ago", "Stripe"],
                ].map(([ev, t, meta]) => (
                  <li
                    key={ev as string}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink/8 px-3 py-2.5 text-sm"
                  >
                    <code className="text-xs font-semibold text-deep">{ev}</code>
                    <span className="text-xs text-muted">{t}</span>
                    <span className="w-full text-[11px] text-muted sm:w-auto">
                      {meta}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Shield className="size-4 text-deep" />
                Service area
              </div>
              <p className="mt-2 text-xs text-muted">
                Geofence from org settings (sample).
              </p>
              <div className="mt-4 h-28 rounded-xl border border-dashed border-ink/20 bg-ice/50 text-center text-xs leading-[7rem] text-muted">
                Map preview · org fence
              </div>
              <label className="mt-3 block text-xs text-muted">
                Radius (km)
                <input
                  type="range"
                  min={5}
                  max={80}
                  defaultValue={40}
                  disabled
                  className="mt-2 w-full accent-sky"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <Bell className="size-4 text-sky" />
                Notifications queue
              </div>
              <button
                type="button"
                className="rounded-lg border border-ink/12 px-3 py-1.5 text-xs font-semibold text-muted"
                disabled
              >
                Configure
              </button>
            </div>
            <div className="mt-4 divide-y divide-ink/10">
              {[
                ["SLA breach · JOB-2038", "Push + SMS", "Due now"],
                ["Driver idle · T-08", "In-app", "15m"],
              ].map(([title, ch, t]) => (
                <div
                  key={title as string}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0"
                >
                  <span className="font-medium text-ink">{title}</span>
                  <span className="text-xs text-muted">{ch}</span>
                  <span className="font-mono-brand text-xs text-deep">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
