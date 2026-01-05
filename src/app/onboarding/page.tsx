"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  LayoutGrid,
  Palette,
  Presentation,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

type Step =
  | "signup"
  | "studio"
  | "role"
  | "team"
  | "intent"
  | "destination"
  | "styles"
  | "pairwise"
  | "negative"
  | "loader"
  | "dropin";

type IntentId = "moodboard" | "brand" | "concept" | "pitch";

type RoleId =
  | "founder"
  | "art_director"
  | "social_media_manager"
  | "developer";

type ModePreference = "quick_wins" | "high_control";

type StyleOption = {
  id: string;
  label: string;
  gradient: string;
};

type DestinationOption = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
};

type PairwiseRound = {
  id: number;
  left: { label: string; gradient: string };
  right: { label: string; gradient: string };
};

const TOTAL_STEPS = 6;

const intentOptions: {
  id: IntentId;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof LayoutGrid;
}[] = [
  {
    id: "moodboard",
    title: "Moodboard",
    subtitle: "Infinite Canvas",
    description: "Assemble references and explore ideas freely.",
    icon: LayoutGrid,
  },
  {
    id: "brand",
    title: "Brand Identity",
    subtitle: "Asset Library",
    description: "Generate logos, color palettes, and brand systems.",
    icon: Palette,
  },
  {
    id: "concept",
    title: "Concept Art",
    subtitle: "AI Generator",
    description: "Produce illustration and environment designs.",
    icon: Sparkles,
  },
  {
    id: "pitch",
    title: "Client Pitch",
    subtitle: "Presentation Mode",
    description: "Build decks with AI-generated visuals.",
    icon: Presentation,
  },
];

const roleOptions: {
  id: RoleId;
  label: string;
  description: string;
}[] = [
  { id: "founder", label: "Founder", description: "Fast outcomes, high impact." },
  {
    id: "art_director",
    label: "Art Director",
    description: "Taste forward, precision control.",
  },
  {
    id: "social_media_manager",
    label: "Social Media Manager",
    description: "Speed and consistency for feeds.",
  },
  { id: "developer", label: "Developer", description: "Workflow control and systems." },
];

const destinationOptions: DestinationOption[] = [
  {
    id: "vertical_9_16",
    title: "IG / TikTok",
    subtitle: "9:16",
    description: "Vertical social content",
  },
  {
    id: "web_hero_landscape",
    title: "Web Hero",
    subtitle: "16:9 or 21:9",
    description: "Homepage and campaigns",
  },
  {
    id: "slides_4_3",
    title: "Slides",
    subtitle: "4:3",
    description: "Pitch decks and presentations",
  },
  {
    id: "print_high_dpi",
    title: "Print",
    subtitle: "High DPI",
    description: "Posters and physical media",
  },
];

const styleOptions: StyleOption[] = [
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    gradient: "from-[#09090b] via-[#1e1b4b] to-[#38bdf8]",
  },
  {
    id: "bauhaus",
    label: "Bauhaus",
    gradient: "from-[#f97316] via-[#facc15] to-[#111827]",
  },
  {
    id: "vogue",
    label: "Vogue Editorial",
    gradient: "from-[#0f172a] via-[#6b7280] to-[#f9fafb]",
  },
  {
    id: "minimal",
    label: "Minimal Luxury",
    gradient: "from-[#f5f5f4] via-[#d6d3d1] to-[#a8a29e]",
  },
  {
    id: "film",
    label: "Film Still",
    gradient: "from-[#111827] via-[#334155] to-[#e2e8f0]",
  },
  {
    id: "brutal",
    label: "Neo-Brutal",
    gradient: "from-[#18181b] via-[#3f3f46] to-[#f43f5e]",
  },
  {
    id: "product",
    label: "Product Studio",
    gradient: "from-[#0f172a] via-[#0ea5e9] to-[#e2e8f0]",
  },
  {
    id: "surreal",
    label: "Surreal Collage",
    gradient: "from-[#701a75] via-[#ec4899] to-[#fef9c3]",
  },
  {
    id: "clean3d",
    label: "Clean 3D",
    gradient: "from-[#0f172a] via-[#22d3ee] to-[#f1f5f9]",
  },
];

