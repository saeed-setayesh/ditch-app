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
  const [mobileIncidentListOpen, setMobileIncidentListOpen] = useState(false);
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
          const newIds = new Set(newList.map((i: IncidentForList) => i.id));
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
    <div className="h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden">
      {/* Header - hidden on mobile, visible on desktop */}
      <header className="hidden md:flex shrink-0 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 items-center justify-between gap-3 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wide">
              ONLINE
            </span>
            {userName && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {userName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-200 text-sm"
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
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400"
          >
            Filters
          </button>
          <a
            href="/insights"
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Insights
          </a>
          <button
            type="button"
            onClick={() => setPrefsOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Prefs
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="shrink-0 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            title="Sign out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {prefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
      <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-4 md:p-4 min-h-0 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden md:flex md:w-96 flex-none flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden min-h-0">
          <h2 className="shrink-0 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
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
        <section className="flex-1 flex flex-col min-h-0 relative">
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
              className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                heatmapOn
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
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
                  className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-200 text-xs"
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
                    className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-200 text-xs"
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
                // On mobile, open incident list drawer when incident is clicked
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setMobileIncidentListOpen(true);
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

          {/* Mobile floating buttons */}
          <div className="md:hidden fixed bottom-4 right-4 flex flex-col gap-2 z-30">
            <button
              type="button"
              onClick={() => setMobileIncidentListOpen(true)}
              className="w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
              title="View incidents"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              title="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="18" x2="20" y2="18"/>
              </svg>
            </button>
          </div>
        </section>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wide">
                  ONLINE
                </span>
                {userName && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {userName}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-200"
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
              className="w-full px-4 py-3 rounded-lg text-left font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Filters
            </button>
            <a
              href="/insights"
              className="block w-full px-4 py-3 rounded-lg text-left font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              Insights
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setPrefsOpen(true);
              }}
              className="w-full px-4 py-3 rounded-lg text-left font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full px-4 py-3 rounded-lg text-left font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Mobile incident list drawer */}
      {mobileIncidentListOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Incidents</h2>
            <button
              type="button"
              onClick={() => setMobileIncidentListOpen(false)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <IncidentList
              incidents={incidentsWithEta}
              userLocation={userLocation}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileIncidentListOpen(false);
              }}
              onViewCamera={(incident) => {
                setCameraViewIncident(incident);
                setMobileIncidentListOpen(false);
              }}
              onShowDetails={(incident) => {
                setDetailIncident(incident);
                setMobileIncidentListOpen(false);
              }}
              onNavigate={(incident) => {
                const [lng, lat] = incident.coordinates;
                openNavigation(lat, lng, incident.description);
                setMobileIncidentListOpen(false);
              }}
              onNavigateWaze={(incident) => {
                const [lng, lat] = incident.coordinates;
                openWazeNavigation(lat, lng, incident.description);
                setMobileIncidentListOpen(false);
              }}
              tier={tier}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* New incident toasts — macOS-style, top-right */}
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
        <div className="fixed top-16 right-4 z-20 flex flex-col gap-2 max-w-sm">
          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs backdrop-blur shadow-lg">
              {error}
            </div>
          )}
          {locationError && (
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs backdrop-blur shadow-lg">
              {locationError} Enable location for distance and alerts.
            </div>
          )}
          {heatmapBlocked && (
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs backdrop-blur shadow-lg">
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
