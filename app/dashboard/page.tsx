"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import Map from "@/components/Map";
import IncidentList, { type IncidentForList } from "@/components/IncidentList";
import PushNotificationManager from "@/components/PushNotificationManager";
import InstallPrompt from "@/components/InstallPrompt";
import AlertPreferences from "@/components/AlertPreferences";
import CameraView from "@/components/CameraView";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import { categoryMatchesDriverFilters } from "@/lib/driverIncidentFilter";
import { useDriverDashboardTheme } from "@/components/DriverDashboardTheme";
import { CITIES } from "@/lib/cities";
import { haversineKm } from "@/lib/geo";
import { openNavigation, openWazeNavigation } from "@/lib/navigation";
import IncidentToast, { type ToastIncident } from "@/components/IncidentToast";
import DriverShortcutsBar from "@/components/DriverShortcutsBar";
import DriverAccountSheet from "@/components/DriverAccountSheet";
import PresenceBeacon from "@/components/PresenceBeacon";
import {
  type DriverShortcut,
  readDriverQuickNavsFromLocalStorage,
  writeDriverQuickNavsToLocalStorage,
} from "@/lib/driverShortcuts";
import {
  DEFAULT_DRIVER_MAP_FILTERS,
  readDriverMapFiltersFromLocalStorage,
  writeDriverMapFiltersToLocalStorage,
} from "@/lib/driverMapFilters";
import {
  User,
  Sliders,
  Map as MapIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Menu,
  ClipboardCheck,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";

const INCIDENTS_POLL_MS = 90_000;
const LOCATION_UPDATE_MS = 120_000;

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

export default function Home() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useDriverDashboardTheme();
  const orgLinked = Boolean(session?.user?.organizationId);
  const userName = session?.user?.name ?? null;
  const userEmail = session?.user?.email ?? null;
  const [incidents, setIncidents] = useState<IncidentForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [quickNavs, setQuickNavs] = useState<DriverShortcut[]>([]);
  const [etaMap, setEtaMap] = useState<Record<string, number>>({});
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [heatmapPeriod, setHeatmapPeriod] = useState<"day" | "week" | "month">(
    "week",
  );
  const [heatmapSource, setHeatmapSource] = useState<"platform" | "live">(
    "live",
  );
  const [cityId, setCityId] = useState("DitchApp");
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [heatmapBlocked, setHeatmapBlocked] = useState(false);
  const [cameraViewIncident, setCameraViewIncident] =
    useState<IncidentForList | null>(null);
  const [detailIncident, setDetailIncident] = useState<IncidentForList | null>(
    null,
  );
  const [userIncidentSources, setUserIncidentSources] = useState<string[]>([
    "tomtom",
    "511on",
  ]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return DEFAULT_DRIVER_MAP_FILTERS;
    return (
      readDriverMapFiltersFromLocalStorage() ?? DEFAULT_DRIVER_MAP_FILTERS
    );
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMainView, setMobileMainView] = useState<"map" | "list">("map");
  const [incidentsPanelOpen, setIncidentsPanelOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastIncident[]>([]);
  const prevIncidentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setQuickNavs(readDriverQuickNavsFromLocalStorage());
  }, []);

  const persistQuickNavs = useCallback(async (navs: DriverShortcut[]) => {
    setQuickNavs(navs);
    writeDriverQuickNavsToLocalStorage(navs);
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    try {
      await fetch("/api/push/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, driverQuickNavs: navs }),
      });
    } catch {
      // ignore — localStorage still has data
    }
  }, []);

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

  const fetchIncidents = useCallback(
    async (cid?: string) => {
      const id = cid ?? cityId;
      try {
        const deviceId = getOrCreateDeviceId();
        const params = new URLSearchParams();
        if (id) params.set("city", id);
        if (deviceId) params.set("deviceId", deviceId);
        const url = `/api/incidents?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch incidents");
        const data = await res.json();
        const newList = data.incidents ?? [];
        // Detect new incidents for toast notifications (skip first load)
        if (prevIncidentIdsRef.current.size > 0 && newList.length > 0) {
          const prevIds = prevIncidentIdsRef.current;
          const added = newList.filter((i: IncidentForList) => !prevIds.has(i.id));
          if (added.length > 0) {
            setToasts((prev) => [
              ...prev.slice(-2),
              ...added.slice(0, 3).map((i: IncidentForList) => ({
                id: i.id,
                description: i.description ?? "Incident",
                iconCategory: i.iconCategory,
              })),
            ].slice(-3));
          }
        }
        prevIncidentIdsRef.current = new Set(newList.map((i: IncidentForList) => i.id));
        setIncidents(newList);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [cityId],
  );

  useEffect(() => {
    fetchIncidents(cityId);
    const t = setInterval(() => fetchIncidents(cityId), INCIDENTS_POLL_MS);
    return () => clearInterval(t);
  }, [fetchIncidents, cityId]);

  const refreshTierAndSources = useCallback(() => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    fetch(`/api/push/me?deviceId=${encodeURIComponent(deviceId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            tier?: string;
            incidentSources?: string;
            driverQuickNavs?: DriverShortcut[];
            driverMapFilters?: FilterState | null;
          } | null,
        ) => {
          if (data?.tier === "pro") {
            setTier("pro");
            setHeatmapBlocked(false);
          } else setTier("free");
          if (data?.incidentSources) {
            const arr = String(data.incidentSources)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (arr.length > 0) setUserIncidentSources(arr);
          } else {
            setUserIncidentSources(["tomtom", "511on"]);
          }
          if (Array.isArray(data?.driverQuickNavs)) {
            setQuickNavs(data.driverQuickNavs);
            writeDriverQuickNavsToLocalStorage(data.driverQuickNavs);
          }
          if (data?.driverMapFilters != null) {
            setFilters(data.driverMapFilters);
            writeDriverMapFiltersToLocalStorage(data.driverMapFilters);
          }
        },
      )
      .catch(() => {
        setTier("free");
        setUserIncidentSources(["tomtom", "511on"]);
      });
  }, []);

  useEffect(() => {
    refreshTierAndSources();
  }, [session?.user?.id, refreshTierAndSources]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") === "success") {
      refreshTierAndSources();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [refreshTierAndSources]);

  const sendLocationToServer = useCallback(async (lat: number, lng: number) => {
    try {
      const deviceId = getOrCreateDeviceId();
      await fetch("/api/push/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, lat, lng }),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let watchId: number | null = null;

    const onPosition = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([longitude, latitude]);
      setLocationError(null);
      sendLocationToServer(latitude, longitude);
    };

    const onError = () => {
      setLocationError("Location access denied or unavailable.");
    };

    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: LOCATION_UPDATE_MS,
    });

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [sendLocationToServer]);

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId || userLocation == null) return;
    const t = setInterval(() => {
      sendLocationToServer(userLocation[1], userLocation[0]);
    }, LOCATION_UPDATE_MS);
    return () => clearInterval(t);
  }, [userLocation, sendLocationToServer]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (
        !categoryMatchesDriverFilters(
          inc.iconCategory,
          filters.incidentTypes,
        )
      ) {
        return false;
      }
      if (userLocation && filters.radiusKm < 50) {
        const [lng, lat] = inc.coordinates;
        const distance = haversineKm(
          userLocation[1],
          userLocation[0],
          lat,
          lng,
        );
        if (distance > filters.radiusKm) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, filters.incidentTypes, filters.radiusKm, userLocation]);

  // Fetch ETA for selected incident and top filtered incidents when we have location
  useEffect(() => {
    if (!userLocation || filteredIncidents.length === 0) return;
    const [lng, lat] = userLocation;
    const toFetch = selectedId
      ? [
          selectedId,
          ...filteredIncidents
            .filter((i) => i.id !== selectedId)
            .slice(0, 2)
            .map((i) => i.id),
        ]
      : filteredIncidents.slice(0, 3).map((i) => i.id);
    toFetch.forEach((incidentId) => {
      const inc = incidents.find((i) => i.id === incidentId);
      if (!inc) return;
      const [incLng, incLat] = inc.coordinates;
      const from = `${lat},${lng}`;
      const to = `${incLat},${incLng}`;
      fetch(
        `/api/eta?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { travelTimeInSeconds?: number } | null) => {
          const sec = data?.travelTimeInSeconds;
          if (sec != null) {
            setEtaMap((prev) => ({
              ...prev,
              [incidentId]: Math.round(sec / 60),
            }));
          }
        })
        .catch(() => {});
    });
  }, [userLocation, filteredIncidents, selectedId, incidents]);

  const incidentsWithEta = useMemo(
    () =>
      filteredIncidents.map((inc) => ({
        ...inc,
        etaMinutes: etaMap[inc.id] ?? null,
      })),
    [filteredIncidents, etaMap],
  );

  const incidentsAllWithEta = useMemo(
    () =>
      incidents.map((inc) => ({
        ...inc,
        etaMinutes: etaMap[inc.id] ?? null,
      })),
    [incidents, etaMap],
  );

  return (
    <div className="relative h-dvh overflow-hidden text-ink">
      {/* Full-viewport map (Google Maps–style base layer) */}
      <div className="absolute inset-0 z-0">
        <Map
          incidents={incidentsWithEta}
          userLocation={userLocation}
          selectedId={selectedId}
          onIncidentSelect={(id) => {
            setSelectedId(id);
            setIncidentsPanelOpen(true);
            if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
              setMobileMainView("list");
            }
          }}
          heatmapOn={heatmapOn}
          heatmapPeriod={heatmapPeriod}
          heatmapCityId={cityId}
          heatmapDeviceId={getOrCreateDeviceId() || null}
          heatmapSource={heatmapSource}
          onHeatmapBlocked={() => {
            setHeatmapOn(false);
            setHeatmapBlocked(true);
          }}
          showTrafficFlow={filters.showTrafficFlow}
        />
      </div>

      <PresenceBeacon />

      {/* Floating top chrome — white controls for contrast on the map */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col gap-2 px-2 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] sm:px-3">
        <header className="pointer-events-auto hidden items-center justify-between gap-3 px-1 py-1.5 md:flex">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex max-w-[min(100%,18rem)] items-center gap-2 rounded-full border border-ink/12 bg-paper px-3 py-2 text-ink shadow-sm transition-colors hover:bg-ice"
              title="Account"
              aria-label="Open account"
            >
              <span
                className="size-2 shrink-0 rounded-full bg-emerald-500"
                style={{ animation: "da-pulse 1.6s ease-out infinite" }}
              />
              <span
                className="shrink-0 font-bold uppercase text-ink"
                style={{ fontSize: 13, letterSpacing: "0.06em" }}
              >
                Online
              </span>
              {userName ? (
                <span className="min-w-0 truncate text-sm font-semibold normal-case tracking-normal text-ink lg:max-w-[12rem]">
                  {userName}
                </span>
              ) : null}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              id="city-select"
              aria-label="City"
              value={cityId}
              onChange={async (e) => {
                const id = e.target.value;
                setCityId(id);
                try {
                  const deviceId = getOrCreateDeviceId();
                  await fetch("/api/push/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deviceId, cityId: id }),
                  });
                } catch {
                  // ignore
                }
              }}
              className="rounded-lg border border-ink/12 bg-paper px-2 py-1.5 text-sm text-ink shadow-sm focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/25"
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
              title="Filters"
              aria-label="Open filters"
            >
              <Sliders className="size-5" strokeWidth={2} />
            </button>
            {orgLinked ? (
              <Link
                href="/dashboard/inspections"
                className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink/12 bg-paper px-3 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-ice"
                title="Vehicle inspections"
              >
                <ClipboardCheck className="size-5 text-sky" strokeWidth={2} />
                <span className="hidden xl:inline">Inspect</span>
              </Link>
            ) : null}
          </div>
        </header>

        <header className="pointer-events-auto flex items-center gap-2.5 px-1 py-1.5 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
            aria-label="Open menu"
          >
            <Menu className="size-[22px]" strokeWidth={2} />
          </button>
          <div className="flex min-w-0 flex-1 justify-center">
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-ink/12 bg-paper px-3 py-2 text-ink shadow-sm transition-colors hover:bg-ice"
              aria-label="Open account"
            >
              <span
                className="size-2 shrink-0 rounded-full bg-emerald-500"
                style={{ animation: "da-pulse 1.6s ease-out infinite" }}
              />
              <span
                className="shrink-0 font-bold uppercase text-ink"
                style={{ fontSize: 13, letterSpacing: "0.06em" }}
              >
                Online
              </span>
              {userName ? (
                <span className="min-w-0 truncate text-sm font-semibold normal-case tracking-normal text-ink">
                  {userName}
                </span>
              ) : null}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFilterPanelOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
            aria-label="Filters"
          >
            <Sliders className="size-5" strokeWidth={2} />
          </button>
          {orgLinked ? (
            <Link
              href="/dashboard/inspections"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
              aria-label="Vehicle inspections"
            >
              <ClipboardCheck className="size-5 text-sky" strokeWidth={2} />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() =>
              setMobileMainView((v) => (v === "map" ? "list" : "map"))
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
            aria-label={mobileMainView === "map" ? "Show list" : "Show map"}
          >
            {mobileMainView === "map" ? (
              <List className="size-5" strokeWidth={2} />
            ) : (
              <MapIcon className="size-5" strokeWidth={2} />
            )}
          </button>
        </header>
      </div>

      {/* Heatmap controls + Quick nav — aligned below top bar */}
      <div className="pointer-events-auto absolute right-3 top-[calc(env(safe-area-inset-top)+3.85rem)] z-[35] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 md:top-[calc(env(safe-area-inset-top)+3.75rem)]">
        <div className="hidden max-w-[calc(100vw-28rem)] flex-wrap justify-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => {
              if (tier === "free" && !heatmapOn) {
                setHeatmapOn(true);
                setHeatmapBlocked(false);
              } else {
                setHeatmapOn((v) => !v);
                setHeatmapBlocked(false);
              }
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-colors ${
              heatmapOn
                ? "border-sky/40 bg-ice"
                : "border-ink/12 bg-paper hover:bg-ice"
            }`}
          >
            Heatmap {heatmapOn ? "On" : "Off"}
          </button>
          {heatmapOn && (
            <>
              <select
                value={heatmapSource}
                onChange={(e) =>
                  setHeatmapSource(e.target.value as "platform" | "live")
                }
                className="rounded-xl border border-ink/12 bg-paper px-2 py-2 text-xs text-ink shadow-sm"
                title="Platform = our saved data; Live = TomTom right now"
              >
                <option value="platform">Platform data</option>
                <option value="live">TomTom live</option>
              </select>
              {heatmapSource === "platform" && (
                <select
                  value={heatmapPeriod}
                  onChange={(e) =>
                    setHeatmapPeriod(
                      e.target.value as "day" | "week" | "month",
                    )
                  }
                  className="rounded-xl border border-ink/12 bg-paper px-2 py-2 text-xs text-ink shadow-sm"
                >
                  <option value="day">Last 24h</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </select>
              )}
            </>
          )}
        </div>
        <DriverShortcutsBar shortcuts={quickNavs} layout="list" />
      </div>

      {/* Desktop: floating incident list (collapsible) */}
      {incidentsPanelOpen ? (
        <aside className="pointer-events-auto absolute bottom-4 left-3 top-[calc(env(safe-area-inset-top)+3.85rem)] z-30 hidden w-[min(420px,calc(100vw-1.5rem))] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper/85 shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-125 md:flex md:top-[calc(env(safe-area-inset-top)+3.75rem)]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/[0.08] bg-paper/75 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
            <h2 className="font-display text-sm font-bold text-ink">
              Incidents
            </h2>
            <button
              type="button"
              onClick={() => setIncidentsPanelOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink/12 bg-paper text-ink shadow-sm transition-colors hover:bg-ice"
              aria-label="Hide incidents list"
              title="Hide list"
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <IncidentList
              incidentsFiltered={incidentsWithEta}
              incidentsAll={incidentsAllWithEta}
              userLocation={userLocation}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onViewCamera={setCameraViewIncident}
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
      ) : (
        <button
          type="button"
          onClick={() => setIncidentsPanelOpen(true)}
          className="pointer-events-auto absolute left-3 top-[calc(env(safe-area-inset-top)+3.85rem)] z-30 hidden h-11 items-center gap-2 rounded-r-xl border border-ink/15 bg-paper pl-2.5 pr-3.5 text-sm font-semibold text-ink shadow-md transition-colors hover:bg-ice md:flex md:top-[calc(env(safe-area-inset-top)+3.75rem)]"
          aria-label="Show incidents list"
        >
          <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
          <List className="size-4 shrink-0" strokeWidth={2} />
          <span>Incidents</span>
        </button>
      )}

      {/* Mobile: incident list as bottom sheet over map */}
      {mobileMainView === "list" ? (
        <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex h-[min(75vh,640px)] max-h-[min(75vh,640px)] flex-col md:hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl border border-ink/10 bg-paper/85 shadow-[0_-8px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-125">
            <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-3 pb-2 pt-2">
              <h2 className="pl-1 font-display text-sm font-bold text-ink">
                Incidents
              </h2>
              <button
                type="button"
                onClick={() => setMobileMainView("map")}
                className="flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-ink"
                aria-label="Close list and show map"
              >
                Close
              </button>
            </div>
            <div className="flex shrink-0 justify-center pb-2 pt-1">
              <button
                type="button"
                onClick={() => setMobileMainView("map")}
                className="h-1.5 w-14 rounded-full bg-ink/25"
                aria-label="Show map"
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 pb-[env(safe-area-inset-bottom)]">
              <IncidentList
                incidentsFiltered={incidentsWithEta}
                incidentsAll={incidentsAllWithEta}
                userLocation={userLocation}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onViewCamera={setCameraViewIncident}
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
          </div>
        </div>
      ) : null}

      <DriverAccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        userName={userName}
        userEmail={userEmail}
        tier={tier}
        quickNavs={quickNavs}
        onOpenAlertPreferences={() => setPrefsOpen(true)}
      />

      {prefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-ink/10 bg-paper shadow-xl">
            <AlertPreferences
              initialCityId={cityId}
              initialTier={tier}
              initialIncidentSources={userIncidentSources}
              onClose={() => setPrefsOpen(false)}
              onSaved={(prefs) => {
                if (prefs.cityId) setCityId(prefs.cityId);
                if (prefs.incidentSources)
                  setUserIncidentSources(prefs.incidentSources);
                const deviceId = getOrCreateDeviceId();
                fetch(
                  `/api/push/me?deviceId=${encodeURIComponent(deviceId)}`,
                )
                  .then((r) => (r.ok ? r.json() : null))
                  .then((data: { tier?: string } | null) => {
                    if (data?.tier === "pro") {
                      setTier("pro");
                      setHeatmapBlocked(false);
                    } else setTier("free");
                  })
                  .catch(() => {});
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper md:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-ink/[0.08] px-4 py-3">
            <h2 className="font-display text-lg font-bold text-ink">Menu</h2>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-muted transition hover:bg-ice hover:text-ink"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAccountOpen(true);
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-xl border border-ink/10 bg-ice/40 p-3 text-left transition hover:bg-ice"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-ice">
                <User className="size-6 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-paper px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink shadow-sm">
                  <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Online
                </span>
                {userName ? (
                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {userName}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Open account</p>
                )}
              </div>
            </button>
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-medium text-ink">
                City
              </label>
              <select
                value={cityId}
                onChange={async (e) => {
                  const id = e.target.value;
                  setCityId(id);
                  try {
                    const deviceId = getOrCreateDeviceId();
                    await fetch("/api/push/preferences", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deviceId, cityId: id }),
                    });
                  } catch {
                    // ignore
                  }
                }}
                className="w-full rounded-lg border border-ink/15 bg-ice/50 px-3 py-2.5 text-ink"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setFilterPanelOpen(true);
              }}
              className="w-full rounded-xl bg-sky px-4 py-3 text-left font-semibold text-paper transition hover:bg-deep"
            >
              Filters
            </button>
            <Link
              href="/dashboard/quick-nav"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center rounded-xl border border-ink/10 bg-ice/60 px-4 py-3 font-semibold text-ink transition hover:bg-ice"
            >
              Quick destinations
            </Link>
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="flex w-full items-center gap-2 rounded-xl border border-ink/10 bg-ice/60 px-4 py-3 text-left font-semibold text-ink transition hover:bg-ice"
            >
              {theme === "dark" ? (
                <Sun className="size-5 shrink-0 text-muted" strokeWidth={2} />
              ) : (
                <Moon className="size-5 shrink-0 text-muted" strokeWidth={2} />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            {orgLinked ? (
              <Link
                href="/dashboard/inspections"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl border border-ink/10 bg-ice/60 px-4 py-3 text-left font-semibold text-ink transition hover:bg-ice"
              >
                <ClipboardCheck className="size-5 text-sky" />
                Vehicle inspections
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* New incident toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 max-w-sm w-[320px]">
          {toasts.map((t) => (
            <IncidentToast
              key={t.id}
              incident={t}
              onDismiss={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              duration={5000}
            />
          ))}
        </div>
      )}

      {/* Status banners — fixed top-right toast */}
      {(error || locationError || heatmapBlocked) && (
        <div className="fixed right-4 top-16 z-20 flex max-w-sm flex-col gap-2">
          {error && (
            <div className="rounded-lg border border-red-300/60 bg-red-50 p-2 text-xs text-red-700 shadow-lg">
              {error}
            </div>
          )}
          {locationError && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-2 text-xs text-amber-900 shadow-lg">
              {locationError} Enable location for distance and alerts.
            </div>
          )}
          {heatmapBlocked && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-2 text-xs text-amber-900 shadow-lg">
              Heatmap is a Pro feature. Upgrade to unlock.
            </div>
          )}
        </div>
      )}

      {cameraViewIncident && (
        <CameraView
          incident={{
            coordinates: cameraViewIncident.coordinates,
            from: cameraViewIncident.from,
            to: cameraViewIncident.to,
            description: cameraViewIncident.description,
          }}
          onClose={() => setCameraViewIncident(null)}
          tier={tier}
        />
      )}

      {detailIncident && (
        <IncidentDetailModal
          incident={detailIncident}
          onClose={() => setDetailIncident(null)}
          onViewCamera={(inc) => {
            setCameraViewIncident(inc);
            setDetailIncident(null);
          }}
        />
      )}

      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={persistMapFilters}
      />

      <PushNotificationManager userLocation={userLocation} />
      <InstallPrompt />
    </div>
  );
}
