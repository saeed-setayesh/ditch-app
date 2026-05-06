"use client";

import { useState, useEffect, useSyncExternalStore, type ComponentProps } from "react";
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
  Radio,
  Mail,
} from "lucide-react";

const TICKER_ITEMS = [
  "Collision • Hwy 401 East @ Brock Rd · 2 min ago",
  "Multi-vehicle • DVP Northbound @ Eglinton · 4 min ago",
  "Road hazard • Gardiner Expressway @ Spadina · 7 min ago",
  "Collision • Hwy 400 @ King-Vaughan Rd · 11 min ago",
  "Vehicle fire • Hwy 407 @ Weston Rd · 14 min ago",
] as const;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const FEATURES = [
  {
    icon: MapPin,
    title: "Live Accident Map",
    desc: "Real-time incidents from TomTom and Ontario 511 plotted on an interactive map. See what's happening right now.",
    color: "#E24B4A",
    accent: "#FCEBEB",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    desc: "Instant alerts the moment an accident is logged near you. Every second counts — we don't waste yours.",
    color: "#EF9F27",
    accent: "#FAEEDA",
  },
  {
    icon: Camera,
    title: "Traffic Cameras",
    desc: "View live Ontario 511 camera feeds before you roll. Verify the scene, size up the job.",
    color: "#378ADD",
    accent: "#E6F1FB",
  },
  {
    icon: BarChart3,
    title: "Tow Score Ranking",
    desc: "Every call scored by value. No guessing — just data telling you which job to take.",
    color: "#1D9E75",
    accent: "#E1F5EE",
  },
  {
    icon: Flame,
    title: "Heatmaps & Hotspots",
    desc: "Pinpoint where crashes cluster by hour and day. Position yourself where the money is.",
    color: "#D4537E",
    accent: "#FBEAF0",
  },
  {
    icon: Smartphone,
    title: "Install as Native App",
    desc: "Add to home screen. Instant access, offline support, feels completely native.",
    color: "#7F77DD",
    accent: "#EEEDFE",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your free account",
    desc: "Sign up in under 60 seconds. No credit card, no commitments.",
  },
  {
    icon: Zap,
    step: "02",
    title: "Enable alerts & location",
    desc: "Grant location access and turn on push notifications. That's it.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Beat everyone to the call",
    desc: "Get there first, every time. While others are still checking the radio.",
  },
];

