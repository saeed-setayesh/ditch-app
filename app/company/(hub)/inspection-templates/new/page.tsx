"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { exampleOntarioStarterChecklist } from "@/lib/inspection/exampleOntarioChecklist";

export default function NewInspectionTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("Fleet checklist");
  const [description, setDescription] = useState("");
  const [jsonText, setJsonText] = useState(
    JSON.stringify(exampleOntarioStarterChecklist, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    let checklistSchema: unknown;
    try {
      checklistSchema = JSON.parse(jsonText) as unknown;
    } catch {
      setError("Invalid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/org/inspection-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          checklistSchema,
        }),
      });
      const data = (await res.json()) as { template?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push(`/company/inspection-templates/${data.template!.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="hidden border-b border-ink/[0.08] bg-paper px-6 py-[18px] md:block">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          New inspection template
        </h1>
        <p className="mt-1 text-sm text-muted">
          Paste valid checklist schema JSON (version: 1). Use “Load Ontario starter” for demo layout only.
        </p>
      </div>

      <div className="border-b border-ink/[0.08] bg-paper px-3 py-4 md:hidden">
        <h1 className="font-display text-lg font-bold text-ink">New template</h1>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/company/inspection-templates"
          className="text-sm font-semibold text-sky hover:underline"
        >
          ← Back to templates
        </Link>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <label className="block text-sm">
          <span className="font-medium text-ink">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-ink/15 px-3 py-2 text-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full max-w-xl rounded-lg border border-ink/15 px-3 py-2 text-ink"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setJsonText(JSON.stringify(exampleOntarioStarterChecklist, null, 2))
            }
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold text-ink hover:bg-ice"
          >
            Load Ontario starter (example)
          </button>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-ink">checklistSchema JSON</span>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="mt-1 w-full max-w-4xl rounded-lg border border-ink/15 px-3 py-2 font-mono text-xs text-ink"
          />
        </label>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-paper hover:bg-deep disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create template"}
        </button>
      </div>
    </>
  );
}
