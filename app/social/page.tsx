"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type PresenceRow = {
  userId: string;
  lat: number;
  lng: number;
  updatedAt: string;
  user: { id: string; name: string | null; email: string | null };
};

type PostRow = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
};

export default function SocialPage() {
  const { status } = useSession();
  const [peers, setPeers] = useState<PresenceRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [fence, setFence] = useState<unknown>(null);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (status !== "authenticated") return;
    const [pRes, postsRes, fRes] = await Promise.all([
      fetch("/api/realtime/presence"),
      fetch("/api/realtime/posts"),
      fetch("/api/org/fence"),
    ]);
    if (pRes.ok) {
      const d = await pRes.json();
      setPeers(d.peers ?? []);
    }
    if (postsRes.ok) {
      const d = await postsRes.json();
      setPosts(d.posts ?? []);
    }
    if (fRes.ok) {
      const d = await fRes.json();
      setFence(d.geoJson ?? null);
    }
  }, [status]);

  useEffect(() => {
    void reload();
    const t = setInterval(() => void reload(), 45_000);
    return () => clearInterval(t);
  }, [reload]);

  const send = async () => {
    setMsg(null);
    const body = draft.trim();
    if (body.length < 2) return;
    try {
      const res = await fetch("/api/realtime/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Post failed");
      setDraft("");
      setMsg(
        data.moderationState === "visible"
          ? "Posted (+5 pts reward)."
          : "Held for moderation (spam heuristic).",
      );
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Post failed");
    }
  };

  if (status === "loading") {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="space-y-2 p-8">
        <p className="font-semibold text-ink">Sign in required</p>
        <Link href="/login" className="text-sky underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Crowd feed & teammate spots
          </h1>
          <p className="mt-1 text-sm text-muted">
            Polled refresh (~45s); presence pings emit from the dashboard
            PresenceBeacon (~90s GPS sample).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-lg border border-ink/12 bg-ice px-3 py-2 text-sm font-semibold"
        >
          Dashboard
        </Link>
      </div>

      <section className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
        <h2 className="font-semibold text-ink">Fleet presence</h2>
        <p className="mt-1 text-xs text-muted">
          Seated teammates in your organization only.
        </p>
        {peers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No pings yet — enable GPS for this browser session on the dashboard
            and/or join an org via Fleet billing.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10 text-sm">
            {peers.map((p) => (
              <li key={p.userId} className="flex flex-wrap gap-2 py-2">
                <span className="font-medium text-ink">
                  {p.user.name ?? p.user.email ?? p.userId.slice(0, 8)}
                </span>
                <span className="font-mono text-xs text-deep">
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </span>
                <span className="text-xs text-muted">
                  {new Date(p.updatedAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
        <h2 className="font-semibold text-ink">Organization service polygon</h2>
        <p className="mt-1 text-xs text-muted">
          Admins upload via{" "}
          <code className="rounded bg-ice px-1">PUT /api/org/fence</code> with a
          GeoJSON FeatureCollection body.
        </p>
        <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-ink/5 p-2 text-[11px] text-ink">
          {fence ? JSON.stringify(fence, null, 2) : "— none —"}
        </pre>
      </section>

      <section className="rounded-xl border border-ink/10 bg-paper p-4 shadow-sm">
        <h2 className="font-semibold text-ink">Crowd timeline</h2>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Short field report (Incidenta-style)…"
          className="mt-3 w-full rounded-lg border border-ink/12 bg-paper p-3 text-sm"
        />
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        <button
          type="button"
          onClick={() => void send()}
          className="mt-2 rounded-lg bg-sky px-4 py-2 text-sm font-semibold text-paper"
        >
          Post
        </button>
        <ul className="mt-6 space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-lg border border-ink/8 bg-ice/30 p-3 text-sm"
            >
              <p className="whitespace-pre-wrap text-ink">{post.body}</p>
              <p className="mt-1 text-xs text-muted">
                {post.user.name ?? post.user.email} ·{" "}
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
