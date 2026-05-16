"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useSession, signOut } from "next-auth/react";
import Map from "@/components/Map";
import IncidentList, { type IncidentForList } from "@/components/IncidentList";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import FilterPanel, {
  type FilterState,
  type IncidentType,
} from "@/components/FilterPanel";
import { CITIES } from "@/lib/cities";
import {
  DEFAULT_DRIVER_MAP_FILTERS,
  readDriverMapFiltersFromLocalStorage,
  writeDriverMapFiltersToLocalStorage,
} from "@/lib/driverMapFilters";
import { haversineKm } from "@/lib/geo";
import { openNavigation, openWazeNavigation } from "@/lib/navigation";
import { Bell, LogOut, Plus, Search, Sliders } from "lucide-react";

const INCIDENTS_POLL_MS = 90_000;

const mapSectionClass =
  "relative isolate overflow-hidden rounded-2xl border border-ink/8 bg-[#071a2e] shadow-sm " +
  "h-[clamp(300px,52vh,560px)] w-full max-h-[560px] shrink-0 " +
  "lg:h-[calc(100dvh-10rem)] lg:max-h-[calc(100dvh-10rem)] lg:min-h-[420px] lg:flex-1";

const queueAsideClass =
  "flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-paper shadow-sm " +
  "min-h-[220px] w-full max-h-[clamp(280px,48vh,520px)] " +
  "lg:h-[calc(100dvh-10rem)] lg:max-h-[calc(100dvh-10rem)] lg:min-h-[420px] lg:w-96 lg:shrink-0 xl:w-[400px]";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

function getIncidentTypeFromCategory(category: number): IncidentType | null {
  switch (category) {
    case 1:
      return "accident";
    case 2:
    case 3:
    case 4:
    case 8:
      return "hazard";
    case 5:
    case 7:
    case 9:
      return "hazard";
    case 6:
      return "jam";
    case 10:
      return "weather";
    case 11:
    case 14:
      return "accident";
    default:
      return "hazard";
  }
}

