"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Map from "@/components/Map";
import IncidentList, { type IncidentForList } from "@/components/IncidentList";
import PushNotificationManager from "@/components/PushNotificationManager";
import InstallPrompt from "@/components/InstallPrompt";
import AlertPreferences from "@/components/AlertPreferences";
import CameraView from "@/components/CameraView";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import FilterPanel, {
  type FilterState,
  type IncidentType,
} from "@/components/FilterPanel";
import { CITIES } from "@/lib/cities";
import { haversineKm } from "@/lib/geo";
import { openNavigation, openWazeNavigation } from "@/lib/navigation";
import IncidentToast, { type ToastIncident } from "@/components/IncidentToast";
import { User, Sliders, Map as MapIcon, List } from "lucide-react";

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
  const userName = session?.user?.name ?? null;
  const [incidents, setIncidents] = useState<IncidentForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
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
  const [filters, setFilters] = useState<FilterState>({
    incidentTypes: [
      "accident",
      "collision",
      "fire",
      "hazard",
      "jam",
      "medical",
      "police",
      "weather",
    ],
    radiusKm: 50, // Show all by default (max radius)
    showTrafficFlow: true, // Show traffic flow by default
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMainView, setMobileMainView] = useState<"map" | "list">("map");
  const [toasts, setToasts] = useState<ToastIncident[]>([]);
  const prevIncidentIdsRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    fetch(`/api/push/me?deviceId=${encodeURIComponent(deviceId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { tier?: string; incidentSources?: string } | null) => {
        if (data?.tier === "pro") setTier("pro");
        else setTier("free");
        if (data?.incidentSources) {
          const arr = String(data.incidentSources)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (arr.length > 0) setUserIncidentSources(arr);
        } else {
          setUserIncidentSources(["tomtom", "511on"]);
        }
      })
      .catch(() => {
        setTier("free");
        setUserIncidentSources(["tomtom", "511on"]);
      });
  }, []);

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

  // Fetch ETA for selected incident and top 3 when we have location
  useEffect(() => {
    if (!userLocation || incidents.length === 0) return;
    const [lng, lat] = userLocation;
    const toFetch = selectedId
      ? [
          selectedId,
          ...incidents
            .filter((i) => i.id !== selectedId)
            .slice(0, 2)
            .map((i) => i.id),
        ]
      : incidents.slice(0, 3).map((i) => i.id);
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
  }, [userLocation, incidents, selectedId]);

  // Helper function to map icon category to incident type
  const getIncidentTypeFromCategory = (
    category: number,
  ): IncidentType | null => {
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
        return "hazard"; // roadwork shown as hazard
      case 6:
        return "jam";
      case 10:
        return "weather";
      case 11:
      case 14:
        return "accident"; // breakdown shown as accident
      default:
        return "hazard"; // default to hazard for unknown types
    }
  };

  // Filter incidents based on type and radius
  const filteredIncidents = incidents.filter((inc) => {
    // Filter by incident type
    const incidentType = getIncidentTypeFromCategory(inc.iconCategory);
    if (incidentType && !filters.incidentTypes.includes(incidentType)) {
      return false;
    }

    // Filter by radius if user location is available (only if radius is less than 50km)
    if (userLocation && filters.radiusKm < 50) {
      const [lng, lat] = inc.coordinates;
      const distance = haversineKm(userLocation[1], userLocation[0], lat, lng);
      if (distance > filters.radiusKm) {
        return false;
      }
    }

    return true;
  });

  const incidentsWithEta = filteredIncidents.map((inc) => ({
    ...inc,
    etaMinutes: etaMap[inc.id] ?? null,
  }));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      {/* Desktop header — ditchappmobile spacing: 10–12px padding, 40px controls */}
      <header className="hidden shrink-0 items-center justify-between gap-3 border-b border-ink/[0.08] bg-paper px-3 py-2.5 md:flex">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPrefsOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/[0.12] bg-paper text-muted shadow-sm transition hover:border-sky/40 hover:text-ink"
            title="Account"
            aria-label="Open preferences"
          >
            <User className="size-[22px]" strokeWidth={2} />
          </button>
          <div
            className="inline-flex items-center gap-2 rounded-full bg-sky px-3.5 py-2 font-bold uppercase tracking-wide text-paper shadow-[0_2px_8px_rgba(63,167,230,0.3)]"
            style={{ fontSize: 13, letterSpacing: "0.06em" }}
          >
            <span
              className="size-2 rounded-full bg-paper"
              style={{
                animation: "da-pulse 1.6s ease-out infinite",
              }}
            />
            Online
          </div>
          {userName && (
            <span className="hidden text-sm text-muted lg:inline">
              {userName}
            </span>
          )}
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
            className="rounded-lg border border-ink/15 bg-ice/80 px-2 py-1.5 text-sm text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/25"
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper shadow-md transition hover:bg-deep"
            title="Filters"
            aria-label="Open filters"
          >
            <Sliders className="size-5" strokeWidth={2} />
          </button>
          <a
            href="/insights"
            className="shrink-0 rounded-lg border border-ink/12 bg-ice/60 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-ice"
          >
            Insights
          </a>
          <button
            type="button"
            onClick={() => setPrefsOpen(true)}
            className="shrink-0 rounded-lg border border-ink/12 bg-ice/60 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-ice"
          >
            Prefs
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-ice hover:text-ink"
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile header */}
      <header className="flex shrink-0 items-center gap-2.5 border-b border-ink/[0.08] bg-paper/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/[0.12] bg-paper text-muted shadow-sm"
          aria-label="Open menu"
        >
          <User className="size-[22px]" strokeWidth={2} />
        </button>
        <div className="flex flex-1 justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-sky px-3.5 py-2 font-bold uppercase tracking-wide text-paper shadow-[0_2px_8px_rgba(63,167,230,0.3)]"
            style={{ fontSize: 13, letterSpacing: "0.06em" }}
          >
            <span
              className="size-2 rounded-full bg-paper"
              style={{ animation: "da-pulse 1.6s ease-out infinite" }}
            />
            Online
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFilterPanelOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper shadow-md"
          aria-label="Filters"
        >
          <Sliders className="size-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() =>
            setMobileMainView((v) => (v === "map" ? "list" : "map"))
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper shadow-md"
          aria-label={mobileMainView === "map" ? "Show list" : "Show map"}
        >
          {mobileMainView === "map" ? (
            <List className="size-5" strokeWidth={2} />
          ) : (
            <MapIcon className="size-5" strokeWidth={2} />
          )}
        </button>
      </header>

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
                if (prefs.tier === "pro" || prefs.tier === "free") {
                  setTier(prefs.tier);
                  // Clear heatmap blocked message when upgrading to pro
                  if (prefs.tier === "pro") {
                    setHeatmapBlocked(false);
                  }
                }
                if (prefs.incidentSources)
                  setUserIncidentSources(prefs.incidentSources);
              }}
            />
          </div>
        </div>
      )}

      {/* Main content - Desktop: sidebar + map | Mobile: full screen map only */}
      <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden md:flex-row md:gap-4 md:p-4">
        <aside className="hidden min-h-0 w-full max-w-[420px] flex-none flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-paper shadow-sm md:flex md:w-96">
          <h2 className="shrink-0 border-b border-ink/[0.08] px-4 py-2.5 font-display text-sm font-bold text-muted">
            Incidents
          </h2>
          <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <IncidentList
            incidents={incidentsWithEta}
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

        {/* Map section - Full screen on mobile, regular on desktop */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
          {mobileMainView === "list" ? (
            <IncidentList
              incidents={incidentsWithEta}
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
          ) : (
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 min-h-0">
                <Map
                  incidents={incidentsWithEta}
                  userLocation={userLocation}
                  selectedId={selectedId}
                  onIncidentSelect={(id) => {
                    setSelectedId(id);
                    setMobileMainView("list");
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
            </div>
          )}
        </div>

        <section className="relative hidden min-h-0 flex-1 flex-col md:flex">
          {/* Desktop-only controls above map */}
          <div className="hidden md:flex items-center gap-2 shrink-0 flex-wrap mb-2">
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
              className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                heatmapOn
                  ? "border border-sky/40 bg-sky/15 text-deep"
                  : "border border-ink/10 bg-ice/80 text-ink hover:bg-ice"
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
                  className="rounded-lg border border-ink/12 bg-ice/80 px-2 py-1.5 text-xs text-ink"
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
                    className="rounded-lg border border-ink/12 bg-ice/80 px-2 py-1.5 text-xs text-ink"
                  >
                    <option value="day">Last 24h</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                  </select>
                )}
              </>
            )}
          </div>

          {/* Map container */}
          <div className="flex-1 min-h-0">
            <Map
              incidents={incidentsWithEta}
              userLocation={userLocation}
              selectedId={selectedId}
              onIncidentSelect={(id) => {
                setSelectedId(id);
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
        </section>
      </div>

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
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-ice">
                <User className="size-6 text-muted" />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
                  <span className="size-1.5 rounded-full bg-paper" />
                  Online
                </span>
                {userName && (
                  <p className="mt-1 text-sm text-muted">{userName}</p>
                )}
              </div>
            </div>
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
            <a
              href="/insights"
              className="block w-full rounded-xl border border-ink/10 bg-ice/60 px-4 py-3 text-left font-semibold text-ink transition hover:bg-ice"
            >
              Insights
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setPrefsOpen(true);
              }}
              className="w-full rounded-xl border border-ink/10 bg-ice/60 px-4 py-3 text-left font-semibold text-ink transition hover:bg-ice"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full rounded-xl bg-red-500/10 px-4 py-3 text-left font-semibold text-red-700 transition hover:bg-red-500/15"
            >
              Sign out
            </button>
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
            <div className="rounded-lg border border-red-300/60 bg-red-50 p-2 text-xs text-red-700 shadow-lg backdrop-blur">
              {error}
            </div>
          )}
          {locationError && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-2 text-xs text-amber-900 shadow-lg backdrop-blur">
              {locationError} Enable location for distance and alerts.
            </div>
          )}
          {heatmapBlocked && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-2 text-xs text-amber-900 shadow-lg backdrop-blur">
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
        onFiltersChange={setFilters}
      />

      <PushNotificationManager userLocation={userLocation} />
      <InstallPrompt />
    </div>
  );
}
