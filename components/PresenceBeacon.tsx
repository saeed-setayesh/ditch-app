"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Periodically uploads coarse driver location so org teammates can poll
 * `/api/realtime/presence` (“spot locator” MVP without websockets).
 */
export default function PresenceBeacon() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const ping = () => {
      if (!navigator.geolocation || cancelled) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            await fetch("/api/realtime/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
          } catch {
            /* ignore */
          }
        },
        () => {},
        {
          enableHighAccuracy: false,
          maximumAge: 120_000,
          timeout: 20_000,
        },
      );
    };

    ping();
    const t = setInterval(ping, 90_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [status]);

  return null;
}
