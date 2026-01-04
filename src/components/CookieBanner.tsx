"use client";

import { useEffect, useState } from "react";

type ConsentStatus = "accepted" | "declined" | "custom";

const CONSENT_KEY = "mooody-cookie-consent";
const ANALYTICS_KEY = "mooody-cookie-analytics";

const dispatchConsentEvent = (analytics: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("cookie-consent", {
      detail: { analytics },
    })
  );
};

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    const storedAnalytics = localStorage.getItem(ANALYTICS_KEY) === "true";
    setAnalyticsEnabled(storedAnalytics);
    if (!storedConsent) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (status: ConsentStatus, analytics: boolean) => {
    localStorage.setItem(CONSENT_KEY, status);
    localStorage.setItem(ANALYTICS_KEY, analytics ? "true" : "false");
    setAnalyticsEnabled(analytics);
    setIsVisible(false);
    setShowPreferences(false);
    dispatchConsentEvent(analytics);
  };

  if (!isVisible && !showPreferences) {
    return null;
  }

  return (
    <>
      {isVisible && (
        <div className="fixed inset-x-4 bottom-4 z-50">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-border bg-white/95 p-4 text-foreground shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="space-y-2 text-xs text-muted sm:max-w-md sm:text-sm">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                We respect your privacy.
              </p>
              <p>
                We use essential cookies to keep The Mooody secure. With your
                permission, we also use analytics to improve the experience.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <a className="underline underline-offset-4" href="/privacy">
                  Privacy
                </a>
                <a className="underline underline-offset-4" href="/cookies">
                  Cookies
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => saveConsent("declined", false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-slate-300 hover:text-foreground"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:border-slate-300"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={() => saveConsent("accepted", true)}
                className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 text-foreground shadow-[0_40px_120px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                  Cookie Preferences
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Control your experience
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Essential cookies are required. Analytics are optional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-slate-300 hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Essential</p>
                  <p className="text-xs text-muted">Required for security.</p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                  Always On
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Analytics</p>
                  <p className="text-xs text-muted">
                    Help us improve The Mooody.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsEnabled((prev) => !prev)}
                  aria-pressed={analyticsEnabled}
                  className={`flex h-8 w-14 items-center rounded-full border transition ${
                    analyticsEnabled
                      ? "border-[color:var(--orange)]/35 bg-[color:var(--periwinkle)]"
                      : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-foreground transition ${
                      analyticsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => saveConsent("declined", false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-slate-300 hover:text-foreground"
              >
                Decline All
              </button>
              <button
                type="button"
                onClick={() => saveConsent("custom", analyticsEnabled)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:border-slate-300"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => saveConsent("accepted", true)}
                className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
