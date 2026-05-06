"use client";

import { useState, FormEvent, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl");
      if (cb) setCallbackUrl(cb);
    } catch {
      // ignore
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ice px-4 py-8 safe-area-inset">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-sky/30 bg-paper shadow-sm">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            DitchApp Accident Alert
          </h1>
          <p className="mt-1 font-mono-brand text-sm text-deep">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-ink/80"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-lg border border-ink/15 bg-paper px-4 text-base text-ink placeholder:text-muted focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink/80"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="h-12 w-full rounded-lg border border-ink/15 bg-paper px-4 text-base text-ink placeholder:text-muted focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-lg bg-sky font-semibold text-paper transition hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-deep hover:text-sky"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
