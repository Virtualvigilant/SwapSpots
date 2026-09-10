"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Registers the service worker and renders a slide-up install prompt when the
 * browser fires the `beforeinstallprompt` event. On iOS (which does not fire
 * that event) it shows a manual "Add to Home Screen" nudge instead.
 */
export default function InstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // --- Register service worker ---
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }

    // --- Detect standalone mode (already installed) ---
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return; // already installed, nothing to show

    // --- iOS detection ---
    const ua = navigator.userAgent;
    const ios =
      /iP(hone|od|ad)/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // --- Listen for the install prompt ---
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Show after a short delay so the user has time to see the page first
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, show a manual instruction banner after 3 seconds
    if (ios) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
    }
    deferredPrompt.current = null;
  };

  const dismiss = () => {
    setShowBanner(false);
    // Remember dismissal for this session so we do not nag
    try {
      sessionStorage.setItem("pwa-dismissed", "1");
    } catch {
      /* noop */
    }
  };

  // Never show if already installed or previously dismissed this session
  if (isStandalone) return null;
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem("pwa-dismissed")) return null;
    } catch {
      /* noop */
    }
  }
  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 animate-slide-up"
      role="alert"
    >
      <div className="mx-auto max-w-md rounded-2xl bg-ink text-white shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-brand to-brand-400" />

        <div className="flex items-start gap-4 p-4 sm:p-5">
          {/* Icon */}
          <Image
            src="/icon-192.png"
            alt="SwapSpot"
            width={52}
            height={52}
            className="rounded-xl shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-base leading-tight">
              Install SwapSpot
            </p>

            {isIOS ? (
              <p className="text-sm text-white/70 mt-1 leading-snug">
                Tap{" "}
                <span className="inline-flex items-center gap-0.5">
                  <svg
                    className="w-4 h-4 inline-block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  Share
                </span>{" "}
                then <strong>&quot;Add to Home Screen&quot;</strong>
              </p>
            ) : (
              <p className="text-sm text-white/70 mt-1 leading-snug">
                Get the full app experience — faster loads, offline access, and
                home screen shortcuts.
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="bg-brand hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- TypeScript shim ----------
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