const pairwiseRounds: PairwiseRound[] = [
  {
    id: 1,
    left: { label: "Editorial Minimal", gradient: "from-[#e2e8f0] via-[#cbd5f5] to-[#94a3b8]" },
    right: { label: "Cinematic Contrast", gradient: "from-[#0f172a] via-[#1e293b] to-[#f97316]" },
  },
  {
    id: 2,
    left: { label: "Warm Material", gradient: "from-[#f97316] via-[#f59e0b] to-[#fef3c7]" },
    right: { label: "Cool Precision", gradient: "from-[#0f172a] via-[#38bdf8] to-[#e2e8f0]" },
  },
  {
    id: 3,
    left: { label: "Soft Editorial", gradient: "from-[#f5f5f4] via-[#e7e5e4] to-[#cbd5f5]" },
    right: { label: "Bold Studio", gradient: "from-[#18181b] via-[#7c3aed] to-[#f97316]" },
  },
];

const negativeOptions = [
  { id: "weird_hands", label: "Weird hands" },
  { id: "plastic_look", label: "Plastic look" },
  { id: "gibberish_text", label: "Gibberish text" },
  { id: "too_cartoony", label: "Too cartoony" },
];

const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

const defaultModeForRole = (role: RoleId): ModePreference => {
  if (role === "founder" || role === "social_media_manager") {
    return "quick_wins";
  }
  return "high_control";
};

