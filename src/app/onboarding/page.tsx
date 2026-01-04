"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { completeOnboarding } from "@/app/actions/onboarding";

type OnboardingStep =
  | "studio"
  | "team"
  | "intent"
  | "styles"
  | "loader"
  | "trial"
  | "final";

const STORAGE_KEY = "moody-onboarding";
const PERSISTED_STEPS: OnboardingStep[] = [
  "studio",
  "team",
  "intent",
  "styles",
  "trial",
];
const DEBUG_ONBOARDING = process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === "true";

const logOnboarding = (...args: unknown[]) => {
  if (DEBUG_ONBOARDING && typeof window !== "undefined") {
    console.info("[onboarding]", ...args);
  }
};

const intentOptions = [
  {
    id: "moodboard",
    title: "Moodboard",
    subtitle: "Infinite Canvas",
    description: "Assemble references and explore ideas freely.",
  },
  {
    id: "brand",
    title: "Brand Identity",
    subtitle: "Asset Library",
    description: "Generate logos, palettes, and brand systems.",
  },
  {
    id: "concept",
    title: "Concept Art",
    subtitle: "AI Generator",
    description: "Produce illustration and environment designs.",
  },
  {
    id: "pitch",
    title: "Client Pitch",
    subtitle: "Presentation Mode",
    description: "Build decks with AI-generated visuals.",
  },
];

const styleOptions = [
  { id: "Cyberpunk", classes: "from-[#0f172a] via-[#111827] to-[#38bdf8]" },
  { id: "Bauhaus", classes: "from-[#f97316] via-[#facc15] to-[#111827]" },
  { id: "Vogue Editorial", classes: "from-[#111827] via-[#6b7280] to-[#f9fafb]" },
  { id: "Brutalist", classes: "from-[#09090b] via-[#3f3f46] to-[#e5e7eb]" },
  { id: "Memphis", classes: "from-[#f43f5e] via-[#a855f7] to-[#38bdf8]" },
  { id: "Art Deco", classes: "from-[#1f2937] via-[#eab308] to-[#fef3c7]" },
  { id: "Wes Anderson", classes: "from-[#fb7185] via-[#f59e0b] to-[#fde68a]" },
  { id: "Film Noir", classes: "from-[#0f172a] via-[#4b5563] to-[#e5e7eb]" },
  { id: "Scandinavian Minimal", classes: "from-[#e5e7eb] via-[#cbd5f5] to-[#f8fafc]" },
];

const suggestionWords = [
  "Atlas",
  "Ember",
  "Juniper",
  "Citrine",
  "Solstice",
  "Evergreen",
  "Bloom",
];

