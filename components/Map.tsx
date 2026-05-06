"use client";

import { useEffect, useRef, useState } from "react";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { getCityById } from "@/lib/cities";
import { getIconType, getIconColor } from "./IncidentIcons";

export type IncidentForMap = {
  id: string;
  coordinates: [number, number];
  description: string;
  iconCategory: number;
  from?: string;
  to?: string;
};

type MapProps = {
  incidents: IncidentForMap[];
  userLocation?: [number, number] | null;
  onIncidentSelect?: (id: string) => void;
  selectedId?: string | null;
  heatmapOn?: boolean;
  heatmapPeriod?: string;
  heatmapCityId?: string;
  heatmapDeviceId?: string | null;
  heatmapSource?: "platform" | "live";
  onHeatmapBlocked?: () => void;
  showTrafficFlow?: boolean;
};

type TomTomMap = {
  remove: () => void;
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void;
};
type TomTomMarker = { remove: () => void };

const HEATMAP_SOURCE_ID = "heatmap-incidents-source";
const HEATMAP_LAYER_ID = "heatmap-incidents-layer";

// Helper function to create SVG icons for map markers
function createIncidentSVG(iconCategory: number, color: string): string {
  const svgs: Record<number, string> = {
    // Accident
    1: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="${color}" />
      <path d="M12 10 L20 10 L22 16 L20 22 L12 22 L10 16 Z" fill="white" stroke="white" stroke-width="1.5"/>
      <circle cx="13.5" cy="18" r="2" fill="${color}"/>
      <circle cx="18.5" cy="18" r="2" fill="${color}"/>
      <path d="M11 14 L21 14" stroke="${color}" stroke-width="1.5"/>
    </svg>`,

    // Hazard (2, 3, 4, 8)
    2: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#EAB308"/>
      <path d="M16 6 L26 24 L6 24 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M16 12 L16 17" stroke="#EAB308" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="20" r="1" fill="#EAB308"/>
    </svg>`,
    3: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#EAB308"/>
      <path d="M16 6 L26 24 L6 24 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M16 12 L16 17" stroke="#EAB308" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="20" r="1" fill="#EAB308"/>
    </svg>`,
    4: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#EAB308"/>
      <path d="M16 6 L26 24 L6 24 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M16 12 L16 17" stroke="#EAB308" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="20" r="1" fill="#EAB308"/>
    </svg>`,
    8: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#EAB308"/>
      <path d="M16 6 L26 24 L6 24 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M16 12 L16 17" stroke="#EAB308" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="20" r="1" fill="#EAB308"/>
    </svg>`,

    // Roadwork (5, 7, 9)
    5: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#F97316"/>
      <path d="M16 7 L24 22 L8 22 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M13 15 L19 15 M14 18 L18 18" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    7: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#F97316"/>
      <path d="M16 7 L24 22 L8 22 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M13 15 L19 15 M14 18 L18 18" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    9: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#F97316"/>
      <path d="M16 7 L24 22 L8 22 Z" fill="white" stroke="white" stroke-width="1"/>
      <path d="M13 15 L19 15 M14 18 L18 18" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    // Jam
    6: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#8B5CF6"/>
      <g fill="white">
        <rect x="8" y="10" width="5" height="8" rx="1"/>
        <circle cx="9.5" cy="20" r="1.5"/>
        <circle cx="11.5" cy="20" r="1.5"/>
        <rect x="14" y="13" width="5" height="8" rx="1"/>
        <circle cx="15.5" cy="23" r="1.5"/>
        <circle cx="17.5" cy="23" r="1.5"/>
        <rect x="20" y="11" width="5" height="8" rx="1"/>
        <circle cx="21.5" cy="21" r="1.5"/>
        <circle cx="23.5" cy="21" r="1.5"/>
      </g>
    </svg>`,

    // Weather
    10: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#06B6D4"/>
      <ellipse cx="14" cy="13" rx="5" ry="3" fill="white"/>
      <ellipse cx="18" cy="13" rx="5" ry="3.5" fill="white"/>
      <path d="M11 18 L12 21 M15 18 L16 21 M19 18 L20 21" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    // Breakdown (11, 14)
    11: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#F59E0B"/>
      <path d="M10 13 L18 13 L20 17 L18 21 L10 21 L8 17 Z" fill="white" stroke="white" stroke-width="1"/>
      <circle cx="11.5" cy="19" r="1.5" fill="#F59E0B"/>
      <circle cx="16.5" cy="19" r="1.5" fill="#F59E0B"/>
      <path d="M20 10 L24 14 L24 18 L22 20" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>`,
    14: `<svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#F59E0B"/>
      <path d="M10 13 L18 13 L20 17 L18 21 L10 21 L8 17 Z" fill="white" stroke="white" stroke-width="1"/>
      <circle cx="11.5" cy="19" r="1.5" fill="#F59E0B"/>
      <circle cx="16.5" cy="19" r="1.5" fill="#F59E0B"/>
      <path d="M20 10 L24 14 L24 18 L22 20" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>`,
  };

  // Return specific SVG or default
  return (
    svgs[iconCategory] ||
    `<svg width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#6B7280"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
    <circle cx="16" cy="16" r="2" fill="#6B7280"/>
  </svg>`
  );
}

export default function Map({
  incidents,
  userLocation,
  onIncidentSelect,
  selectedId,
  heatmapOn = false,
  heatmapPeriod = "week",
  heatmapCityId = "DitchApp",
  heatmapDeviceId = null,
  heatmapSource = "platform",
  onHeatmapBlocked,
  showTrafficFlow = false,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<TomTomMap | null>(null);
  const ttRef = useRef<
    typeof import("@tomtom-international/web-sdk-maps") | null
  >(null);
  const markersRef = useRef<TomTomMarker[]>([]);
  const userMarkerRef = useRef<TomTomMarker | null>(null);
  const [ready, setReady] = useState(false);
  const heatmapAddedRef = useRef(false);
  const [heatmapEmpty, setHeatmapEmpty] = useState(false);

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

      const city = getCityById(heatmapCityId);
      const map = tt.map({
        key,
        container: containerEl,
        center: (city?.center as [number, number]) ?? [-79.3832, 43.6532],
        zoom: 11,
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
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !ttRef.current) return;
    const map = mapRef.current;
    const tt = ttRef.current;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const inc of incidents) {
      const [lng, lat] = inc.coordinates;
      const iconType = getIconType(inc.iconCategory);
      const iconColor = getIconColor(iconType);
      
      const el = document.createElement("div");
      el.className = "tt-incident-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.cursor = "pointer";
      el.setAttribute("data-incident-id", inc.id);
      
      // Create SVG icon
      el.innerHTML = createIncidentSVG(inc.iconCategory, iconColor);

      const marker = new tt.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map as never) as TomTomMarker;
      el.addEventListener("click", () => {
        onIncidentSelect?.(inc.id);
        // Scroll the incident into view in the list
        setTimeout(() => {
          const listItem = document.querySelector(`[data-incident-id="${inc.id}"]`);
          if (listItem) {
            listItem.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      });
      markersRef.current.push(marker);
    }
  }, [ready, incidents, onIncidentSelect]);

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
    if (!ready || !mapRef.current) return;
    const city = getCityById(heatmapCityId);
    if (city?.center)
      mapRef.current.flyTo({
        center: city.center as [number, number],
        zoom: 11,
      });
  }, [ready, heatmapCityId]);

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
  }, [ready, showTrafficFlow]);

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
    heatmapDeviceId,
    heatmapSource,
    onHeatmapBlocked,
  ]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-[#071a2e]"
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