const destinationLabel = (id: string | null) => {
  const match = destinationOptions.find((option) => option.id === id);
  return match?.title ?? "your destination";
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("signup");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("");
  const [studioError, setStudioError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleId | null>(null);
  const [modePreference, setModePreference] = useState<ModePreference | null>(null);
  const [teamInput, setTeamInput] = useState("");
  const [teamInvites, setTeamInvites] = useState<string[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentId | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [stylesError, setStylesError] = useState<string | null>(null);
  const [pairwiseIndex, setPairwiseIndex] = useState(0);
  const [petPeeve, setPetPeeve] = useState<string | null>(null);
  const [petPeeveError, setPetPeeveError] = useState<string | null>(null);
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [showTrial, setShowTrial] = useState(false);
  const [trialChoice, setTrialChoice] = useState<"trial" | "free" | null>(null);

  const roleAdvanceRef = useRef<number | null>(null);

  const progressStep = useMemo(() => {
    switch (step) {
      case "studio":
        return 1;
      case "role":
        return 2;
      case "team":
        return 2;
      case "intent":
        return 3;
      case "destination":
        return 4;
      case "styles":
        return 5;
      case "pairwise":
      case "negative":
        return 6;
      default:
        return null;
    }
  }, [step]);

  const studioSlug = useMemo(() => slugify(studioName || "your-studio"), [studioName]);

  const primaryStyle = useMemo(() => {
    const selected = styles[0];
    const matched = styleOptions.find((option) => option.id === selected);
    return matched?.label ?? styleOptions[0].label;
  }, [styles]);

  const loaderLines = useMemo(() => {
    const selectedLabels = styles
      .map((id) => styleOptions.find((option) => option.id === id)?.label)
      .filter((label): label is string => Boolean(label))
      .join(" / ");
    return [
      selectedLabels
        ? `Loading ${selectedLabels} LoRA...`
        : "Loading calibrated LoRA mix...",
      studioName
        ? `Configuring ${studioName} workspace...`
        : "Configuring your workspace...",
      destination
        ? `Setting export sizes for ${destinationLabel(destination)}...`
        : "Setting export sizes for your destination...",
      "Warming the canvas...",
    ];
  }, [styles, studioName, destination]);

  useEffect(() => {
    if (step !== "loader") {
      return;
    }
    setLoaderIndex(0);
    setShowTrial(false);
    const lineTimer = window.setInterval(() => {
      setLoaderIndex((prev) => (prev + 1) % loaderLines.length);
    }, 1800);
    const gateTimer = window.setTimeout(() => setShowTrial(true), 1200);
    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(gateTimer);
    };
  }, [step, loaderLines.length]);

  useEffect(() => {
    return () => {
      if (roleAdvanceRef.current) {
        window.clearTimeout(roleAdvanceRef.current);
      }
    };
  }, []);

  const scheduleRoleAdvance = () => {
    if (roleAdvanceRef.current) {
      window.clearTimeout(roleAdvanceRef.current);
    }
    roleAdvanceRef.current = window.setTimeout(() => {
      setStep("team");
    }, 600);
  };

  const handleEmailContinue = () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email.");
      return;
    }
    setEmailError(null);
    setStep("studio");
  };

  const handleStudioContinue = () => {
    if (studioName.trim().length < 2) {
      setStudioError("Studio name cannot be empty.");
      return;
    }
    setStudioError(null);
    setStep("role");
  };

  const handleRoleSelect = (selected: RoleId) => {
    setRole(selected);
    setModePreference(defaultModeForRole(selected));
    scheduleRoleAdvance();
  };

  const handleModeToggle = (mode: ModePreference) => {
    setModePreference(mode);
    if (role) {
      scheduleRoleAdvance();
    }
  };

  const addInvite = () => {
    const trimmed = teamInput.trim().toLowerCase();
    if (!trimmed) {
      return;
    }
    if (!validateEmail(trimmed)) {
      setTeamError("One or more emails look invalid.");
      return;
    }
    if (!teamInvites.includes(trimmed)) {
      setTeamInvites((prev) => [...prev, trimmed]);
    }
    setTeamInput("");
    setTeamError(null);
  };

  const handleIntentContinue = () => {
    if (!intent) {
      setIntentError("Choose one to continue.");
      return;
    }
    setIntentError(null);
    setStep("destination");
  };

  const handleDestinationContinue = () => {
    if (!destination) {
      setDestinationError("Select a format to continue.");
      return;
    }
    setDestinationError(null);
    setStep("styles");
  };

  const toggleStyle = (id: string) => {
    setStylesError(null);
    setStyles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((style) => style !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleStylesContinue = () => {
    if (styles.length !== 3) {
      setStylesError("Pick 3 styles to continue.");
      return;
    }
    setStylesError(null);
    setStep("pairwise");
  };

  const handlePairwiseChoice = (choice: "left" | "right") => {
    void choice;
    if (pairwiseIndex < pairwiseRounds.length - 1) {
      setPairwiseIndex((prev) => prev + 1);
      return;
    }
    setStep("negative");
  };

  const handleNegativeContinue = () => {
    if (!petPeeve) {
      setPetPeeveError("Select one to continue.");
      return;
    }
    setPetPeeveError(null);
    setStep("loader");
  };

  const handleTrialChoice = (choice: "trial" | "free") => {
    setTrialChoice(choice);
    setShowTrial(false);
    setStep("dropin");
  };

  const isHighControl = modePreference === "high_control";

  return (
    <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
      {step === "signup" && (
        <section className="min-h-[100svh]">
          <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
              <div className="max-w-md">
                <img
                  src="/moooday_black-removed.png"
                  alt="Moody"
                  className="h-10 w-auto"
                />
                <h1 className="font-display mt-8 text-4xl sm:text-5xl">
                  Studio-grade visuals. Instantly.
                </h1>
                <p className="mt-3 text-sm text-[color:var(--grey)]">
                  Drop an image. Moody upgrades it to pitch-ready.
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => setStep("studio")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--charcoal)]/20 bg-white px-5 py-3 text-sm font-semibold text-[color:var(--charcoal)] shadow-sm transition hover:border-[color:var(--charcoal)]/40"
                  >
                    Continue with Google
                  </button>
                  {!showEmailForm && (
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--charcoal)]/20 bg-[color:var(--white)] px-5 py-3 text-sm font-semibold text-[color:var(--charcoal)] transition hover:border-[color:var(--charcoal)]/40"
                    >
                      Continue with Email
                    </button>
                  )}
                </div>

                {showEmailForm && (
                  <div className="mt-6 space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--charcoal)]/60"
                      placeholder="name@studio.com"
                    />
                    {emailError && (
                      <p className="text-xs text-red-400">{emailError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleEmailContinue}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--charcoal)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      Continue
                    </button>
                  </div>
                )}

                <p className="mt-6 text-xs text-[color:var(--grey)]">
                  By signing up, you agree to our Terms and Privacy Policy.
                </p>
                <p className="mt-3 text-xs text-[color:var(--grey)]">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-semibold text-[color:var(--charcoal)]"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <div className="relative hidden overflow-hidden bg-[#0b0a0f] lg:flex">
              <div className="absolute inset-0">
                <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#7c3aed]/40 blur-3xl" />
                <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-[#38bdf8]/30 blur-3xl" />
              </div>
              <div className="relative flex w-full flex-col justify-center px-14">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Moody Canvas</span>
                    <span>Demo</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Before</div>
                      <div className="mt-3 h-32 rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-white/0 blur-[2px]" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="text-xs text-white/60">After</div>
                      <div className="mt-3 h-32 rounded-xl bg-gradient-to-br from-white via-white/60 to-white/20" />
                      <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        8K Enhanced
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-sm text-white/70">
                  Drag - Moody snaps it to 8K.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "studio" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <h2 className="font-display text-3xl">Name your Studio.</h2>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                We'll set up your workspace and exports under this name.
              </p>
              <div className="mt-8 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  Studio name
                </label>
                <input
                  value={studioName}
                  onChange={(event) => setStudioName(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--charcoal)]/60"
                  placeholder="Ember Creative"
                />
                <p className="text-xs text-[color:var(--grey)]">
                  Workspace URL: moody.com/{studioSlug}
                </p>
                {studioError && (
                  <p className="text-xs text-red-400">{studioError}</p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Studio Atlas", "Ember Creative", "Juniper Lab"].map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => setStudioName(suggestion)}
                    className="rounded-full border border-[color:var(--charcoal)]/15 px-4 py-1.5 text-xs text-[color:var(--charcoal)] transition hover:border-[color:var(--charcoal)]/40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleStudioContinue}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "role" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <h2 className="font-display text-3xl">How do you work?</h2>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                So Moody can match your pace - fast wins or full control.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {roleOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => handleRoleSelect(option.id)}
                    className={`rounded-2xl border px-5 py-4 text-left transition ${
                      role === option.id
                        ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                        : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[color:var(--charcoal)]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--grey)]">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  <SlidersHorizontal className="h-4 w-4" />
                  Mode
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    { id: "quick_wins", label: "Quick wins" },
                    { id: "high_control", label: "High control" },
                  ] as const).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleModeToggle(mode.id)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                        modePreference === mode.id
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                          : "border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-6 text-xs text-[color:var(--grey)]">
                We'll open your studio in the mode that fits your role.
              </p>
            </div>
          </div>
        </section>
      )}

      {step === "team" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl">Who's on your team?</h2>
                  <p className="mt-2 text-sm text-[color:var(--grey)]">
                    Invite now or keep it solo - your workspace is ready either way.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  Invite your team to unlock shared asset libraries instantly
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  Team invites
                </label>
                <div className="flex flex-wrap gap-3">
                  <input
                    value={teamInput}
                    onChange={(event) => setTeamInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addInvite();
                      }
                    }}
                    className="flex-1 rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--charcoal)]/60"
                    placeholder="teammate@studio.com"
                  />
                  <button
                    type="button"
                    onClick={addInvite}
                    className="rounded-full border border-[color:var(--charcoal)]/20 px-5 py-2 text-xs font-semibold text-[color:var(--charcoal)] transition hover:border-[color:var(--charcoal)]/50"
                  >
                    Add
                  </button>
                </div>
                {teamError && (
                  <p className="text-xs text-red-400">{teamError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {teamInvites.map((invite) => (
                    <span
                      key={invite}
                      className="inline-flex items-center gap-2 rounded-full bg-[color:var(--periwinkle)]/60 px-3 py-1 text-xs text-[color:var(--charcoal)]"
                    >
                      {invite}
                      <button
                        type="button"
                        onClick={() =>
                          setTeamInvites((prev) =>
                            prev.filter((item) => item !== invite),
                          )
                        }
                        className="text-[color:var(--charcoal)]/60"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStep("intent")}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  {teamInvites.length ? "Send invites" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep("intent")}
                  className="text-xs font-semibold text-[color:var(--grey)]"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "intent" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <h2 className="font-display text-4xl">What are we creating today?</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Pick a starting mode - we'll open the right workspace.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {intentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = intent === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setIntent(option.id)}
                    className={`rounded-[28px] border p-6 text-left transition ${
                      isSelected
                        ? "border-[color:var(--orange)] shadow-[0_20px_40px_rgba(232,153,104,0.18)]"
                        : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-[color:var(--charcoal)]" />
                    <p className="mt-4 font-display text-2xl">{option.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                      {option.subtitle}
                    </p>
                    <p className="mt-3 text-sm text-[color:var(--grey)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
            {intentError && (
              <p className="mt-4 text-xs text-red-400">{intentError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleIntentContinue}
                disabled={!intent}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "destination" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <h2 className="font-display text-4xl">Where will it live?</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              So your canvas exports are the right size from the start.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {destinationOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDestination(option.id)}
                  className={`rounded-[26px] border p-6 text-left transition ${
                    destination === option.id
                      ? "border-[color:var(--orange)] shadow-[0_20px_40px_rgba(232,153,104,0.18)]"
                      : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-[color:var(--charcoal)]">
                      {option.title}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                      {option.subtitle}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--grey)]">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
            {destinationError && (
              <p className="mt-4 text-xs text-red-400">{destinationError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleDestinationContinue}
                disabled={!destination}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "styles" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <h2 className="font-display text-4xl">Calibrate your Aesthetic.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Choose 3 styles - Moody tunes your workspace presets.
            </p>
            <div className="mt-6 text-sm text-[color:var(--grey)]">
              {styles.length}/3 selected
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {styleOptions.map((style) => {
                const isSelected = styles.includes(style.id);
                return (
                  <button
                    type="button"
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                        : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                    }`}
                  >
                    <div
                      className={`h-28 rounded-xl bg-gradient-to-br ${style.gradient}`}
                    />
                    <p className="mt-4 text-sm font-semibold text-[color:var(--charcoal)]">
                      {style.label}
                    </p>
                    {isSelected && (
                      <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[color:var(--charcoal)]">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {styles.length === 3 && (
              <p className="mt-4 text-sm text-[color:var(--charcoal)]">
                Excellent taste. Tuning the AI weights now...
              </p>
            )}
            {stylesError && (
              <p className="mt-2 text-xs text-red-400">{stylesError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleStylesContinue}
                disabled={styles.length !== 3}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "pairwise" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <h2 className="font-display text-4xl">Lock in your studio taste.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Pick what feels more you - Moody learns fast.
            </p>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-[color:var(--grey)]">
              {pairwiseIndex + 1} / {pairwiseRounds.length}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {(["left", "right"] as const).map((side) => {
                const round = pairwiseRounds[pairwiseIndex];
                const panel = side === "left" ? round.left : round.right;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => handlePairwiseChoice(side)}
                    className="group rounded-[28px] border border-[color:var(--charcoal)]/15 bg-white p-5 text-left transition hover:border-[color:var(--orange)] hover:shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                  >
                    <div
                      className={`h-48 rounded-2xl bg-gradient-to-br ${panel.gradient}`}
                    />
                    <p className="mt-4 text-sm font-semibold text-[color:var(--charcoal)]">
                      {panel.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {step === "negative" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
              Step {progressStep} of {TOTAL_STEPS}
            </div>
            <h2 className="font-display text-4xl">What should Moody avoid?</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              We'll keep this out of your results by default.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {negativeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPetPeeve(option.id)}
                  className={`rounded-[24px] border px-5 py-4 text-left transition ${
                    petPeeve === option.id
                      ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                      : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-[color:var(--charcoal)]">
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
            {petPeeveError && (
              <p className="mt-4 text-xs text-red-400">{petPeeveError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleNegativeContinue}
                disabled={!petPeeve}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "loader" && (
        <section className="relative min-h-[100svh] bg-[#0f1115] px-6 py-16 text-white">
          <div className="absolute inset-0">
            <div className="absolute left-12 top-16 h-52 w-52 rounded-full bg-[#f97316]/20 blur-3xl" />
            <div className="absolute right-10 top-32 h-72 w-72 rounded-full bg-[#38bdf8]/20 blur-3xl" />
          </div>
          <div className="relative mx-auto flex min-h-[100svh] max-w-xl flex-col items-center justify-center text-center">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/20">
              <Users className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Building your studio
            </p>
            <h2 className="font-display mt-4 text-3xl sm:text-4xl">
              {loaderLines[loaderIndex]}
            </h2>
            <div className="mt-6 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-white/60" />
            </div>
          </div>

          {showTrial && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-6">
              <div className="w-full max-w-xl rounded-[28px] bg-white p-8 text-[color:var(--charcoal)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <h3 className="font-display text-2xl">
                  Start your 7-Day Pro Trial?
                </h3>
                <p className="mt-2 text-sm text-[color:var(--grey)]">
                  Unlock 4K Upscale + faster exports for client-ready work.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[color:var(--charcoal)]/15 bg-[color:var(--white)] p-4">
                    <p className="text-xs text-[color:var(--grey)]">
                      Standard Generation
                    </p>
                    <div className="mt-3 h-24 rounded-xl bg-[color:var(--charcoal)]/10" />
                  </div>
                  <div className="rounded-2xl border border-[color:var(--orange)]/60 bg-[color:var(--orange)]/10 p-4">
                    <p className="text-xs text-[color:var(--grey)]">
                      4K Upscaled
                    </p>
                    <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-white to-[color:var(--orange)]/30" />
                  </div>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-[color:var(--charcoal)]">
                  {[
                    "Unlimited 4K exports",
                    "10x faster rendering",
                    "Advanced style mixing",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--orange)]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleTrialChoice("trial")}
                    className="rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Start Free Trial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrialChoice("free")}
                    className="rounded-full border border-[color:var(--charcoal)]/20 px-6 py-3 text-sm font-semibold text-[color:var(--charcoal)]"
                  >
                    Continue to Free Workspace
                  </button>
                </div>
                <p className="mt-4 text-xs text-[color:var(--grey)]">
                  No charge for 7 days. Cancel anytime.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {step === "dropin" && (
        <section className="min-h-[100svh] bg-[#f5f4f0]">
          <div className="border-b border-[color:var(--charcoal)]/10 bg-white px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--grey)]">
                  Workspace
                </p>
                <h2 className="font-display text-2xl">
                  {studioName || "Moody Studio"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color:var(--orange)]/20 px-3 py-1 text-xs font-semibold text-[color:var(--charcoal)]">
                  {primaryStyle}
                </span>
                {destination && (
                  <span className="rounded-full bg-[color:var(--periwinkle)]/70 px-3 py-1 text-xs font-semibold text-[color:var(--charcoal)]">
                    {destinationLabel(destination)}
                  </span>
                )}
                {modePreference && (
                  <span className="rounded-full bg-[color:var(--charcoal)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--charcoal)]">
                    {modePreference === "quick_wins" ? "Quick wins" : "High control"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-[color:var(--charcoal)]/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                Quick actions
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <button className="w-full rounded-xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] px-4 py-3 text-left">
                  Generate visual
                </button>
                <button className="w-full rounded-xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] px-4 py-3 text-left">
                  Upscale asset
                </button>
                <button className="w-full rounded-xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] px-4 py-3 text-left">
                  Import references
                </button>
              </div>
              {trialChoice === "trial" && (
                <div className="mt-6 rounded-2xl bg-[color:var(--orange)]/20 p-4 text-xs">
                  Pro trial active · 7 days left
                </div>
              )}
              {isHighControl && (
                <div className="mt-6 space-y-2 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-4 text-xs text-[color:var(--grey)]">
                  <p className="text-[color:var(--charcoal)]">High control tools</p>
                  <div className="flex items-center justify-between">
                    <span>Strength</span>
                    <span>0.72</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Seed</span>
                    <span>Auto</span>
                  </div>
                </div>
              )}
            </aside>

            <div className="rounded-3xl border border-[color:var(--charcoal)]/10 bg-white p-6">
              <div className="mb-6 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                  Welcome asset
                </p>
                <div className="mt-4 h-40 rounded-2xl bg-gradient-to-br from-[#f5f5f4] via-[#e7e5e4] to-[#cbd5f5]" />
              </div>

              {intent === "brand" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                    Brand identity
                  </p>
                  <h3 className="font-display mt-2 text-2xl">
                    Build your visual system
                  </h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["Logos", "Palettes", "Typography"].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-4"
                      >
                        <p className="text-sm font-semibold">{item}</p>
                        <p className="mt-1 text-xs text-[color:var(--grey)]">
                          Starter folder ready
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {intent === "concept" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                    Concept art
                  </p>
                  <h3 className="font-display mt-2 text-2xl">
                    Generate your first scene
                  </h3>
                  <div className="mt-6 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-4">
                    <p className="text-xs text-[color:var(--grey)]">
                      Prompt starter
                    </p>
                    <p className="mt-2 text-sm">
                      "Cinematic skyline at dusk, reflective glass, dramatic haze."
                    </p>
                  </div>
                </div>
              )}

              {intent === "pitch" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                    Client pitch
                  </p>
                  <h3 className="font-display mt-2 text-2xl">
                    Your first deck is staged
                  </h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["Hero Visual", "Product Story", "Results"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-4 ${
                          index === 0 ? "shadow-[0_12px_24px_rgba(0,0,0,0.08)]" : ""
                        }`}
                      >
                        <p className="text-sm font-semibold">Slide {index + 1}</p>
                        <p className="mt-1 text-xs text-[color:var(--grey)]">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(intent === "moodboard" || !intent) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                    Moodboard
                  </p>
                  <h3 className="font-display mt-2 text-2xl">
                    {studioName || "Moody Studio"} First Concept
                  </h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`tile-${index}`}
                        className="h-28 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)]"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-[color:var(--charcoal)]/15 bg-[color:var(--white)] p-4">
                <p className="text-xs font-semibold text-[color:var(--charcoal)]">
                  Not quite right? Tell me what to change.
                </p>
                <p className="mt-1 text-xs text-[color:var(--grey)]">
                  Try: "Make it moodier", "Fix the text", "Remove background".
                </p>
                <input
                  autoFocus
                  className="mt-3 w-full border-none bg-transparent text-sm outline-none"
                  placeholder="Describe the edit you want..."
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Make it moodier",
                    "Fix the text",
                    "Remove background",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="rounded-full border border-[color:var(--charcoal)]/20 px-3 py-1 text-xs text-[color:var(--charcoal)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-5 py-2 text-xs font-semibold text-white">
                  Apply edit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
