"use client";

import { useEffect, useRef, useState } from "react";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import {
  buildIncidentPinHtml,
  capIncidentsForMap,
  incidentsMarkerKey,
} from "@/lib/mapPins";
import { circlePolygonGeoJson } from "@/lib/geo";

/** Default view before GPS — continental North America */
const DEFAULT_MAP_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_MAP_ZOOM = 4;

const HEATMAP_SOURCE_ID = "heatmap-incidents-source";
const HEATMAP_LAYER_ID = "heatmap-incidents-layer";
const RADIUS_SOURCE_ID = "driver-monitor-radius-source";
const RADIUS_FILL_LAYER_ID = "driver-monitor-radius-fill";
const RADIUS_LINE_LAYER_ID = "driver-monitor-radius-line";

function zoomForMonitorRadiusKm(radiusKm: number): number {
  if (radiusKm <= 30) return 11;
  if (radiusKm <= 55) return 10;
  if (radiusKm <= 85) return 9;
  if (radiusKm <= 120) return 8.5;
  return 8;
}

export type IncidentForMap = {
  id: string;
  coordinates: [number, number];
  description: string;
  iconCategory: number;
  from?: string;
  to?: string;
};

export type MapColorScheme = "light" | "dark";

type MapProps = {
  incidents: IncidentForMap[];
  userLocation?: [number, number] | null;
  onIncidentSelect?: (id: string) => void;
  selectedId?: string | null;
  heatmapOn?: boolean;
  heatmapPeriod?: string;
  heatmapCityId?: string;
  /** When live heatmap is on, TomTom bbox follows this center + radius (km). */
  heatmapLiveCenter?: [number, number] | null;
  heatmapLiveRadiusKm?: number;
  heatmapDeviceId?: string | null;
  heatmapSource?: "platform" | "live";
  onHeatmapBlocked?: () => void;
  showTrafficFlow?: boolean;
  /** Monitoring radius (km) — GeoJSON ring around `userLocation`. */
  radiusKm?: number;
  /** TomTom base map palette; driver dashboard passes theme here. */
  colorScheme?: MapColorScheme;
};

type TomTomMap = {
  remove: () => void;
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void;
};
type TomTomMarker = { remove: () => void };

/** TomTom merged style (see Map Display API — merged style method). */
function mergedTomTomStyle(scheme: MapColorScheme) {
  if (scheme === "dark") {
    return {
      map: "basic_night",
      poi: "poi_main",
      trafficIncidents: "incidents_night",
      trafficFlow: "flow_relative0-dark",
    };
  }
  return {
    map: "basic_main",
    poi: "poi_main",
    trafficIncidents: "incidents_day",
    trafficFlow: "flow_relative0",
  };
}

