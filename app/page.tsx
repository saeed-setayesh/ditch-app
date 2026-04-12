"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MapPin,
  Bell,
  Camera,
  BarChart3,
  Flame,
  Smartphone,
  ArrowRight,
  ChevronRight,
  UserPlus,
  Zap,
  Truck,
  Shield,
  Download,
  Share,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const FEATURES = [
  {
    icon: MapPin,
    title: "Live accident map",
    desc: "Real-time incidents from TomTom and Ontario 511 plotted on an interactive map.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    glow: "group-hover:shadow-rose-500/10",
  },
  {
    icon: Bell,
    title: "Push notifications",
    desc: "Get instant alerts when accidents happen near your location. Never miss a call.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
  },
  {
    icon: Camera,
    title: "Traffic cameras",
    desc: "View nearby Ontario 511 traffic cameras to verify incidents before you drive.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "group-hover:shadow-sky-500/10",
  },
  {
    icon: BarChart3,
    title: "Tow score ranking",
    desc: "Every incident is scored so you can prioritize the highest-value calls first.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: Flame,
    title: "Heatmaps & insights",
    desc: "Discover accident hotspots and peak hours to position yourself strategically.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "group-hover:shadow-orange-500/10",
  },
  {
    icon: Smartphone,
    title: "Install as app",
    desc: "Add to your home screen for instant access. Works offline and feels native.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "group-hover:shadow-violet-500/10",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    step: "1",
    title: "Sign up",
    desc: "Create a free account in seconds. No credit card required.",
  },
  {
    icon: Zap,
    step: "2",
    title: "Enable alerts",
    desc: "Turn on push notifications and share your location for nearby incidents.",
  },
  {
    icon: Truck,
    step: "3",
    title: "Get there first",
    desc: "Receive instant alerts, view cameras, and beat the competition.",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIsStandalone(
      typeof window !== "undefined" &&
        window.matchMedia("(display-mode: standalone)").matches,
    );
    setIsIOS(
      typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent),
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* ─── Animated background grid ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Top amber glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Side accent glows */}
        <div
          className="absolute top-1/3 -left-32 w-[500px] h-[500px]"
          style={{
            background:
              "radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 -right-32 w-[500px] h-[500px]"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ─── Floating nav bar ──────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base tracking-tight">
            Accident Alert
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20"
              >
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-12 pb-20 sm:pt-20 sm:pb-32">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            Live tracking active across Ontario
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Arrive first.{" "}
            <span className="bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Every time.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 max-w-xl leading-relaxed">
            The real-time accident tracker built for tow truck drivers. Get
            instant push alerts, view live cameras, and beat the competition to
            every call.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-zinc-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                Open dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-zinc-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-zinc-900 text-zinc-200 font-semibold text-base border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                >
                  Sign in
                  <ChevronRight className="w-4 h-4 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          {/* Install button */}
          {!isStandalone && !installed && (deferredPrompt || isIOS) && (
            <div className="mt-2 w-full sm:w-auto">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-zinc-900/80 text-zinc-300 text-sm font-medium border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Install app
                </button>
              ) : isIOS ? (
                <p className="text-xs text-zinc-500 bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 inline-flex items-center gap-2">
                  <Share className="w-3.5 h-3.5 shrink-0" />
                  Tap <strong className="text-zinc-300">Share</strong> then{" "}
                  <strong className="text-zinc-300">
                    &quot;Add to Home Screen&quot;
                  </strong>
                </p>
              ) : null}
            </div>
          )}
          {installed && (
            <p className="text-sm text-emerald-400 mt-2 inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              App installed! Open it from your home screen.
            </p>
          )}

          {/* Trust signal */}
          <div className="flex items-center gap-3 mt-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Free forever
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Instant alerts
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Built for drivers
            </span>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 sm:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-400/80 uppercase mb-3">
              Everything you need
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              One app. Total advantage.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-6 flex flex-col gap-4 hover:border-zinc-700/80 transition-all duration-300 hover:shadow-xl ${f.glow}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${f.bg} ${f.border} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 sm:pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-400/80 uppercase mb-3">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative flex flex-col items-center text-center gap-4"
                >
                  {/* Connector line (hidden on mobile & last item) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-linear-to-r from-zinc-700 to-zinc-800" />
                  )}
                  <div className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-amber-400" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center shadow-md">
                      {s.step}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100 text-sm mb-1">
                      {s.title}
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-[220px] mx-auto">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ───────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-16 sm:pb-24">
        <div className="max-w-xl mx-auto text-center relative">
          {/* Glow behind card */}
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(245,158,11,0.2) 0%, transparent 70%)",
            }}
          />
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8 sm:p-10">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
              Ready to never miss a call?
            </h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
              Join tow drivers across DitchApp who rely on Accident Alert to
              stay ahead every single day.
            </p>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-zinc-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                Open dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-zinc-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                Create free account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span>Accident Alert</span>
          </div>
          <p>Built for tow drivers in Ontario &middot; PWA</p>
        </div>
      </footer>
    </div>
  );
}