export default function OnboardingPage() {
  const { user } = useUser();
  const [step, setStep] = useState<OnboardingStep>("studio");
  const [hydrated, setHydrated] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [studioTouched, setStudioTouched] = useState(false);
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [showStyleFeedback, setShowStyleFeedback] = useState(false);
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [trialChoice, setTrialChoice] = useState<"trial" | "free" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const [finalTimeoutReached, setFinalTimeoutReached] = useState(false);
  const lastPersistedStepRef = useRef<OnboardingStep>("studio");
  const lastLoggedStepRef = useRef<OnboardingStep>("studio");

  const randomWord = useMemo(() => {
    if (!hydrated) {
      return suggestionWords[0];
    }
    const index = Math.floor(Math.random() * suggestionWords.length);
    return suggestionWords[index];
  }, [hydrated]);

  const defaultStudioName = useMemo(() => {
    if (user?.firstName) {
      return `${user.firstName}'s Studio`;
    }
    return "My Studio";
  }, [user?.firstName]);

  const suggestions = useMemo(
    () => [
      defaultStudioName,
      "Creative Lab",
      `Studio ${randomWord}`,
    ],
    [defaultStudioName, randomWord],
  );

  const loaderPhrases = useMemo(() => {
    const styleLabel = styles[0] || "Signature";
    const workspaceLabel = studioName || defaultStudioName || "Studio";
    return [
      `Loading ${styleLabel} LoRA...`,
      `Configuring ${workspaceLabel} workspace...`,
      "Preparing your infinite canvas...",
      "Analyzing aesthetic preferences...",
    ];
  }, [styles, studioName, defaultStudioName]);

  const resetOnboardingState = () => {
    setStep("studio");
    setStudioName("");
    setStudioTouched(false);
    setTeamEmails([]);
    setEmailInput("");
    setIntent(null);
    setStyles([]);
    setTrialChoice(null);
    setSubmitError(null);
    lastPersistedStepRef.current = "studio";
    lastLoggedStepRef.current = "studio";
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    logOnboarding("storage", { action: stored ? "found" : "empty" });
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          step?: OnboardingStep;
          studioName?: string;
          teamEmails?: string[];
          intent?: string;
          styles?: string[];
          trialChoice?: "trial" | "free";
          userId?: string | null;
        };
        if (parsed.userId && user?.id && parsed.userId !== user.id) {
          logOnboarding("storage", { action: "user-mismatch" });
          sessionStorage.removeItem(STORAGE_KEY);
          resetOnboardingState();
        } else {
          if (parsed.step) {
            const safeStep =
              parsed.step === "final" || parsed.step === "loader"
                ? "trial"
                : parsed.step;
            setStep(safeStep);
            lastPersistedStepRef.current = safeStep;
            lastLoggedStepRef.current = safeStep;
            logOnboarding("storage", {
              action: "restore",
              storedStep: parsed.step,
              appliedStep: safeStep,
            });
          }
          if (parsed.studioName) {
            setStudioName(parsed.studioName);
          }
          if (parsed.teamEmails) {
            setTeamEmails(parsed.teamEmails);
          }
          if (parsed.intent) {
            setIntent(parsed.intent);
          }
          if (parsed.styles) {
            setStyles(parsed.styles);
          }
          if (parsed.trialChoice) {
            setTrialChoice(parsed.trialChoice);
          }
        }
      } catch {
        logOnboarding("storage", { action: "parse-failed" });
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
    logOnboarding("hydrated");
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!studioTouched && !studioName) {
      setStudioName(defaultStudioName);
    }
  }, [hydrated, studioTouched, studioName, defaultStudioName]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (PERSISTED_STEPS.includes(step)) {
      lastPersistedStepRef.current = step;
    }
    if (DEBUG_ONBOARDING && lastLoggedStepRef.current !== step) {
      logOnboarding("step-change", {
        from: lastLoggedStepRef.current,
        to: step,
      });
      lastLoggedStepRef.current = step;
    }
    const payload = {
      step: lastPersistedStepRef.current,
      studioName,
      teamEmails,
      intent,
      styles,
      trialChoice,
      userId: user?.id ?? null,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hydrated, step, studioName, teamEmails, intent, styles, trialChoice]);

  useEffect(() => {
    if (styles.length === 3) {
      const timer = window.setTimeout(() => setShowStyleFeedback(true), 500);
      return () => window.clearTimeout(timer);
    }
    setShowStyleFeedback(false);
    return undefined;
  }, [styles]);

  useEffect(() => {
    if (step !== "loader") {
      return;
    }
    setLoaderIndex(0);
    setLoaderProgress(0);
    const minDuration = 4000;
    const start = Date.now();
    const textTimer = window.setInterval(() => {
      setLoaderIndex((prev) => (prev + 1) % loaderPhrases.length);
    }, 2000);
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setLoaderProgress(Math.min(100, (elapsed / minDuration) * 100));
    }, 100);
    const endTimer = window.setTimeout(() => {
      setStep("trial");
    }, minDuration);
    return () => {
      window.clearInterval(textTimer);
      window.clearInterval(progressTimer);
      window.clearTimeout(endTimer);
    };
  }, [step, loaderPhrases.length]);

  useEffect(() => {
    if (step !== "final") {
      setFinalTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setFinalTimeoutReached(true);
      logOnboarding("final-timeout");
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [step]);

  const handleStudioContinue = () => {
    if (studioName.trim().length < 2) {
      return;
    }
    setStep("team");
  };

  const handleStudioSkip = () => {
    setStudioName(defaultStudioName);
    setStep("team");
  };

  const handleAddEmail = () => {
    const next = emailInput.trim();
    if (!next || !next.includes("@")) {
      return;
    }
    if (teamEmails.includes(next)) {
      setEmailInput("");
      return;
    }
    setTeamEmails((prev) => [...prev, next]);
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    setTeamEmails((prev) => prev.filter((item) => item !== email));
  };

  const handleIntentSelect = (id: string) => {
    setIntent(id);
    setStep("styles");
  };

  const toggleStyle = (id: string) => {
    setStyles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinueFromStyles = () => {
    if (styles.length !== 3) {
      return;
    }
    setStep("loader");
  };

  const finalizeOnboarding = (choice: "trial" | "free") => {
    if (isSubmitting) {
      return;
    }
    setTrialChoice(choice);
    setStep("final");
    setSubmitError(null);
    logOnboarding("submit", {
      choice,
      intent,
      stylesCount: styles.length,
      teamCount: teamEmails.length,
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    const formData = new FormData();
    formData.set("studio_name", studioName.trim() || defaultStudioName);
    formData.set("intent", intent ?? "");
    formData.set("styles", JSON.stringify(styles));
    formData.set("team_invites", JSON.stringify(teamEmails));
    formData.set("trial_choice", choice);
    startTransition(async () => {
      try {
        const result = await completeOnboarding(formData);
        if (result?.message) {
          logOnboarding("submit-error", { message: result.message });
          setSubmitError(result.message);
          setStep("trial");
          return;
        }
        if (result?.success) {
          logOnboarding("submit-success");
          window.location.assign("/dashboard");
        }
      } catch (error) {
        console.error("Failed to complete onboarding", error);
        logOnboarding("submit-error", { message: "unexpected" });
        setSubmitError("Failed to complete onboarding. Please try again.");
        setStep("trial");
      }
    });
  };

  return (
    <div className="min-h-[100svh] bg-[#F7F4EF] text-[#1A1A1A]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-[#E89968]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-80 w-80 rounded-full bg-[#fde68a]/40 blur-3xl" />

        {step === "studio" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B]">
              Onboarding
            </p>
            <h1 className="font-display mt-4 text-4xl sm:text-5xl">
              Name Your Studio
            </h1>
            <p className="mt-3 text-sm text-[#6B6B6B]">
              This is where your ideas come to life.
            </p>

            <div className="mt-10 w-full max-w-xl text-left">
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
                Workspace name
              </label>
              <input
                value={studioName}
                onChange={(event) => {
                  setStudioName(event.target.value);
                  setStudioTouched(true);
                }}
                placeholder="e.g., Ember Creative, Studio Atlas"
                className="w-full rounded-xl border border-[#E0DCD5] bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition focus:border-[#E89968] focus:shadow-[0_0_0_3px_rgba(232,153,104,0.2)]"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setStudioName(suggestion);
                      setStudioTouched(true);
                    }}
                    className="rounded-full border border-[#E0DCD5] bg-white px-3 py-1 text-xs font-medium text-[#1A1A1A] transition hover:border-[#E89968]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleStudioContinue}
                disabled={studioName.trim().length < 2}
                className="rounded-full bg-[#E89968] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleStudioSkip}
                className="text-xs font-semibold text-[#6B6B6B] transition hover:text-[#1A1A1A]"
              >
                I will do this later
              </button>
            </div>
          </section>
        )}

        {step === "team" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col justify-center px-6 py-16">
            <div className="relative rounded-3xl border border-[#E0DCD5] bg-white/70 p-8 shadow-[0_16px_40px_rgba(26,26,26,0.08)]">
              <span className="absolute right-6 top-6 rounded-full bg-[#E89968]/90 px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
                Unlock shared asset libraries
              </span>
              <h1 className="font-display text-3xl sm:text-4xl">
                Who is on your team?
              </h1>
              <p className="mt-2 text-sm text-[#6B6B6B]">
                Invite collaborators now or continue solo.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="teammate@studio.com"
                  className="w-full rounded-xl border border-[#E0DCD5] bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition focus:border-[#E89968] focus:shadow-[0_0_0_3px_rgba(232,153,104,0.2)]"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="rounded-full border border-[#1A1A1A] px-5 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:border-[#E89968]"
                >
                  + Add
                </button>
              </div>

              {teamEmails.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {teamEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 rounded-full bg-[#F7F4EF] px-3 py-1 text-xs text-[#1A1A1A]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-[#6B6B6B] transition hover:text-[#1A1A1A]"
                        aria-label={`Remove ${email}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep("intent")}
                  className="rounded-full bg-[#E89968] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Send invites
                </button>
                <button
                  type="button"
                  onClick={() => setStep("intent")}
                  className="text-xs font-semibold text-[#6B6B6B] transition hover:text-[#1A1A1A]"
                >
                  I will invite them later
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "intent" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col justify-center px-6 py-16">
            <h1 className="font-display text-center text-3xl sm:text-4xl">
              What are we creating today?
            </h1>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {intentOptions.map((card) => {
                const isSelected = intent === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleIntentSelect(card.id)}
                    className={`group flex min-h-[260px] flex-col justify-between rounded-2xl border bg-white p-6 text-left shadow-[0_16px_30px_rgba(26,26,26,0.08)] transition ${
                      isSelected
                        ? "border-[#E89968] shadow-[0_16px_30px_rgba(232,153,104,0.25)]"
                        : "border-[#E0DCD5] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(26,26,26,0.12)]"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B]">
                      {card.subtitle}
                    </div>
                    <div>
                      <h2 className="font-display text-2xl">{card.title}</h2>
                      <p className="mt-2 text-sm text-[#6B6B6B]">
                        {card.description}
                      </p>
                    </div>
                    <span className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E0DCD5] text-sm font-semibold text-[#1A1A1A] transition group-hover:border-[#E89968]">
                      {card.title.charAt(0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === "styles" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-6 py-16 text-center">
            <h1 className="font-display text-3xl sm:text-4xl">
              Calibrate Your Aesthetic
            </h1>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              Select 3 styles that match your vibe.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {styleOptions.map((style) => {
                const isSelected = styles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => toggleStyle(style.id)}
                    className={`relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl border text-left transition sm:h-52 ${
                      isSelected
                        ? "border-2 border-[#E89968] shadow-[0_12px_28px_rgba(232,153,104,0.2)]"
                        : "border-[#E0DCD5] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,26,26,0.12)]"
                    }`}
                    aria-label={`Select ${style.id}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${style.classes}`}
                    />
                    <div className="relative flex items-center justify-between bg-white/80 px-4 py-3 text-xs font-semibold text-[#1A1A1A] backdrop-blur">
                      <span>{style.id}</span>
                      {isSelected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7F4EF] text-xs font-bold text-[#E89968]">
                          OK
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-sm font-semibold text-[#6B6B6B]">
              {styles.length} of 3 selected
            </div>
            {showStyleFeedback && (
              <div className="mt-2 text-sm font-semibold text-[#E89968]">
                Impeccable taste. Tuning the AI weights now...
              </div>
            )}

            <button
              type="button"
              onClick={handleContinueFromStyles}
              disabled={styles.length !== 3}
              className="mt-8 rounded-full bg-[#E89968] px-8 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </section>
        )}

        {step === "loader" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#E0DCD5] bg-white text-lg font-semibold text-[#1A1A1A] shadow-[0_12px_24px_rgba(26,26,26,0.08)] motion-reduce:animate-none animate-pulse">
              M
            </div>
            <p className="font-display text-2xl sm:text-3xl">
              {loaderPhrases[loaderIndex]}
            </p>
            <div className="mt-8 h-1 w-full max-w-md overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#E89968] transition-all duration-200"
                style={{ width: `${loaderProgress}%` }}
              />
            </div>
          </section>
        )}

        {step === "trial" && (
          <section className="relative min-h-[100svh] px-6 py-16">
            <div className="mx-auto flex min-h-[100svh] w-full max-w-4xl items-center justify-center">
              <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
                <button
                  type="button"
                  onClick={() => finalizeOnboarding("free")}
                  className="absolute right-6 top-6 text-sm text-[#6B6B6B] transition hover:text-[#1A1A1A]"
                  aria-label="Close trial modal"
                >
                  x
                </button>
                <h2 className="font-display text-3xl">
                  Start your 7-day Pro trial?
                </h2>
                <p className="mt-3 text-sm text-[#6B6B6B]">
                  Unlock 4K upscaling, unlimited generations, and priority rendering.
                </p>

                <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E0DCD5]">
                  <div className="flex flex-col items-center justify-center bg-[#F7F4EF] p-6 text-center text-xs text-[#6B6B6B]">
                    <div className="mb-3 h-20 w-20 rounded-full bg-[#E0DCD5]" />
                    Standard Generation
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#111827] p-6 text-center text-xs text-[#E89968]">
                    <div className="mb-3 h-20 w-20 rounded-full bg-[#E89968]" />
                    4K Upscaled
                  </div>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-[#1A1A1A]">
                  {[
                    "Unlimited 4K exports",
                    "10x faster rendering",
                    "Advanced style mixing",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E89968] text-[10px] font-semibold text-white">
                        +
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {submitError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => finalizeOnboarding("trial")}
                    className="rounded-full bg-[#E89968] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Try for Free
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeOnboarding("free")}
                    className="rounded-full border border-[#1A1A1A] px-6 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:border-[#E89968]"
                  >
                    Continue to Free Workspace
                  </button>
                </div>
                <p className="mt-4 text-xs text-[#6B6B6B]">
                  No charge for 7 days. Cancel anytime.
                </p>
              </div>
            </div>
          </section>
        )}

        {step === "final" && (
          <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-[#E0DCD5] border-t-[#E89968]" />
            <h2 className="font-display text-3xl">Setting up your workspace...</h2>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              Just a moment while we prepare your studio.
            </p>
            {finalTimeoutReached && (
              <div className="mt-6 flex flex-col items-center gap-3 text-xs text-[#6B6B6B]">
                <p>Still working. If this takes too long, reload and try again.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full border border-[#E0DCD5] px-4 py-2 text-xs font-semibold text-[#1A1A1A] transition hover:border-[#E89968]"
                >
                  Reload page
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
