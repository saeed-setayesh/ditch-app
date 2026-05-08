"use client";

import { driverShortcutsForCity } from "@/lib/driverShortcuts";
import { openNavigation } from "@/lib/navigation";

export default function DriverShortcutsBar({ cityId }: { cityId: string }) {
  const shortcuts = driverShortcutsForCity(cityId);
  if (shortcuts.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted">
        Quick nav
      </span>
      {shortcuts.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => openNavigation(s.lat, s.lng, s.label)}
          className="shrink-0 rounded-full border border-ink/12 bg-paper px-3 py-1 text-xs font-semibold text-ink shadow-sm transition hover:border-sky/35 hover:bg-sky/10"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
