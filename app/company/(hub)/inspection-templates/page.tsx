"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type TemplateListRow = {
  id: string;
  name: string;
  description: string | null;
  versions: { id: string; version: number; createdAt: string }[];
};

export default function InspectionTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/inspection-templates");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      const json = (await res.json()) as { templates: TemplateListRow[] };
      setTemplates(json.templates);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <div className="font-mono-brand text-[11px] font-bold uppercase tracking-wide text-muted">
          Compliance
        </div>
        <h1 className="mt-0.5 font-display text-2xl font-extrabold text-ink">
          Inspection templates
        </h1>
        <p className="mt-1 text-sm text-muted">
          Versioned checklist JSON (v1). Customize items with your compliance advisor — starter content is not certified.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">Templates</h1>
      </div>

      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <Link
          href="/company/inspection-templates/new"
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-paper shadow-sm hover:bg-deep"
        >
          <Plus className="size-4" />
          New template
        </Link>

        <div className="space-y-3">
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-muted">
              No templates yet. Create one, then assign a version on each fleet vehicle (or rely on the latest published version).
            </p>
          ) : (
            templates.map((t) => (
              <Link
                key={t.id}
                href={`/company/inspection-templates/${t.id}`}
                className="block rounded-xl border border-ink/10 bg-paper p-4 shadow-sm transition hover:border-sky/40"
              >
                <div className="font-display text-lg font-bold text-ink">{t.name}</div>
                {t.description && (
                  <p className="mt-1 text-sm text-muted">{t.description}</p>
                )}
                <p className="mt-2 font-mono-brand text-xs text-muted">
                  {t.versions.length} version(s) recorded · latest v
                  {t.versions[0]?.version ?? "—"}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
