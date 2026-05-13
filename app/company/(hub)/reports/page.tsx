"use client";

const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6"];
const VOLUME = [42, 58, 49, 71, 63, 80];

export default function CompanyReportsPage() {
  const max = Math.max(...VOLUME);
  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Analytics
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sample charts for completed dispatches per week (placeholder data).
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Reports</h1>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Jobs completed", "186", "+12% vs last month"],
            ["Avg response", "11m", "−2m vs target"],
            ["Revenue (est.)", "$48.2k", "Stripe not synced"],
            ["CSAT", "4.7", "internal survey"],
          ].map(([label, value, sub]) => (
            <div
              key={label as string}
              className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm"
            >
              <div className="font-mono-brand text-[10px] font-bold uppercase tracking-wide text-muted">
                {label}
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-ink">
                {value}
              </div>
              <p className="text-xs text-muted">{sub}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">
            Completed jobs
          </h2>
          <p className="mt-1 text-sm text-muted">Last 6 rolling weeks</p>
          <div className="mt-8 flex h-48 items-end gap-2 sm:gap-4">
            {WEEKS.map((w, i) => {
              const v = VOLUME[i] ?? 0;
              const h = Math.round((v / max) * 100);
              return (
                <div
                  key={w}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="w-full max-w-[3.5rem] rounded-t-lg bg-gradient-to-t from-deep to-sky"
                    style={{ height: `${Math.max(h, 8)}%` }}
                    title={`${v} jobs`}
                  />
                  <span className="font-mono-brand text-[10px] font-semibold text-muted">
                    {w}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">
            Export
          </h2>
          <p className="mt-1 text-sm text-muted">
            CSV/PDF exports will plug in here when analytics APIs are wired.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper opacity-60"
              disabled
            >
              Download CSV
            </button>
            <button
              type="button"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink opacity-60"
              disabled
            >
              PDF summary
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
