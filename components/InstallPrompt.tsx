"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "traficapp_install_prompt_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream,
    );
    setIsStandalone(
      typeof window !== "undefined" &&
        window.matchMedia("(display-mode: standalone)").matches,
    );
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setShowBanner(false);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") return;
      } catch {
        // ignore
      }
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isIOS || isStandalone) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore
    }
    setShowBanner(true);
  }, [isIOS, isStandalone]);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") handleDismiss();
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;
  if (!showBanner) return null;

  return (
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-48 mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] max-w-lg sm:mx-auto">
      <div className="relative rounded-2xl border border-white/25 bg-paper/75 p-4 pr-12 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-2 text-muted transition hover:bg-ink/10 hover:text-ink"
          aria-label="Dismiss install prompt"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
        <p className="mb-3 text-sm leading-relaxed text-ink">
          Install this app for quick access and push alerts.
        </p>
        {deferredPrompt ? (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-deep"
          >
            Add to Home Screen
          </button>
        ) : isIOS ? (
          <p className="text-xs leading-relaxed text-muted">
            Tap the share button and then &quot;Add to Home Screen&quot; to
            install.
          </p>
        ) : null}
      </div>
    </div>
  );
}
