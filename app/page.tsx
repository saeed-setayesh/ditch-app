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
  Radio,
  Phone,
  Mail,
} from "lucide-react";

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

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ticker, setTicker] = useState(0);

  const tickerItems = [
    "Collision • Hwy 401 East @ Brock Rd · 2 min ago",
    "Multi-vehicle · DVP Northbound @ Eglinton · 4 min ago",
    "Road hazard · Gardiner Expressway @ Spadina · 7 min ago",
    "Collision · Hwy 400 @ King-Vaughan Rd · 11 min ago",
    "Vehicle fire · Hwy 407 @ Weston Rd · 14 min ago",
  ];

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => (t + 1) % tickerItems.length), 3500);
    return () => clearInterval(id);
  }, []);

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
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        background: "#0A0A0B",
        color: "#F0EDE8",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=Bebas+Neue&display=swap');

        * { box-sizing: border-box; }

        .display-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .amber-glow {
          background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(239,159,39,0.14) 0%, transparent 70%);
        }

        .red-glow-left {
          background: radial-gradient(circle at 0% 60%, rgba(226,75,74,0.08) 0%, transparent 60%);
        }

        .feature-card {
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: border-color 0.2s, background 0.2s;
          cursor: default;
        }

        .feature-card:hover {
          border-color: rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.05);
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 52px;
          padding: 0 32px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.18s;
          letter-spacing: 0.01em;
        }

        .cta-primary {
          background: #EF9F27;
          color: #0A0A0B;
        }
        .cta-primary:hover {
          background: #FAC775;
          transform: translateY(-1px);
        }

        .cta-secondary {
          background: transparent;
          color: #F0EDE8;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .cta-secondary:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.05);
        }

        .ticker-wrap {
          overflow: hidden;
          white-space: nowrap;
        }

        .step-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          line-height: 1;
          color: rgba(239,159,39,0.15);
          position: absolute;
          top: -12px;
          left: 0;
          pointer-events: none;
          user-select: none;
        }

        .divider-line {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
          height: 60px;
          margin: 0 auto;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(239,159,39,0.25);
          background: rgba(239,159,39,0.08);
          color: #FAC775;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #E24B4A;
          position: relative;
        }
        .live-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: rgba(226,75,74,0.3);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0; transform: scale(2); }
        }

        .nav-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #EF9F27, #D4537E);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #EF9F27;
        }

        .border-subtle {
          border-color: rgba(255,255,255,0.07);
        }

        .ticker-incident {
          animation: fadeSlide 0.4s ease;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .morvarid-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px 3px 4px;
          border-radius: 100px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 11px;
          color: rgba(240,237,232,0.4);
        }
      `}</style>

      {/* ── Fixed background layers ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
        <div className="amber-glow" style={{ position: "absolute", inset: 0 }} />
        <div className="red-glow-left" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* ── Incident ticker ── */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          background: "rgba(226,75,74,0.12)",
          borderBottom: "1px solid rgba(226,75,74,0.2)",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#E24B4A", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Live
          </span>
        </div>
        <div style={{ width: 1, height: 14, background: "rgba(226,75,74,0.3)" }} />
        <span
          key={ticker}
          className="ticker-incident"
          style={{ fontSize: 12, color: "rgba(240,237,232,0.6)", fontWeight: 400 }}
        >
          <span style={{ color: "#F0EDE8", fontWeight: 500 }}>Ontario: </span>
          {tickerItems[ticker]}
        </span>
      </div>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="nav-logo-icon">
            <Truck size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.06em", lineHeight: 1 }}>
              DitchApp
            </div>
            <div style={{ fontSize: 9, color: "rgba(240,237,232,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1, marginTop: 2 }}>
              by Morvarid Inc.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLoggedIn ? (
            <Link href="/dashboard" className="cta-btn cta-primary" style={{ height: 40, padding: "0 20px", fontSize: 14 }}>
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="cta-btn cta-secondary" style={{ height: 40, padding: "0 16px", fontSize: 14, display: "none", }}>
                Sign in
              </Link>
              <Link href="/register" className="cta-btn cta-primary" style={{ height: 40, padding: "0 20px", fontSize: 14 }}>
                Get started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 24px 80px",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: 780 }}>
          <div className="pill" style={{ marginBottom: 32 }}>
            <Radio size={11} />
            Real-time tracking across Ontario
          </div>

          <h1
            className="display-font"
            style={{
              fontSize: "clamp(72px, 13vw, 140px)",
              lineHeight: 0.92,
              marginBottom: 28,
              color: "#F0EDE8",
            }}
          >
            First on scene.
            <br />
            <span style={{ color: "#EF9F27" }}>Every call.</span>
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "rgba(240,237,232,0.55)",
              maxWidth: 520,
              marginBottom: 40,
              fontWeight: 300,
            }}
          >
            The real-time accident intelligence platform built for Ontario tow
            operators. Instant alerts, live camera feeds, tow score rankings —
            everything to get you there before the competition.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="cta-btn cta-primary">
                Open dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/register" className="cta-btn cta-primary">
                  Start free today <ArrowRight size={16} />
                </Link>
                <Link href="/login" className="cta-btn cta-secondary">
                  Sign in <ChevronRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* PWA install */}
          {!isStandalone && !installed && (deferredPrompt || isIOS) && (
            <div style={{ marginBottom: 32 }}>
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="cta-btn cta-secondary"
                  style={{ fontSize: 13, height: 42 }}
                >
                  <Download size={14} /> Install app to home screen
                </button>
              ) : isIOS ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(240,237,232,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Share size={13} /> Tap <strong style={{ color: "#F0EDE8" }}>Share</strong> then{" "}
                  <strong style={{ color: "#F0EDE8" }}>&quot;Add to Home Screen&quot;</strong>
                </p>
              ) : null}
            </div>
          )}
          {installed && (
            <p style={{ fontSize: 13, color: "#1D9E75", display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
              <Shield size={14} /> App installed — open it from your home screen.
            </p>
          )}

          {/* Trust pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
            {[
              { icon: <Shield size={13} />, label: "Free forever" },
              { icon: <Zap size={13} />, label: "Sub-second alerts" },
              { icon: <Truck size={13} />, label: "Built for drivers" },
              { icon: <MapPin size={13} />, label: "Ontario-wide coverage" },
            ].map((t) => (
              <span
                key={t.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "rgba(240,237,232,0.35)",
                  fontWeight: 400,
                }}
              >
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 100px",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: 52, maxWidth: 480 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Platform features</p>
          <h2
            className="display-font"
            style={{ fontSize: 48, lineHeight: 1, color: "#F0EDE8", marginBottom: 12 }}
          >
            One platform. Total edge.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(240,237,232,0.4)", lineHeight: 1.6, fontWeight: 300 }}>
            Everything a tow operator needs to work smarter and respond faster.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${f.color}18`,
                    border: `1px solid ${f.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={f.color} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F0EDE8", marginBottom: 8, letterSpacing: "-0.01em" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(240,237,232,0.45)", lineHeight: 1.65, fontWeight: 300 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "80px 24px",
            width: "100%",
          }}
        >
          <div style={{ marginBottom: 60, textAlign: "center" }}>
            <p className="section-label" style={{ marginBottom: 12 }}>How it works</p>
            <h2 className="display-font" style={{ fontSize: 48, lineHeight: 1, color: "#F0EDE8" }}>
              Up and running in 60 seconds.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} style={{ position: "relative", paddingTop: 16 }}>
                  <span className="step-number">{s.step}</span>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "rgba(239,159,39,0.1)",
                      border: "1px solid rgba(239,159,39,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Icon size={22} color="#EF9F27" strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F0EDE8", marginBottom: 10, letterSpacing: "-0.01em" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(240,237,232,0.45)", lineHeight: 1.65, fontWeight: 300 }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "100px 24px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2
            className="display-font"
            style={{ fontSize: "clamp(52px, 8vw, 80px)", lineHeight: 0.95, color: "#F0EDE8", marginBottom: 20 }}
          >
            Never miss
            <br />
            <span style={{ color: "#EF9F27" }}>a call again.</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(240,237,232,0.45)",
              marginBottom: 36,
              lineHeight: 1.65,
              fontWeight: 300,
            }}
          >
            Join tow operators across Ontario who rely on DitchApp every shift to
            find incidents faster and work smarter.
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard" className="cta-btn cta-primary">
              Open dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/register" className="cta-btn cta-primary">
              Create free account <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="nav-logo-icon">
                <Truck size={16} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.06em" }}>
                DitchApp
              </span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(240,237,232,0.3)", lineHeight: 1.6, maxWidth: 240 }}>
              Real-time accident intelligence for Ontario tow operators. Built to
              keep you first on scene, every time.
            </p>
            <div style={{ marginTop: 16 }}>
              <div className="morvarid-badge">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #EF9F27, #D4537E)",
                    flexShrink: 0,
                  }}
                />
                Owned &amp; operated by Morvarid Inc.
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.3)", marginBottom: 14 }}>
              Contact
            </p>
            <a
              href="mailto:Info@ditchapp.net"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "rgba(240,237,232,0.5)",
                textDecoration: "none",
                marginBottom: 8,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF9F27")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
            >
              <Mail size={13} /> Info@ditchapp.net
            </a>
          </div>

          {/* Legal links */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,232,0.3)", marginBottom: 14 }}>
              Legal
            </p>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "rgba(240,237,232,0.35)",
                  textDecoration: "none",
                  marginBottom: 8,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.35)")}
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div
          style={{
            maxWidth: 1100,
            margin: "32px auto 0",
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 11, color: "rgba(240,237,232,0.2)" }}>
            © {new Date().getFullYear()} Morvarid Inc. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: "rgba(240,237,232,0.2)" }}>
            PWA · Ontario, Canada · Built for tow operators
          </p>
        </div>
      </footer>
    </div>
  );
}