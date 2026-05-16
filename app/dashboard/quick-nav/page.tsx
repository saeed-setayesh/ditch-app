"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import DriverQuickNavEditor from "@/components/DriverQuickNavEditor";
import {
  type DriverShortcut,
  readDriverQuickNavsFromLocalStorage,
  writeDriverQuickNavsToLocalStorage,
} from "@/lib/driverShortcuts";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("traficapp_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("traficapp_device_id", id);
  }
  return id;
}

export default function QuickNavPage() {
  const [quickNavs, setQuickNavs] = useState<DriverShortcut[]>([]);

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

  return (
    <div className="min-h-dvh bg-background text-ink">
      <header className="flex shrink-0 items-center gap-3 border-b border-ink/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-ice"
          aria-label="Back to map"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </Link>
        <h1 className="font-display text-xl font-bold text-ink">
          Quick destinations
        </h1>
      </header>
      <div className="mx-auto max-w-lg px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <DriverQuickNavEditor
          quickNavs={quickNavs}
          onQuickNavsSaved={(navs) => void persistQuickNavs(navs)}
        />
      </div>
    </div>
  );
}