function CtaPrimary({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { className?: string }) {
  return (
    <Link
      className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-sky px-8 text-[15px] font-bold text-paper shadow-[0_4px_14px_rgba(63,167,230,0.35)] transition hover:bg-deep active:translate-y-px ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

function CtaSecondary({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { className?: string }) {
  return (
    <Link
      className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] border border-ink/15 bg-paper/80 px-8 text-[15px] font-bold text-ink backdrop-blur transition hover:border-deep/40 hover:bg-ice ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

function subscribeDisplayStandalone(onStoreChange: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getDisplayStandaloneSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(
    subscribeDisplayStandalone,
    getDisplayStandaloneSnapshot,
    () => false,
  );
  const [isIOS] = useState(
    () =>
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent),
  );
  const [installed, setInstalled] = useState(false);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setTicker((t) => (t + 1) % TICKER_ITEMS.length),
      3500,
    );
    return () => clearInterval(id);
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ice text-ink">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63, 167, 230, 0.12), transparent 60%),
            radial-gradient(ellipse 50% 40% at 0% 50%, rgba(31, 111, 178, 0.06), transparent 55%)
          `,
        }}
      />

      <div className="relative z-20 flex items-center gap-3 border-b border-sky/25 bg-sky/10 px-5 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="relative size-2 rounded-full bg-sky"
            style={{
              boxShadow: "0 0 0 0 rgba(63,167,230,0.5)",
              animation: "da-pulse 1.6s ease-out infinite",
            }}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-deep">
            Live
          </span>
        </div>
        <div className="h-3.5 w-px bg-deep/20" />
        <span key={ticker} className="ticker-incident text-xs text-muted">
          <span className="font-medium text-ink">Ontario: </span>
          {TICKER_ITEMS[ticker]}
        </span>
      </div>

      <nav className="relative z-20 mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky to-deep shadow-sm">
            <Truck className="size-[18px] text-paper" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-[22px] font-bold leading-none tracking-tight text-ink">
              DitchApp
            </div>
            <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
              by Morvarid Inc.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-sky px-5 text-sm font-bold text-paper shadow-md hover:bg-deep"
            >
              Dashboard <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-sky px-5 text-sm font-bold text-paper hover:bg-deep"
              >
                Get started <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-20 pt-14">
        <div className="max-w-[780px]">
          <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-sky/30 bg-paper/90 px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.04em] text-deep shadow-sm backdrop-blur">
            <Radio className="size-3" />
            Real-time tracking across Ontario
          </div>

          <h1 className="font-display text-[clamp(2.75rem,11vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-ink">
            First on scene.
            <br />
            <span className="text-sky">Every call.</span>
          </h1>

          <p className="mt-7 max-w-[520px] text-lg font-normal leading-relaxed text-muted">
            The real-time accident intelligence platform built for Ontario tow
            operators. Instant alerts, live camera feeds, tow score rankings —
            everything to get you there before the competition.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <CtaPrimary href="/dashboard">
                Open dashboard <ArrowRight className="size-4" />
              </CtaPrimary>
            ) : (
              <>
                <CtaPrimary href="/register">
                  Start free today <ArrowRight className="size-4" />
                </CtaPrimary>
                <CtaSecondary href="/login">
                  Sign in <ChevronRight className="size-4" />
                </CtaSecondary>
              </>
            )}
          </div>

          {!isStandalone && !installed && (deferredPrompt || isIOS) && (
            <div className="mt-8">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-ink/15 bg-paper px-4 text-[13px] font-semibold text-ink hover:bg-ice"
                >
                  <Download className="size-3.5" /> Install app to home screen
                </button>
              ) : isIOS ? (
                <p className="inline-flex max-w-md items-center gap-2 rounded-[10px] border border-ink/10 bg-paper/90 px-4 py-2.5 text-xs text-muted backdrop-blur">
                  <Share className="size-3.5 shrink-0 text-deep" /> Tap{" "}
                  <strong className="text-ink">Share</strong> then{" "}
                  <strong className="text-ink">&quot;Add to Home Screen&quot;</strong>
                </p>
              ) : null}
            </div>
          )}
          {installed && (
            <p className="mt-6 flex items-center gap-2 text-[13px] font-medium text-deep">
              <Shield className="size-3.5" /> App installed — open it from your
              home screen.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-5">
            {[
              { icon: <Shield className="size-3.5" />, label: "Free forever" },
              { icon: <Zap className="size-3.5" />, label: "Sub-second alerts" },
              {
                icon: <Truck className="size-3.5" />,
                label: "Built for drivers",
              },
              {
                icon: <MapPin className="size-3.5" />,
                label: "Ontario-wide coverage",
              },
            ].map((t) => (
              <span
                key={t.label}
                className="flex items-center gap-1.5 text-xs text-muted"
              >
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-24">
        <div className="mb-12 max-w-[480px]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-deep">
            Platform features
          </p>
          <h2 className="font-display text-5xl font-bold leading-none text-ink">
            One platform. Total edge.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Everything a tow operator needs to work smarter and respond faster.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex cursor-default flex-col gap-[18px] rounded-2xl border border-ink/[0.08] bg-paper/70 p-7 shadow-sm backdrop-blur transition hover:border-sky/25 hover:shadow-md"
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${f.color}14`,
                    borderColor: `${f.color}30`,
                  }}
                >
                  <Icon
                    size={20}
                    color={f.color}
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-[15px] font-bold tracking-tight text-ink">
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-muted">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 border-y border-ink/[0.08] bg-paper/50">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-20">
          <div className="mb-16 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-deep">
              How it works
            </p>
            <h2 className="font-display text-5xl font-bold text-ink">
              Up and running in 60 seconds.
            </h2>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative pt-4">
                  <span className="pointer-events-none absolute -top-1 left-0 select-none font-display text-[64px] font-bold leading-none text-sky/20">
                    {s.step}
                  </span>
                  <div className="relative z-[1] mb-5 flex size-[52px] items-center justify-center rounded-[14px] border border-sky/25 bg-sky/10">
                    <Icon className="size-[22px] text-deep" strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-2.5 text-lg font-bold tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1100px] px-6 py-24 text-center">
        <div className="mx-auto max-w-[560px]">
          <h2 className="font-display text-[clamp(3rem,8vw,5rem)] font-bold leading-[0.95] text-ink">
            Never miss
            <br />
            <span className="text-sky">a call again.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Join tow operators across Ontario who rely on DitchApp every shift
            to find incidents faster and work smarter.
          </p>
          {isLoggedIn ? (
            <div className="mt-9 flex justify-center">
              <CtaPrimary href="/dashboard">
                Open dashboard <ArrowRight className="size-4" />
              </CtaPrimary>
            </div>
          ) : (
            <div className="mt-9 flex justify-center">
              <CtaPrimary href="/register">
                Create free account <ArrowRight className="size-4" />
              </CtaPrimary>
            </div>
          )}
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink/[0.08] px-6 py-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-start justify-between gap-8">
          <div>
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky to-deep">
                <Truck className="size-4 text-paper" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">
                DitchApp
              </span>
            </div>
            <p className="max-w-[240px] text-xs leading-relaxed text-muted">
              Real-time accident intelligence for Ontario tow operators. Built to
              keep you first on scene, every time.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper/80 py-1 pl-1 pr-3 text-[11px] text-muted">
              <div className="size-4 shrink-0 rounded bg-gradient-to-br from-sky to-deep" />
              Owned &amp; operated by Morvarid Inc.
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              Contact
            </p>
            <a
              href="mailto:Info@ditchapp.net"
              className="flex items-center gap-2 text-[13px] text-muted transition hover:text-deep"
            >
              <Mail className="size-3.5" /> Info@ditchapp.net
            </a>
          </div>

          <div>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              Legal
            </p>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="mb-2 block text-[13px] text-muted/80 transition hover:text-ink"
                >
                  {item}
                </a>
              ),
            )}
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-[1100px] flex-wrap items-center justify-between gap-2.5 border-t border-ink/[0.06] pt-5">
          <p className="text-[11px] text-muted/70">
            © {new Date().getFullYear()} Morvarid Inc. All rights reserved.
          </p>
          <p className="text-[11px] text-muted/70">
            PWA · Ontario, Canada · Built for tow operators
          </p>
        </div>
      </footer>
    </div>
  );
}
