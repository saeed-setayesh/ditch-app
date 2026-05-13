"use client";

import { type DriverShortcut } from "@/lib/driverShortcuts";
import { openNavigation } from "@/lib/navigation";

type DriverShortcutsBarProps = {
  shortcuts: DriverShortcut[];
  /** Horizontal chips or vertical list under heatmap */
  layout?: "row" | "list";
};

export default function DriverShortcutsBar({
  shortcuts,
  layout = "list",
}: DriverShortcutsBarProps) {
  if (shortcuts.length === 0) return null;

  const buttonClass =
    "rounded-lg border border-ink/12 bg-white px-3 py-2 text-left text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-ice";

  if (layout === "list") {
    return (
      <div className="flex w-full min-w-0 flex-col items-end gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink/80">
          Quick nav
        </span>
        <div className="flex w-full max-w-[14rem] flex-col items-stretch gap-1">
          {shortcuts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openNavigation(s.lat, s.lng, s.label)}
              className={buttonClass}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-ink/80">
        Quick nav
      </span>
      {shortcuts.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => openNavigation(s.lat, s.lng, s.label)}
          className={`shrink-0 ${buttonClass} text-center`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
