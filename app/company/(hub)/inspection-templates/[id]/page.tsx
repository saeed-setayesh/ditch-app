"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exampleOntarioStarterChecklist } from "@/lib/inspection/exampleOntarioChecklist";

type VersionRow = {
  id: string;
  version: number;
  createdAt: string;
  checklistSchema: unknown;
};

export default function InspectionTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("{}");
  const [savingVer, setSavingVer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void params.then((p) => {
      if (!cancelled) setTemplateId(p.id);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const load = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/inspection-templates/${templateId}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Not found");
      const json = (await res.json()) as {
        template: {
          name: string;
          versions: VersionRow[];
        };
      };
      setName(json.template.name);
      setVersions(json.template.versions);
      const latest = json.template.versions[0];
      setJsonText(JSON.stringify(latest?.checklistSchema ?? {}, null, 2));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publishNewVersion() {
    if (!templateId) return;
    setError(null);
    let checklistSchema: unknown;
    try {
      checklistSchema = JSON.parse(jsonText) as unknown;
    } catch {
      setError("Invalid JSON");
      return;
    }
    setSavingVer(true);
    try {
      const res = await fetch(
        `/api/org/inspection-templates/${templateId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklistSchema }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error ?? "Publish failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setSavingVer(false);
    }
  }

  if (!templateId || loading) {
    return (
      <div className="p-6 text-muted">{templateId ? "Loading…" : "…"}</div>
    );
  }

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <h1 className="font-display text-2xl font-extrabold text-ink">{name}</h1>
        <p className="mt-1 text-sm text-muted">
          New versions snapshot checklist JSON for audits; vehicles lock to the version used when an inspection starts.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">{name}</h1>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/company/inspection-templates")}
            className="text-sm font-semibold text-sky hover:underline"
          >
            ← All templates
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div>
          <h2 className="font-display text-lg font-bold text-ink">Versions</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {versions.map((v) => (
              <li key={v.id}>
                <span className="font-mono-brand font-semibold text-ink">
                  v{v.version}
                </span>{" "}
                · {new Date(v.createdAt).toLocaleString()} · id{" "}
                <code className="text-xs">{v.id.slice(0, 12)}…</code>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Publish new version
          </h2>
          <p className="mt-1 text-sm text-muted">
            Edit JSON below (must pass server validation). Existing finalized inspections keep their older schema snapshot.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setJsonText(JSON.stringify(exampleOntarioStarterChecklist, null, 2))
              }
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold text-ink hover:bg-ice"
            >
              Reset textarea to Ontario starter
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            className="mt-3 w-full max-w-4xl rounded-lg border border-ink/15 px-3 py-2 font-mono text-xs text-ink"
          />
          <button
            type="button"
            disabled={savingVer}
            onClick={() => void publishNewVersion()}
            className="mt-3 rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-paper hover:bg-deep disabled:opacity-50"
          >
            {savingVer ? "Publishing…" : "Publish new version"}
          </button>
        </div>

        <p className="text-xs text-muted">
          Assign versions to vehicles from{" "}
          <Link href="/company/fleet" className="font-semibold text-sky">
            Fleet
          </Link>
          .
        </p>
      </div>
    </>
  );
}