export default function Map({
  incidents,
  userLocation,
  onIncidentSelect,
  selectedId,
  heatmapOn = false,
  heatmapPeriod = "week",
  heatmapCityId = "DitchApp",
  heatmapLiveCenter = null,
  heatmapLiveRadiusKm,
  heatmapDeviceId = null,
  heatmapSource = "platform",
  onHeatmapBlocked,
  showTrafficFlow = false,
  radiusKm = 50,
  colorScheme = "light",
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<TomTomMap | null>(null);
  const colorSchemeRef = useRef(colorScheme);
  colorSchemeRef.current = colorScheme;
  const ttRef = useRef<
    typeof import("@tomtom-international/web-sdk-maps") | null
  >(null);
  const markersRef = useRef<TomTomMarker[]>([]);
  const userMarkerRef = useRef<TomTomMarker | null>(null);
  const markersSnapshotKeyRef = useRef<string | null>(null);
  const markerMetaRef = useRef<Map<string, number>>(new globalThis.Map());
  const markerElsRef = useRef<Map<string, HTMLDivElement>>(new globalThis.Map());
  const onIncidentSelectRef = useRef(onIncidentSelect);
  onIncidentSelectRef.current = onIncidentSelect;
  const [ready, setReady] = useState(false);
  const [maxMarkers, setMaxMarkers] = useState(() =>
    typeof window === "undefined" ? 400 : window.matchMedia("(max-width: 767px)").matches ? 100 : 400,
  );
  const heatmapAddedRef = useRef(false);
  const [heatmapEmpty, setHeatmapEmpty] = useState(false);
  const [mapStyleEpoch, setMapStyleEpoch] = useState(0);
  const prevColorSchemeRef = useRef<MapColorScheme | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () =>
      setMaxMarkers(mq.matches ? 100 : 400);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const containerEl = containerRef.current;
    (async () => {
      if (!containerEl) return;
      const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!key) {
        console.warn("NEXT_PUBLIC_TOMTOM_API_KEY not set");
        return;
      }
      const tt = (await import("@tomtom-international/web-sdk-maps")).default;
      if (cancelled) return;
      ttRef.current = tt;

      const scheme = colorSchemeRef.current;
      const map = tt.map({
        key,
        container: containerEl,
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        style: mergedTomTomStyle(scheme),
        stylesVisibility: {
          trafficFlow: showTrafficFlow,
          trafficIncidents: false,
        },
      }) as TomTomMap & {
        showTrafficFlow?: () => void;
        hideTrafficFlow?: () => void;
      };
      mapRef.current = map;
      setReady(true);
      // Repaint after container gets final size (helps on mobile/resize)
      const doResize = () => {
        if (!cancelled && mapRef.current) {
          const m = mapRef.current as TomTomMap & { resize?: () => void };
          m.resize?.();
        }
      };
      requestAnimationFrame(doResize);
      const t1 = setTimeout(doResize, 200);
      const t2 = setTimeout(doResize, 600);
      const t3 = setTimeout(doResize, 1500);
      const onWindowResize = () => doResize();
      window.addEventListener("resize", onWindowResize);

      // Use ResizeObserver for container size changes
      let resizeObserver: ResizeObserver | null = null;
      if (containerEl && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => doResize());
        resizeObserver.observe(containerEl);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener("resize", onWindowResize);
        resizeObserver?.disconnect();
        cancelled = true;
        for (const m of markersRef.current) m.remove();
        markersRef.current = [];
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = null;
        map.remove();
        mapRef.current = null;
        ttRef.current = null;
      };
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        for (const m of markersRef.current) m.remove();
        markersRef.current = [];
        markersSnapshotKeyRef.current = null;
        // Clear lookup maps so selection effect doesn't touch detached nodes
        // eslint-disable-next-line react-hooks/exhaustive-deps -- use latest Maps on teardown
        markerMetaRef.current.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- use latest Maps on teardown
        markerElsRef.current.clear();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single TomTom mount; flyTo + effects handle city/traffic prefs
  }, []);

  // Swap TomTom merged style when dashboard light/dark theme changes (heatmap layers are cleared — epoch bumps below).
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (prevColorSchemeRef.current === null) {
      prevColorSchemeRef.current = colorScheme;
      return;
    }
    if (prevColorSchemeRef.current === colorScheme) return;
    prevColorSchemeRef.current = colorScheme;
    const map = mapRef.current as TomTomMap & {
      setStyle?: (style: ReturnType<typeof mergedTomTomStyle>) => void;
      once?: (ev: string, fn: () => void) => void;
    };
    try {
      map.setStyle?.(mergedTomTomStyle(colorScheme));
      map.once?.("load", () => {
        setMapStyleEpoch((e) => e + 1);
      });
    } catch (e) {
      console.warn("Map style update failed:", e);
    }
  }, [ready, colorScheme]);

  useEffect(() => {
    if (!ready || !mapRef.current || !ttRef.current) return;
    const map = mapRef.current;
    const tt = ttRef.current;

    const capped = capIncidentsForMap(incidents, {
      maxMarkers,
      selectedId,
      userLocation: userLocation ?? null,
    });
    const key = incidentsMarkerKey(capped);
    if (markersSnapshotKeyRef.current === key) return;
    markersSnapshotKeyRef.current = key;

    markerMetaRef.current.clear();
    markerElsRef.current.clear();
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const inc of capped) {
      const [lng, lat] = inc.coordinates;
      const el = document.createElement("div");
      el.className = "tt-incident-marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.pointerEvents = "auto";
      el.setAttribute("data-tt-marker-incident-id", inc.id);

      el.innerHTML = buildIncidentPinHtml(
        inc.iconCategory,
        inc.id === selectedId,
      );
      markerMetaRef.current.set(inc.id, inc.iconCategory);
      markerElsRef.current.set(inc.id, el);

      const marker = new tt.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map as never) as TomTomMarker;

      el.addEventListener("click", () => {
        onIncidentSelectRef.current?.(inc.id);
      });
      markersRef.current.push(marker);
    }
  }, [
    ready,
    incidents,
    userLocation,
    selectedId,
    maxMarkers,
  ]);

  useEffect(() => {
    if (!ready) return;
    markerElsRef.current.forEach((el, id) => {
      const cat = markerMetaRef.current.get(id);
      if (cat === undefined) return;
      el.innerHTML = buildIncidentPinHtml(cat, id === selectedId);
    });
  }, [ready, selectedId]);

  useEffect(() => {
    if (!ready || !mapRef.current || !ttRef.current || userLocation == null)
      return;
    const map = mapRef.current;
    const tt = ttRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    const [lng, lat] = userLocation;
    const el = document.createElement("div");
    el.className = "tt-user-marker";
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.background = "#2563eb";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
    const marker = new tt.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map as never) as TomTomMarker;
    userMarkerRef.current = marker;
  }, [ready, userLocation]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const inc = incidents.find((i) => i.id === selectedId);
    if (!inc) return;
    mapRef.current.flyTo({ center: inc.coordinates, zoom: 14 });
  }, [selectedId, incidents]);

  useEffect(() => {
    if (!ready || !mapRef.current || userLocation == null) return;
    if (selectedId) return;
    const [lng, lat] = userLocation;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: zoomForMonitorRadiusKm(radiusKm),
    });
  }, [ready, userLocation, radiusKm, selectedId]);

  // Update traffic flow visibility using TomTom's showTrafficFlow/hideTrafficFlow
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current as TomTomMap & {
      showTrafficFlow?: () => void;
      hideTrafficFlow?: () => void;
    };
    try {
      if (showTrafficFlow && typeof map.showTrafficFlow === "function") {
        map.showTrafficFlow();
      } else if (typeof map.hideTrafficFlow === "function") {
        map.hideTrafficFlow();
      }
    } catch (e) {
      console.warn("Traffic flow toggle failed:", e);
    }
  }, [ready, showTrafficFlow, mapStyleEpoch]);

  /** Monitoring radius ring (rival-style soft circle). */
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current as TomTomMap & {
      addSource: (id: string, source: { type: string; data: unknown }) => void;
      addLayer: (layer: {
        id: string;
        source: string;
        type: string;
        paint?: Record<string, unknown>;
      }) => void;
      removeLayer: (id: string) => void;
      removeSource: (id: string) => void;
      getLayer: (id: string) => unknown;
      getSource: (id: string) => unknown;
      isStyleLoaded?: () => boolean;
      once?: (event: string, fn: () => void) => void;
    };

    const removeRadius = () => {
      try {
        if (map.getLayer?.(RADIUS_LINE_LAYER_ID))
          map.removeLayer(RADIUS_LINE_LAYER_ID);
        if (map.getLayer?.(RADIUS_FILL_LAYER_ID))
          map.removeLayer(RADIUS_FILL_LAYER_ID);
        if (map.getSource?.(RADIUS_SOURCE_ID))
          map.removeSource(RADIUS_SOURCE_ID);
      } catch {
        // ignore
      }
    };

    if (!userLocation || radiusKm < 1) {
      removeRadius();
      return;
    }

    const [lng, lat] = userLocation;
    const data = circlePolygonGeoJson(lat, lng, radiusKm);
    removeRadius();

    const addRadiusLayers = () => {
      try {
        map.addSource(RADIUS_SOURCE_ID, {
          type: "geojson",
          data,
        });
        map.addLayer({
          id: RADIUS_FILL_LAYER_ID,
          type: "fill",
          source: RADIUS_SOURCE_ID,
          paint: {
            "fill-color": colorScheme === "dark" ? "#3b82f6" : "#60a5fa",
            "fill-opacity": 0.1,
          },
        });
        map.addLayer({
          id: RADIUS_LINE_LAYER_ID,
          type: "line",
          source: RADIUS_SOURCE_ID,
          paint: {
            "line-color": colorScheme === "dark" ? "#93c5fd" : "#2563eb",
            "line-width": 2,
            "line-opacity": 0.9,
          },
        });
      } catch (e) {
        console.warn("Radius layer error:", e);
      }
    };

    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
      addRadiusLayers();
    } else if (typeof map.once === "function") {
      map.once("load", addRadiusLayers);
    } else {
      addRadiusLayers();
    }

    return () => {
      removeRadius();
    };
  }, [
    ready,
    userLocation,
    radiusKm,
    colorScheme,
    mapStyleEpoch,
  ]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current as TomTomMap & {
      addSource: (id: string, source: { type: string; data: unknown }) => void;
      addLayer: (layer: {
        id: string;
        source: string;
        type: string;
        paint?: Record<string, unknown>;
      }) => void;
      removeLayer: (id: string) => void;
      removeSource: (id: string) => void;
      getLayer: (id: string) => unknown;
      getSource: (id: string) => unknown;
    };

    if (!heatmapOn) {
      setHeatmapEmpty(false);
      if (heatmapAddedRef.current) {
        try {
          if (map.getLayer?.(HEATMAP_LAYER_ID))
            map.removeLayer(HEATMAP_LAYER_ID);
          if (map.getSource?.(HEATMAP_SOURCE_ID))
            map.removeSource(HEATMAP_SOURCE_ID);
        } catch {
          // ignore
        }
        heatmapAddedRef.current = false;
      }
      return;
    }

    let cancelled = false;
    setHeatmapEmpty(false);
    const params = new URLSearchParams({
      city: heatmapCityId,
      period: heatmapPeriod,
      source: heatmapSource,
    });
    if (heatmapDeviceId) params.set("deviceId", heatmapDeviceId);
    if (
      heatmapSource === "live" &&
      heatmapLiveCenter &&
      heatmapLiveRadiusKm != null &&
      heatmapLiveRadiusKm >= 1
    ) {
      const [hlng, hlat] = heatmapLiveCenter;
      params.set("lat", String(hlat));
      params.set("lng", String(hlng));
      params.set("radiusKm", String(heatmapLiveRadiusKm));
    }
    fetch(`/api/heatmap?${params.toString()}`)
      .then((r) => {
        if (r.status === 402) {
          onHeatmapBlocked?.();
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(
        (data: { geojson?: { type: string; features: unknown[] } } | null) => {
          if (cancelled) return;
          if (!data) return;
          const features = data.geojson?.features ?? [];
          if (features.length === 0) {
            setHeatmapEmpty(true);
            return;
          }
          if (heatmapAddedRef.current) {
            try {
              if (map.getLayer?.(HEATMAP_LAYER_ID))
                map.removeLayer(HEATMAP_LAYER_ID);
              if (map.getSource?.(HEATMAP_SOURCE_ID))
                map.removeSource(HEATMAP_SOURCE_ID);
            } catch {
              // ignore
            }
            heatmapAddedRef.current = false;
          }
          const addHeatmapLayer = () => {
            try {
              map.addSource(HEATMAP_SOURCE_ID, {
                type: "geojson",
                data: data.geojson,
              });
              map.addLayer({
                id: HEATMAP_LAYER_ID,
                source: HEATMAP_SOURCE_ID,
                type: "heatmap",
                paint: {
                  "heatmap-weight": ["get", "weight"],
                  "heatmap-intensity": 1,
                  "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    20,
                    12,
                    50,
                  ],
                  "heatmap-opacity": 0.75,
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0,
                    "rgba(0,0,255,0)",
                    0.3,
                    "rgba(0,255,255,0.6)",
                    0.6,
                    "rgba(0,255,0,0.8)",
                    1,
                    "rgba(255,165,0,1)",
                  ],
                },
              });
              heatmapAddedRef.current = true;
            } catch (err) {
              console.error("Heatmap layer error:", err);
            }
          };
          const mapWithLoad = map as TomTomMap & {
            isStyleLoaded?: () => boolean;
            once?: (event: string, fn: () => void) => void;
          };
          if (
            typeof mapWithLoad.isStyleLoaded === "function" &&
            mapWithLoad.isStyleLoaded()
          ) {
            addHeatmapLayer();
          } else if (typeof mapWithLoad.once === "function") {
            mapWithLoad.once("load", addHeatmapLayer);
          } else {
            addHeatmapLayer();
          }
        },
      )
      .catch(() => {
        onHeatmapBlocked?.();
      });

    return () => {
      cancelled = true;
    };
  }, [
    ready,
    heatmapOn,
    heatmapPeriod,
    heatmapCityId,
    heatmapLiveCenter,
    heatmapLiveRadiusKm,
    heatmapDeviceId,
    heatmapSource,
    onHeatmapBlocked,
    mapStyleEpoch,
  ]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${colorScheme === "dark" ? "bg-[#0a0f18]" : "bg-[#071a2e]"}`}
      style={{ height: "100%", minHeight: 200 }}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-ink/40">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky/30 border-t-sky" />
            <span className="text-sm text-ice">Loading map…</span>
          </div>
        </div>
      )}
      {heatmapOn && heatmapEmpty && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-lg border border-white/15 bg-ink/90 px-3 py-2 text-sm text-ice shadow-lg backdrop-blur">
          {heatmapSource === "platform"
            ? "No platform data for this period yet. Switch to Live to see current incidents from TomTom, or run the cron to collect data."
            : "No live incidents in this area right now."}
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
