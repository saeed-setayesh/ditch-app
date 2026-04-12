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
    <div className="fixed bottom-2 left-2 right-2 md:left-auto md:right-4 md:max-w-sm z-30 p-2.5 rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          {message ? (
            <p className="text-xs text-amber-400">{message}</p>
          ) : (
            <p className="text-xs text-zinc-400">
              Get push alerts for nearby accidents.
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {subscribed ? (
            <button
              type="button"
              onClick={unsubscribe}
              disabled={loading}
              className="px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {loading ? "…" : "Disable"}
            </button>
          ) : (
            <button
              type="button"
              onClick={subscribe}
              disabled={loading}
              className="px-2 py-1 rounded text-xs font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? "…" : "Enable"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
            title="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
