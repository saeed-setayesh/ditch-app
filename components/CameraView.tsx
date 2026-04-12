"use client";

import { useState, useEffect, useCallback } from "react";

export type CameraForView = {
  id: string;
  name: string;
  roadName: string | null;
  intersection: string | null;
  imageUrl: string;
  distanceKm: number;
  externalId?: string | null;
  views?: { id: string; url: string; description?: string }[] | undefined;
};

type IncidentForCamera = {
  coordinates: [number, number];
  from?: string;
  to?: string;
  description?: string;
};

type Props = {
  incident: IncidentForCamera | null;
  onClose: () => void;
  tier: "free" | "pro";
};

const REFRESH_INTERVAL_MS = 15_000; // Refresh every 15 seconds for all users

function imageUrlWithCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

/** Ontario 511 only provides map/camera page URLs, not direct images; we embed in an iframe. Our proxy redirects to 511. */
function useIframeForCamera(url: string): boolean {
  return url.includes("511on.ca") || url.startsWith("/api/cameras/image");
}

export default function CameraView({ incident, onClose, tier }: Props) {
  const [cameras, setCameras] = useState<CameraForView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);

  const canSwitch = cameras.length > 1;
  const refreshIntervalMs = REFRESH_INTERVAL_MS;

  const fetchNearby = useCallback(async () => {
    if (!incident) return;
    const [lng, lat] = incident.coordinates;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        city: "DitchApp",
      });
      if (incident.from) params.set("roadFrom", incident.from);
      if (incident.to) params.set("roadTo", incident.to);
      const res = await fetch(`/api/cameras/nearby?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load cameras");
      const data = await res.json();
      const list =
        data.cameras ??
        (data.primary ? [data.primary, ...(data.fallbacks ?? [])] : []);
      const enriched = list.map((c: any) => ({
        id: String(
          c.id ??
            c.cameraId ??
            c.externalId ??
            Math.random().toString(36).slice(2),
        ),
        name: c.name ?? c.title ?? c.cameraName ?? "Camera",
        roadName: c.roadName ?? null,
        intersection: c.intersection ?? null,
        imageUrl: c.imageUrl ?? c.url ?? c.src ?? "",
        distanceKm: Number(c.distanceKm ?? 0),
        externalId: c.externalId ?? c.external_id ?? null,
        views: undefined,
      })) as CameraForView[];
      setCameras(enriched);
      setSelectedIndex(0);
      setImageKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCameras([]);
    } finally {
      setLoading(false);
    }
  }, [incident]);

  // fetch additional views for Ontario 511 cameras
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < cameras.length; i++) {
        const cam = cameras[i];
        if (!cam) continue;
        if (cam.externalId && String(cam.externalId).startsWith("511on")) {
          try {
            const res = await fetch(
              `/api/cameras/views?externalId=${encodeURIComponent(String(cam.externalId))}`,
            );
            if (!res.ok) continue;
            const json = await res.json();
            if (cancelled) return;
            if (
              json.views &&
              Array.isArray(json.views) &&
              json.views.length > 0
            ) {
              setCameras((prev) => {
                const copy = [...prev];
                copy[i] = { ...copy[i], views: json.views };
                return copy;
              });
            }
          } catch {
            // ignore per-camera errors
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameras]);

  useEffect(() => {
    if (!incident) return;
    fetchNearby();
  }, [incident, fetchNearby]);

  useEffect(() => {
    if (cameras.length === 0) return;
    const t = setInterval(() => {
      setImageKey((k) => k + 1);
    }, refreshIntervalMs);
    return () => clearInterval(t);
  }, [cameras.length, refreshIntervalMs]);

  const currentCamera = cameras[selectedIndex];
  const imageSrc = currentCamera
    ? imageUrlWithCacheBust(currentCamera.imageUrl)
    : "";
  const useIframe = currentCamera
    ? useIframeForCamera(currentCamera.imageUrl)
    : false;

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
      <header className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate min-w-0">
          Nearby camera
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Close
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-3 sm:p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Finding nearby cameras…
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="text-lg text-zinc-700 dark:text-zinc-300">No nearby camera available</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-500 mt-1">
              Try another incident or check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 flex flex-wrap items-center gap-2 mb-2">
              {currentCamera && (
                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 min-w-0 flex-1">
                  <span className="font-medium truncate block sm:inline">
                    {currentCamera.name}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-500 sm:ml-2 block sm:inline text-xs">
                    {currentCamera.distanceKm < 1
                      ? `${(currentCamera.distanceKm * 1000).toFixed(0)} m from incident`
                      : `${currentCamera.distanceKm.toFixed(1)} km from incident`}
                  </span>
                </div>
              )}
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setImageKey((k) => k + 1)}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  Refresh
                </button>
                {canSwitch && (
                  <select
                    value={selectedIndex}
                    onChange={(e) => {
                      setSelectedIndex(Number(e.target.value));
                      setImageKey((k) => k + 1);
                    }}
                    className="rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-zinc-900 dark:text-zinc-200 text-xs max-w-[140px] sm:max-w-none"
                  >
                    {cameras.map((c, i) => (
                      <option key={c.id} value={i}>
                        {c.name} ({c.distanceKm < 1 ? `${(c.distanceKm * 1000).toFixed(0)} m` : `${c.distanceKm.toFixed(1)} km`})
                      </option>
                    ))}
                  </select>
                )}
                {currentCamera?.views && currentCamera.views.length > 0 && (
                  <select
                    value={String(
                      currentCamera.views.findIndex((v) =>
                        imageSrc.includes(v.url),
                      ) ?? 0,
                    )}
                    onChange={(e) => {
                      const vi = Number(e.target.value);
                      const view = currentCamera.views?.[vi];
                      if (view) {
                        setCameras((prev) => {
                          const copy = [...prev];
                          copy[selectedIndex] = {
                            ...copy[selectedIndex],
                            imageUrl: view.url,
                          };
                          return copy;
                        });
                        setImageKey((k) => k + 1);
                      }
                    }}
                    className="rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-zinc-900 dark:text-zinc-200 text-xs"
                  >
                    {currentCamera.views.map((v, idx) => (
                      <option key={v.id ?? v.url} value={idx}>
                        {v.description ?? `View ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="shrink-0 w-full rounded-xl overflow-auto bg-zinc-900 border border-zinc-200 dark:border-zinc-800 min-h-[200px] max-h-[42vh] sm:max-h-[48vh] md:flex-1 md:min-h-[280px] md:max-h-none">
              {useIframe ? (
                <iframe
                  key={imageKey}
                  src={imageSrc}
                  title={currentCamera?.name ?? "Traffic camera"}
                  className="block w-[800px] h-[450px] sm:h-[500px] md:h-full md:min-h-[360px] border-0 bg-zinc-900"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <img
                  key={imageKey}
                  src={imageSrc}
                  alt={currentCamera?.name ?? "Traffic camera"}
                  className="block w-full h-full min-h-[200px] object-contain bg-zinc-900"
                />
              )}
            </div>
            {useIframe &&
              currentCamera &&
              (() => {
                const viewIdMatch =
                  currentCamera.imageUrl.match(/viewId=(\d+)/);
                const linkUrl = currentCamera.imageUrl.startsWith("http")
                  ? currentCamera.imageUrl
                  : viewIdMatch
                    ? `https://511on.ca/map/Cctv/${viewIdMatch[1]}`
                    : currentCamera.imageUrl;
                return (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 mt-2 inline-block text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    View on Ontario 511 →
                  </a>
                );
              })()}
            <p className="shrink-0 mt-2 text-xs text-zinc-600 dark:text-zinc-500">
              Camera auto-refreshes every 15 seconds. Images may be delayed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
