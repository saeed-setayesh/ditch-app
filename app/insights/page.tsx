"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { iconCategoryLabel } from "@/lib/tomtom";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

type HistoryByDay = { date: string; count: number }[];
type HistorySnapshots = {
  city: string;
  from: string;
  to: string;
  count: number;
  snapshots: {
    id: string;
    externalId: string;
    lat: number;
    lng: number;
    city: string;
    iconCategory: number;
    magnitudeOfDelay: number | null;
    description: string | null;
    from: string | null;
    to: string | null;
    startTime: string | null;
    endTime: string | null;
    fetchedAt: string;
  }[];
};
type Patterns = {
  city: string;
  period: string;
  totalIncidents: number;
  byHour: { hour: number; count: number }[];
  peakHours: { hour: number; count: number }[];
  hotAreas: { lat: number; lng: number; count: number }[];
};

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function InsightsPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? null;
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [view, setView] = useState<"chart" | "list">("chart");
  const [dataSource, setDataSource] = useState<"platform" | "live">("live");
  const [byDay, setByDay] = useState<HistoryByDay>([]);
  const [snapshots, setSnapshots] = useState<HistorySnapshots | null>(null);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const cityName = CITIES.find((c) => c.id === cityId)?.name ?? cityId;

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setUpgradeRequired(false);
    try {
      const params = new URLSearchParams({
        city: cityName,
        from: fromDate,
        to: toDate,
        limit: "200",
        source: dataSource,
      });
      if (view === "chart") params.set("group", "day");
      const deviceId = getOrCreateDeviceId();
      if (deviceId) params.set("deviceId", deviceId);
      const res = await fetch(`/api/insights/history?${params.toString()}`);
      if (res.status === 402) {
        setUpgradeRequired(true);
        setByDay([]);
        setSnapshots(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      if (data.byDay) {
        setByDay(data.byDay);
        setSnapshots(null);
      } else {
        setSnapshots(data);
        setByDay([]);
      }
    } catch {
      setByDay([]);
      setSnapshots(null);
    } finally {
      setLoadingHistory(false);
    }
  }, [cityName, fromDate, toDate, view, dataSource]);

  const fetchPatterns = useCallback(async () => {
    setLoadingPatterns(true);
    try {
      const params = new URLSearchParams({ city: cityName, period: "week", source: dataSource });
      const deviceId = getOrCreateDeviceId();
      if (deviceId) params.set("deviceId", deviceId);
      const res = await fetch(`/api/insights/patterns?${params.toString()}`);
      if (res.status === 402) {
        setPatterns(null);
        setUpgradeRequired(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch patterns");
      const data = await res.json();
      setPatterns(data);
    } catch {
      setPatterns(null);
    } finally {
      setLoadingPatterns(false);
    }
  }, [cityName, dataSource]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const maxDayCount = byDay.length ? Math.max(...byDay.map((d) => d.count), 1) : 1;

  return (
    <div className="flex min-h-screen flex-col bg-ice text-ink">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/[0.08] bg-paper px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 font-medium text-deep transition hover:text-sky"
            aria-label="Back to dashboard"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">Insights</h1>
            <p className="mt-0.5 hidden text-xs text-muted sm:block sm:text-sm">Past incidents, peak hours, hot areas</p>
          </div>
        </div>
        {userName && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="max-w-[100px] shrink-0 truncate rounded-lg border border-ink/12 bg-ice/80 px-2 py-1.5 text-xs font-semibold text-ink transition hover:bg-ice sm:max-w-[140px] sm:px-3 sm:text-sm"
            title={`Signed in as ${userName}. Click to sign out.`}
          >
            {userName.split(" ")[0]}
          </button>
        )}
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-4xl mx-auto w-full">
        {upgradeRequired && dataSource === "platform" && (
          <div className="rounded-xl border border-sky/30 bg-sky/10 p-4 text-sm text-ink">
            <p className="font-semibold text-deep">Platform history & insights are Pro features.</p>
            <p className="mt-1 text-muted">Use TomTom live above to see current incidents without Pro, or upgrade to Pro to view saved history, peak hours, and hot areas.</p>
            <Link href="/dashboard" className="mt-2 inline-block font-semibold text-deep hover:text-sky">← Back to dashboard</Link>
          </div>
        )}
        <section className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Data source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as "platform" | "live")}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink"
              title="Platform = our saved data (requires cron); Live = TomTom right now"
            >
              <option value="platform">Platform data</option>
              <option value="live">TomTom live</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">City</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                view === "chart" ? "border border-sky/40 bg-sky/15 text-deep" : "border border-ink/10 bg-ice/80 text-ink hover:bg-ice"
              }`}
            >
              By day
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                view === "list" ? "border border-sky/40 bg-sky/15 text-deep" : "border border-ink/10 bg-ice/80 text-ink hover:bg-ice"
              }`}
            >
              List
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            Incidents by day {dataSource === "live" ? "(TomTom right now)" : "(platform history)"}
          </h2>
          {loadingHistory ? (
            <div className="h-48 animate-pulse rounded-xl bg-ice" />
          ) : view === "chart" && byDay.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-ink/[0.08] bg-paper p-4 shadow-sm">
              {byDay.map(({ date, count }) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted">{date}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-ice">
                    <div
                      className="h-full min-w-[2px] rounded bg-sky/70 transition-all"
                      style={{ width: `${(count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm font-mono-brand font-semibold text-deep">{count}</span>
                </div>
              ))}
            </div>
          ) : view === "list" && snapshots && snapshots.snapshots.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-ink/[0.08] bg-paper shadow-sm">
              <ul className="max-h-80 divide-y divide-ink/[0.08] overflow-y-auto">
                {snapshots.snapshots.map((s) => (
                  <li key={s.id} className="px-4 py-3 text-sm">
                    <p className="truncate font-medium text-ink">{s.description ?? iconCategoryLabel(s.iconCategory)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {s.from ?? ""} {s.to ? `→ ${s.to}` : ""} · {new Date(s.fetchedAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-ink/[0.08] bg-paper p-6 text-center text-muted shadow-sm">
              {dataSource === "platform"
                ? "No platform data for this range yet. Switch to TomTom live to see current incidents, or run the cron to collect data over time."
                : "No live incidents in this area right now."}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            Peak hours {dataSource === "live" ? "(right now)" : "(last 7 days)"}
          </h2>
          {loadingPatterns ? (
            <div className="h-24 animate-pulse rounded-xl bg-ice" />
          ) : patterns && patterns.peakHours.length > 0 ? (
            <div className="flex flex-wrap gap-3 rounded-xl border border-ink/[0.08] bg-paper p-4 shadow-sm">
              {patterns.peakHours.map(({ hour, count }) => (
                <span
                  key={hour}
                  className="rounded-lg bg-ice px-3 py-1.5 text-sm text-ink"
                >
                  {formatHour(hour)}: {count} incidents
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-ink/[0.08] bg-paper p-4 text-sm text-muted shadow-sm">
              {dataSource === "platform"
                ? "No pattern data yet. Switch to TomTom live or run the cron to collect snapshots."
                : "No live incidents right now."}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            Hot areas {dataSource === "live" ? "(right now)" : "(last 7 days)"}
          </h2>
          {loadingPatterns ? (
            <div className="h-24 animate-pulse rounded-xl bg-ice" />
          ) : patterns && patterns.hotAreas.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-ink/[0.08] bg-paper shadow-sm">
              <ul className="max-h-48 divide-y divide-ink/[0.08] overflow-y-auto">
                {patterns.hotAreas.slice(0, 10).map((area, i) => (
                  <li key={`${area.lat}-${area.lng}`} className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-muted">
                      #{i + 1} {area.lat.toFixed(3)}, {area.lng.toFixed(3)}
                    </span>
                    <span className="font-mono-brand font-semibold text-deep">{area.count} incidents</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-ink/[0.08] bg-paper p-4 text-sm text-muted shadow-sm">
              {dataSource === "platform" ? "No hot area data yet. Switch to TomTom live or run the cron." : "No live incidents right now."}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
