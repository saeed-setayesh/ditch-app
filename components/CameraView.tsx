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
function embedCameraAsIframe(url: string): boolean {
  return url.includes("511on.ca") || url.startsWith("/api/cameras/image");
}

export default function CameraView({ incident, onClose, tier }: Props) {
  void tier;
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
      const enriched = list.map((raw: unknown) => {
        const c = raw as Record<string, unknown>;
        return {
        id: String(
          c.id ??
            c.cameraId ??
            c.externalId ??
            Math.random().toString(36).slice(2),
        ),
        name: (c.name ?? c.title ?? c.cameraName ?? "Camera") as string,
        roadName: (c.roadName ?? null) as string | null,
        intersection: (c.intersection ?? null) as string | null,
        imageUrl: (c.imageUrl ?? c.url ?? c.src ?? "") as string,
        distanceKm: Number(c.distanceKm ?? 0),
        externalId: (c.externalId ?? c.external_id ?? null) as string | null,
        views: undefined,
      };
      }) as CameraForView[];
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
    ? embedCameraAsIframe(currentCamera.imageUrl)
    : false;

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/[0.08] px-3 py-2 sm:px-4 sm:py-3">
        <h2 className="min-w-0 truncate font-display text-base font-bold text-ink sm:text-lg">
          Nearby camera
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-ink/10 bg-ice/80 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-ice"
        >
          Close
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky/30 border-t-sky" />
              <span className="text-sm text-muted">Finding nearby cameras…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-4 text-center">
            <p className="text-muted">{error}</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-lg text-ink">No nearby camera available</p>
            <p className="mt-1 text-sm text-muted">
              Try another incident or check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
              {currentCamera && (
                <div className="min-w-0 flex-1 text-xs text-ink sm:text-sm">
                  <span className="block truncate font-medium sm:inline">
                    {currentCamera.name}
                  </span>
                  {currentCamera.externalId != null &&
                    String(currentCamera.externalId).startsWith("511on") && (
                      <span className="mb-1 inline-block rounded-md bg-sky/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-deep sm:mb-0 sm:ml-2">
                        Public · Ontario 511
                      </span>
                    )}
                  <span className="block text-xs text-muted sm:ml-2 sm:inline">
                    {currentCamera.distanceKm < 1
                      ? `${(currentCamera.distanceKm * 1000).toFixed(0)} m from incident`
                      : `${currentCamera.distanceKm.toFixed(1)} km from incident`}
                  </span>
                </div>
              )}
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setImageKey((k) => k + 1)}
                  className="rounded-lg border border-ink/10 bg-ice/80 px-2 py-1.5 text-xs font-semibold text-ink transition hover:bg-ice"
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
                    className="max-w-[140px] rounded-lg border border-ink/12 bg-ice/80 px-2 py-1.5 text-xs text-ink sm:max-w-none"
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
                    className="rounded-lg border border-ink/12 bg-ice/80 px-2 py-1.5 text-xs text-ink"
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
            <div className="max-h-[42vh] min-h-[200px] w-full shrink-0 overflow-auto rounded-xl border border-ink/[0.1] bg-[#071a2e] sm:max-h-[48vh] md:max-h-none md:min-h-[280px] md:flex-1">
              {useIframe ? (
                <iframe
                  key={imageKey}
                  src={imageSrc}
                  title={currentCamera?.name ?? "Traffic camera"}
                  className="block h-[450px] w-[800px] border-0 bg-[#071a2e] sm:h-[500px] md:h-full md:min-h-[360px]"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external camera URLs, dynamic hosts
                <img
                  key={imageKey}
                  src={imageSrc}
                  alt={currentCamera?.name ?? "Traffic camera"}
                  className="block h-full min-h-[200px] w-full bg-[#071a2e] object-contain"
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
                    className="mt-2 inline-block shrink-0 text-xs font-semibold text-deep hover:text-sky"
                  >
                    View on Ontario 511 →
                  </a>
                );
              })()}
            <p className="mt-2 shrink-0 font-mono-brand text-xs text-muted">
              Camera auto-refreshes every 15 seconds. Images may be delayed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
