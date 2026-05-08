"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLogoMark from "@/components/brand/AppLogoMark";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Name is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      router.push("/login?registered=1");
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
          <div className="mb-4 inline-flex h-16 w-16 overflow-hidden rounded-2xl border border-sky/30 bg-paper shadow-sm">
            <AppLogoMark size={64} className="h-full w-full" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mt-1 font-mono-brand text-sm text-deep">
            Join DitchApp Accident Alert
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-ink/80">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-12 w-full rounded-lg border border-ink/15 bg-paper px-4 text-base text-ink placeholder:text-muted focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-12 w-full rounded-lg border border-ink/15 bg-paper px-4 text-base text-ink placeholder:text-muted focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm"
              className="text-sm font-medium text-ink/80"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="h-12 w-full rounded-lg border border-ink/15 bg-paper px-4 text-base text-ink placeholder:text-muted focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-lg bg-sky font-semibold text-paper transition hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-deep hover:text-sky"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
