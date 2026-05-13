"use client";

import { Clock, MapPin } from "lucide-react";

const JOBS = [
  {
    id: "JOB-2041",
    title: "MVA · 401 West collectors",
    assignee: "T-04",
    priority: "high",
    eta: "7 min",
  },
  {
    id: "JOB-2042",
    title: "Breakdown · QEW Fort Erie",
    assignee: "—",
    priority: "med",
    eta: "Unassigned",
  },
  {
    id: "JOB-2040",
    title: "Winch · Private lot Mississauga",
    assignee: "T-11",
    priority: "low",
    eta: "Done 14:02",
  },
];

export default function CompanyJobsPage() {
  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Operations
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Jobs
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tow tickets and dispatch assignments (sample data).
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Jobs</h1>
      </div>

      <div className="space-y-3 p-4 md:space-y-4 md:p-6">
        {JOBS.map((job) => (
          <article
            key={job.id}
            className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm sm:flex sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-brand text-xs font-bold text-muted">
                  {job.id}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    job.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : job.priority === "med"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-ice text-muted"
                  }`}
                >
                  {job.priority}
                </span>
              </div>
              <h2 className="mt-2 font-display text-base font-bold text-ink">
                {job.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  GTA · platform
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5 shrink-0" />
                  {job.eta}
                </span>
              </div>
            </div>
            <div className="mt-3 shrink-0 sm:mt-0 sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                Assigned
              </div>
              <div className="font-mono-brand text-lg font-bold text-deep">
                {job.assignee}
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-ice"
              >
                Open
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
