"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64Url);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

type Props = {
  userLocation: [number, number] | null;
};

export default function PushNotificationManager({ userLocation }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window
    );
  }, []);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
      setMessage("Push not configured (missing VAPID key).");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications were denied.");
        setLoading(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const payload = sub.toJSON();
      const deviceId = getOrCreateDeviceId();
      const body: Record<string, unknown> = {
        endpoint: sub.endpoint,
        keys: payload.keys,
        deviceId,
      };
      if (userLocation) {
        body.lastLat = userLocation[1];
        body.lastLng = userLocation[0];
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Subscribe failed");
      }
      setSubscribed(true);
      setMessage("Notifications enabled. You’ll get alerts for nearby incidents.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  }, [supported, userLocation]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setMessage("Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  }, [supported]);

  if (!supported || dismissed) return null;

  // If already subscribed, show success message briefly then hide
  if (subscribed && !message) return null;

  return (
    <div className="fixed bottom-2 left-2 right-2 z-30 rounded-lg border border-ink/10 bg-paper/95 p-2.5 shadow-lg backdrop-blur md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {message ? (
            <p className="text-xs font-medium text-amber-800">{message}</p>
          ) : (
            <p className="text-xs text-muted">
              Get push alerts for nearby accidents.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {subscribed ? (
            <button
              type="button"
              onClick={unsubscribe}
              disabled={loading}
              className="rounded px-2 py-1 text-xs font-semibold bg-ice text-ink transition hover:bg-ice/80 disabled:opacity-50"
            >
              {loading ? "…" : "Disable"}
            </button>
          ) : (
            <button
              type="button"
              onClick={subscribe}
              disabled={loading}
              className="rounded bg-sky px-2 py-1 text-xs font-semibold text-paper transition hover:bg-deep disabled:opacity-50"
            >
              {loading ? "…" : "Enable"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-muted transition hover:bg-ice hover:text-ink"
            title="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
