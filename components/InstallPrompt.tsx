"use client";

import { useState, useEffect } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
    );
    setIsStandalone(
      typeof window !== "undefined" &&
        window.matchMedia("(display-mode: standalone)").matches
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;
  if (!showBanner && !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 mx-4 mb-4 p-3 rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-lg backdrop-blur transition-all duration-200">
      <p className="text-sm text-zinc-300 mb-2">
        Install this app for quick access and push alerts.
      </p>
      {deferredPrompt ? (
        <button
          type="button"
          onClick={handleInstall}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors"
        >
          Add to Home Screen
        </button>
      ) : isIOS ? (
        <p className="text-xs text-zinc-500">
          Tap the share button and then &quot;Add to Home Screen&quot; to install.
        </p>
      ) : null}
    </div>
  );
}
