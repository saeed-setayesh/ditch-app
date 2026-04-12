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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="shrink-0 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Back to dashboard"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">Insights</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 hidden sm:block">Past incidents, peak hours, hot areas</p>
          </div>
        </div>
        {userName && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-zinc-700 truncate max-w-[100px] sm:max-w-[140px]"
            title={`Signed in as ${userName}. Click to sign out.`}
          >
            {userName.split(" ")[0]}
          </button>
        )}
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-4xl mx-auto w-full">
        {upgradeRequired && dataSource === "platform" && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm">
            <p className="font-medium">Platform history & insights are Pro features.</p>
            <p className="mt-1 text-amber-300/90">Use TomTom live above to see current incidents without Pro, or upgrade to Pro to view saved history, peak hours, and hot areas.</p>
            <Link href="/dashboard" className="inline-block mt-2 text-amber-400 hover:text-amber-300 font-medium">← Back to dashboard</Link>
          </div>
        )}
        <section className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Data source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as "platform" | "live")}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm"
              title="Platform = our saved data (requires cron); Live = TomTom right now"
            >
              <option value="platform">Platform data</option>
              <option value="live">TomTom live</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">City</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                view === "chart" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              By day
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                view === "list" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              List
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Incidents by day {dataSource === "live" ? "(TomTom right now)" : "(platform history)"}
          </h2>
          {loadingHistory ? (
            <div className="h-48 rounded-xl bg-zinc-800/80 animate-pulse" />
          ) : view === "chart" && byDay.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2">
              {byDay.map(({ date, count }) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm w-24">{date}</span>
                  <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-500/60 rounded min-w-[2px] transition-all"
                      style={{ width: `${(count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-zinc-300 text-sm w-10">{count}</span>
                </div>
              ))}
            </div>
          ) : view === "list" && snapshots && snapshots.snapshots.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <ul className="divide-y divide-zinc-800 max-h-80 overflow-y-auto">
                {snapshots.snapshots.map((s) => (
                  <li key={s.id} className="px-4 py-3 text-sm">
                    <p className="text-zinc-100 font-medium truncate">{s.description ?? iconCategoryLabel(s.iconCategory)}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {s.from ?? ""} {s.to ? `→ ${s.to}` : ""} · {new Date(s.fetchedAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center text-zinc-500">
              {dataSource === "platform"
                ? "No platform data for this range yet. Switch to TomTom live to see current incidents, or run the cron to collect data over time."
                : "No live incidents in this area right now."}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Peak hours {dataSource === "live" ? "(right now)" : "(last 7 days)"}
          </h2>
          {loadingPatterns ? (
            <div className="h-24 rounded-xl bg-zinc-800/80 animate-pulse" />
          ) : patterns && patterns.peakHours.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-wrap gap-3">
              {patterns.peakHours.map(({ hour, count }) => (
                <span
                  key={hour}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-sm"
                >
                  {formatHour(hour)}: {count} incidents
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-zinc-500 text-sm">
              {dataSource === "platform"
                ? "No pattern data yet. Switch to TomTom live or run the cron to collect snapshots."
                : "No live incidents right now."}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Hot areas {dataSource === "live" ? "(right now)" : "(last 7 days)"}
          </h2>
          {loadingPatterns ? (
            <div className="h-24 rounded-xl bg-zinc-800/80 animate-pulse" />
          ) : patterns && patterns.hotAreas.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <ul className="divide-y divide-zinc-800 max-h-48 overflow-y-auto">
                {patterns.hotAreas.slice(0, 10).map((area, i) => (
                  <li key={`${area.lat}-${area.lng}`} className="px-4 py-2 flex justify-between text-sm">
                    <span className="text-zinc-400">
                      #{i + 1} {area.lat.toFixed(3)}, {area.lng.toFixed(3)}
                    </span>
                    <span className="text-amber-400 font-medium">{area.count} incidents</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-zinc-500 text-sm">
              {dataSource === "platform" ? "No hot area data yet. Switch to TomTom live or run the cron." : "No live incidents right now."}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
