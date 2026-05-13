"use client";

import { Mail, Phone, Truck } from "lucide-react";

type DriverCard = {
  name: string;
  email: string;
  phone: string;
  truck: string;
  shift: string;
  status: "on_shift" | "off" | "break";
  lastPing: string;
};

const DRIVERS: DriverCard[] = [
  {
    name: "Maria Chen",
    email: "mchen@demo-fleet.local",
    phone: "(416) 555-0142",
    truck: "T-04",
    shift: "06:00–18:00",
    status: "on_shift",
    lastPing: "12s ago",
  },
  {
    name: "Amit Patel",
    email: "apatel@demo-fleet.local",
    phone: "(905) 555-0199",
    truck: "T-08",
    shift: "Off duty",
    status: "off",
    lastPing: "—",
  },
  {
    name: "James Okonkwo",
    email: "jokonkwo@demo-fleet.local",
    phone: "(647) 555-0103",
    truck: "T-11",
    shift: "12:00–00:00",
    status: "on_shift",
    lastPing: "44s ago",
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CompanyDriversPage() {
  return (
    <>
      <div className="hidden border-b border-ink/8 bg-paper px-6 py-6 md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          People
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          Drivers
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Directory and telematics-style status (sample data). Cards use
          consistent padding for mobile and desktop.
        </p>
      </div>

      <div className="border-b border-ink/8 bg-paper px-4 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Drivers</h1>
      </div>

      <div className="grid gap-5 p-4 md:gap-6 md:p-6 lg:grid-cols-2 xl:grid-cols-3">
        {DRIVERS.map((d) => (
          <article
            key={d.email}
            className="flex flex-col rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm sm:p-7"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/90 to-deep text-sm font-bold text-paper shadow-sm"
                aria-hidden
              >
                {initials(d.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold leading-snug text-ink">
                  {d.name}
                </h2>
                <p className="mt-2 flex items-center gap-1.5 font-mono-brand text-xs text-muted">
                  <Truck className="size-3.5 shrink-0 text-sky" />
                  Default unit · {d.truck}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  d.status === "on_shift"
                    ? "bg-emerald-100 text-emerald-900"
                    : d.status === "break"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-ink/8 text-muted"
                }`}
              >
                {d.shift}
              </span>
              <span className="rounded-full bg-ice px-3 py-1 text-xs text-muted">
                Last ping · {d.lastPing}
              </span>
            </div>

            <div className="mt-6 space-y-0 border-t border-ink/10 pt-5">
              <a
                href={`mailto:${d.email}`}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-sm text-ink transition hover:bg-ice/80"
              >
                <Mail className="size-4 shrink-0 text-sky" />
                <span className="min-w-0 truncate">{d.email}</span>
              </a>
              <a
                href={`tel:${d.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-sm text-ink transition hover:bg-ice/80"
              >
                <Phone className="size-4 shrink-0 text-sky" />
                {d.phone}
              </a>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-5">
              <button
                type="button"
                className="rounded-lg border border-ink/12 bg-paper px-3 py-2 text-xs font-semibold text-ink hover:bg-ice"
              >
                View jobs
              </button>
              <button
                type="button"
                className="rounded-lg border border-ink/12 px-3 py-2 text-xs font-semibold text-muted hover:bg-ice hover:text-ink"
              >
                Message
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