export default function CompanyDispatchPage() {
  const { data: session } = useSession();
  const orgName = session?.user?.orgName ?? "";
  const orgRole = session?.user?.orgRole;
  const tier =
    session?.user?.tier === "pro" ? ("pro" as const) : ("free" as const);

  const roleLabel =
    orgRole === "admin"
      ? "Admin"
      : orgRole === "driver"
        ? "Driver"
        : orgRole
          ? orgRole.charAt(0).toUpperCase() + orgRole.slice(1)
          : "Member";

  const hasTomTomKey = Boolean(process.env.NEXT_PUBLIC_TOMTOM_API_KEY);

  const [cityId, setCityId] = useState("DitchApp");
  const [incidents, setIncidents] = useState<IncidentForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] =
    useState<IncidentForList | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return DEFAULT_DRIVER_MAP_FILTERS;
    return (
      readDriverMapFiltersFromLocalStorage() ?? DEFAULT_DRIVER_MAP_FILTERS
    );
  });
  const [queueQuery, setQueueQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<"map" | "queue">("map");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const persistMapFilters = useCallback((next: FilterState) => {
    setFilters(next);
    writeDriverMapFiltersToLocalStorage(next);
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    void fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, driverMapFilters: next }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    let cancelled = false;
    fetch(`/api/push/me?deviceId=${encodeURIComponent(deviceId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { driverMapFilters?: FilterState | null } | null) => {
        if (cancelled || !data?.driverMapFilters) return;
        setFilters(data.driverMapFilters);
        writeDriverMapFiltersToLocalStorage(data.driverMapFilters);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 120_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const params = new URLSearchParams();
      params.set("city", cityId);
      if (deviceId) params.set("deviceId", deviceId);
      const res = await fetch(`/api/incidents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      const data = await res.json();
      const newList = (data.incidents ?? []) as IncidentForList[];
      setIncidents(newList);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    void fetchIncidents();
    const t = setInterval(() => void fetchIncidents(), INCIDENTS_POLL_MS);
    return () => clearInterval(t);
  }, [fetchIncidents]);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
  }

  const filteredIncidents = incidents.filter((inc) => {
    const incidentType = getIncidentTypeFromCategory(inc.iconCategory);
    if (incidentType && !filters.incidentTypes.includes(incidentType)) {
      return false;
    }
    if (userLocation && filters.radiusKm < 50) {
      const [lng, lat] = inc.coordinates;
      const distance = haversineKm(userLocation[1], userLocation[0], lat, lng);
      if (distance > filters.radiusKm) {
        return false;
      }
    }
    return true;
  });

  const queueFiltered = !queueQuery.trim()
    ? filteredIncidents
    : filteredIncidents.filter((i) => {
        const q = queueQuery.toLowerCase();
        return (
          (i.description ?? "").toLowerCase().includes(q) ||
          (i.from ?? "").toLowerCase().includes(q) ||
          (i.to ?? "").toLowerCase().includes(q)
        );
      });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink/[0.08] bg-paper px-3 py-2 md:hidden">
        <select
          aria-label="City"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-xl border border-ink/12 bg-ice/80 px-2 text-sm text-ink"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFilterPanelOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-paper"
          aria-label="Filters"
        >
          <Sliders className="size-5" />
        </button>
      </div>

      <div className="hidden shrink-0 border-b border-ink/[0.08] bg-paper px-4 py-4 md:block md:px-6 md:py-[18px]">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
              Live operations
            </div>
            <h1 className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-ink md:text-2xl">
              Dispatch board
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1 font-mono-brand text-[11px] font-bold uppercase tracking-wide text-paper">
                {roleLabel}
              </span>
              <span className="truncate text-sm text-muted">{orgName}</span>
            </div>
          </div>
          <select
            aria-label="City"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="h-10 rounded-xl border border-ink/12 bg-ice/80 px-3 text-sm text-ink"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <form
            onSubmit={onSearchSubmit}
            className="flex w-full max-w-[280px] items-center gap-2 md:w-auto"
          >
            <div className="flex h-[42px] flex-1 items-center gap-2 rounded-xl border border-ink/12 bg-ice/80 px-3 text-muted">
              <Search className="size-4 shrink-0" />
              <input
                type="search"
                value={queueQuery}
                onChange={(e) => setQueueQuery(e.target.value)}
                placeholder="Filter queue…"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </div>
          </form>
          <button
            type="button"
            onClick={() => setFilterPanelOpen(true)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-ink/12 bg-ice/80 text-ink hover:bg-ice"
            aria-label="Filters"
          >
            <Sliders className="size-5" />
          </button>
          <button
            type="button"
            className="hidden h-[42px] shrink-0 items-center gap-2 rounded-xl bg-deep px-3 text-sm font-bold text-paper shadow-sm transition hover:bg-ink md:inline-flex"
          >
            <Plus className="size-4" strokeWidth={2} />
            New manual job
          </button>
          <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-ink/12 bg-ice/80">
            <Bell className="size-[18px] text-ink" />
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-paper bg-[#E63946]" />
          </div>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="hidden h-10 shrink-0 rounded-lg px-2 text-muted transition hover:bg-ice hover:text-ink md:inline-flex md:items-center"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-[20px]" />
          </button>
        </div>
      </div>

      {!hasTomTomKey ? (
        <div className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
          <strong className="font-semibold">Map disabled.</strong> Add{" "}
          <code className="rounded bg-amber-100/80 px-1 font-mono text-xs">
            NEXT_PUBLIC_TOMTOM_API_KEY
          </code>{" "}
          to your environment and restart the dev server.
        </div>
      ) : null}

      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4 lg:flex-row lg:gap-4 lg:overflow-hidden lg:p-4">
        <div className="flex shrink-0 rounded-xl border border-ink/12 bg-paper p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("map")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              mobileTab === "map"
                ? "bg-ink text-paper"
                : "text-muted hover:text-ink"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("queue")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              mobileTab === "queue"
                ? "bg-ink text-paper"
                : "text-muted hover:text-ink"
            }`}
          >
            Queue
          </button>
        </div>

        <section
          className={`${mapSectionClass} ${
            mobileTab === "map" ? "flex" : "hidden"
          } lg:flex`}
        >
          {hasTomTomKey ? (
            <div className="absolute inset-0 z-0 h-full min-h-[200px]">
              <Map
                incidents={filteredIncidents}
                userLocation={userLocation}
                selectedId={selectedId}
                onIncidentSelect={(id) => {
                  setSelectedId(id);
                  if (
                    typeof window !== "undefined" &&
                    window.matchMedia("(max-width: 1023px)").matches
                  ) {
                    setMobileTab("queue");
                  }
                }}
                heatmapOn={false}
                heatmapCityId={cityId}
                heatmapDeviceId={getOrCreateDeviceId() || null}
                showTrafficFlow={filters.showTrafficFlow}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 p-8 text-center text-ice">
              <p className="font-display font-bold text-paper">Map unavailable</p>
              <p className="max-w-sm text-sm text-white/70">
                Configure TomTom to see live traffic and incidents on the
                dispatch board.
              </p>
            </div>
          )}
        </section>

        <aside
          className={`${queueAsideClass} ${
            mobileTab === "queue" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="shrink-0 border-b border-ink/6 px-4 py-3.5 font-display text-sm font-bold text-ink">
            Queue · {queueFiltered.length} shown
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <IncidentList
              incidentsFiltered={queueFiltered}
              incidentsAll={queueFiltered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onShowDetails={setDetailIncident}
              onNavigate={(incident) => {
                const [lng, lat] = incident.coordinates;
                openNavigation(lat, lng, incident.description);
              }}
              onNavigateWaze={(incident) => {
                const [lng, lat] = incident.coordinates;
                openWazeNavigation(lat, lng, incident.description);
              }}
              tier={tier}
              loading={loading}
            />
          </div>
        </aside>
      </div>

      {detailIncident ? (
        <IncidentDetailModal
          incident={detailIncident}
          onClose={() => setDetailIncident(null)}
          onViewCamera={() => {
            setDetailIncident(null);
          }}
        />
      ) : null}

      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={persistMapFilters}
      />
    </div>
  );
}
