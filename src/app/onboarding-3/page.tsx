"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  Palette,
  Presentation,
  Sparkles,
  Users,
} from "lucide-react";

type Step =
  | "consent"
  | "signup"
  | "persona"
  | "intent"
  | "brand"
  | "calibration"
  | "negative"
  | "variants"
  | "edit"
  | "collab"
  | "trial"
  | "done";

type RoleId =
  | "founder"
  | "art_director"
  | "designer"
  | "marketer"
  | "developer";

type IntentId = "moodboard" | "brand" | "concept" | "pitch";

type DestinationId =
  | "vertical_9_16"
  | "web_hero_landscape"
  | "slides_4_3"
  | "print_high_dpi";

type DeadlineId = "explore" | "today" | "week";

type TeamSizeId = "solo" | "small" | "medium" | "large";

type ClientWorkId = "client" | "mixed" | "internal";

type CalibrationAxis =
  | "minimal_vs_maximal"
  | "editorial_vs_illustrative"
  | "warm_vs_cool";

type CalibrationChoice = {
  axis: CalibrationAxis;
  choice: "left" | "right";
  rationale?: string;
};

type PairwiseRound = {
  id: CalibrationAxis;
  title: string;
  left: { label: string; gradient: string };
  right: { label: string; gradient: string };
};

const PHASE_TOTAL = 9;

const PHASE_MAP: Record<Step, number | null> = {
  consent: 0,
  signup: 1,
  persona: 2,
  intent: 3,
  brand: 4,
  calibration: 5,
  negative: 6,
  variants: 7,
  edit: 8,
  collab: 8,
  trial: 9,
  done: null,
};

const roleOptions: { id: RoleId; label: string; description: string }[] = [
  { id: "founder", label: "Founder", description: "Leads the studio vision." },
  {
    id: "art_director",
    label: "Art Director",
    description: "Crafts and approves the aesthetic.",
  },
  { id: "designer", label: "Designer", description: "Hands-on visual maker." },
  {
    id: "marketer",
    label: "Marketer",
    description: "Campaign and brand results.",
  },
  { id: "developer", label: "Developer", description: "Builds systems and flows." },
];

const teamSizeOptions: { id: TeamSizeId; label: string; description: string }[] = [
  { id: "solo", label: "1", description: "Just me" },
  { id: "small", label: "2-5", description: "Small crew" },
  { id: "medium", label: "6-20", description: "Growing team" },
  { id: "large", label: "20+", description: "Full studio" },
];

const clientWorkOptions: { id: ClientWorkId; label: string }[] = [
  { id: "client", label: "Mostly client" },
  { id: "mixed", label: "Mixed" },
  { id: "internal", label: "Mostly internal" },
];

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
    description: "Collect ideas and explore tone.",
    icon: LayoutGrid,
  },
  {
    id: "brand",
    title: "Brand Identity",
    subtitle: "Asset Library",
    description: "Generate systems and visual kits.",
    icon: Palette,
  },
  {
    id: "concept",
    title: "Concept Art",
    subtitle: "AI Generator",
    description: "Produce illustrations and worlds.",
    icon: Sparkles,
  },
  {
    id: "pitch",
    title: "Client Pitch",
    subtitle: "Presentation Mode",
    description: "Build decks with impact visuals.",
    icon: Presentation,
  },
];

const destinationOptions: {
  id: DestinationId;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "vertical_9_16",
    title: "IG / TikTok",
    subtitle: "9:16",
    description: "Vertical social content",
  },
  {
    id: "web_hero_landscape",
    title: "Web",
    subtitle: "16:9 or 21:9",
    description: "Hero headers and campaigns",
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

const deadlineOptions: { id: DeadlineId; label: string; description: string }[] = [
  { id: "explore", label: "Just exploring", description: "No rush" },
  { id: "today", label: "Today", description: "Need it fast" },
  { id: "week", label: "This week", description: "Client deadline" },
];

const calibrationRounds: PairwiseRound[] = [
  {
    id: "minimal_vs_maximal",
    title: "Minimal vs Maximal",
    left: {
      label: "Minimal",
      gradient: "from-[#f5f5f4] via-[#e7e5e4] to-[#cbd5f5]",
    },
    right: {
      label: "Maximal",
      gradient: "from-[#111827] via-[#7c3aed] to-[#f97316]",
    },
  },
  {
    id: "editorial_vs_illustrative",
    title: "Editorial vs Illustrative",
    left: {
      label: "Editorial",
      gradient: "from-[#0f172a] via-[#64748b] to-[#e2e8f0]",
    },
    right: {
      label: "Illustrative",
      gradient: "from-[#ec4899] via-[#a855f7] to-[#fcd34d]",
    },
  },
  {
    id: "warm_vs_cool",
    title: "Warm vs Cool",
    left: {
      label: "Warm",
      gradient: "from-[#f97316] via-[#f59e0b] to-[#fef3c7]",
    },
    right: {
      label: "Cool",
      gradient: "from-[#0f172a] via-[#38bdf8] to-[#e2e8f0]",
    },
  },
];

const rationaleChips = [
  "Composition",
  "Color",
  "Lighting",
  "Texture",
  "Typography",
  "Vibe",
];

const negativeOptions = [
  { id: "weird_hands", label: "Weird hands" },
  { id: "plastic_look", label: "Plastic or CGI" },
  { id: "garbled_text", label: "Garbled text" },
  { id: "oversaturated", label: "Oversaturated" },
  { id: "too_cartoony", label: "Too cartoony" },
  { id: "other", label: "Other" },
];

const variantOptions = [
  { id: "v1", label: "Variant 1", gradient: "from-[#0f172a] to-[#64748b]" },
  { id: "v2", label: "Variant 2", gradient: "from-[#111827] to-[#f97316]" },
  { id: "v3", label: "Variant 3", gradient: "from-[#f5f5f4] to-[#cbd5f5]" },
  { id: "v4", label: "Variant 4", gradient: "from-[#0f172a] to-[#38bdf8]" },
];

const failureChips = [
  "Hands",
  "Text",
  "Color",
  "Composition",
  "Lighting",
  "Texture",
];

const editIntents = [
  "Make it more minimal",
  "Match my brand colors",
  "Fix the text",
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

export default function Onboarding3Page() {
  const [step, setStep] = useState<Step>("consent");
  const [consentPersonalize, setConsentPersonalize] = useState(true);
  const [consentImprove, setConsentImprove] = useState(false);
  const [region, setRegion] = useState("");
  const [referral, setReferral] = useState("");
  const [consentError, setConsentError] = useState<string | null>(null);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [studioName, setStudioName] = useState("");
  const [role, setRole] = useState<RoleId | null>(null);
  const [teamSize, setTeamSize] = useState<TeamSizeId | null>(null);
  const [clientWork, setClientWork] = useState<ClientWorkId | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);

  const [intent, setIntent] = useState<IntentId | null>(null);
  const [destination, setDestination] = useState<DestinationId | null>(null);
  const [deadline, setDeadline] = useState<DeadlineId | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  const [brandFiles, setBrandFiles] = useState<string[]>([]);

  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [calibrationPicked, setCalibrationPicked] = useState<"left" | "right" | null>(
    null,
  );
  const [calibrationReason, setCalibrationReason] = useState<string | null>(null);
  const [, setCalibrationChoices] = useState<CalibrationChoice[]>([]);

  const [negativeSelection, setNegativeSelection] = useState<string | null>(null);
  const [negativeOther, setNegativeOther] = useState("");
  const [negativeError, setNegativeError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [variantNotes, setVariantNotes] = useState<string[]>([]);
  const [variantError, setVariantError] = useState<string | null>(null);

  const [editIntent, setEditIntent] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [inviteInput, setInviteInput] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const [trialChoice, setTrialChoice] = useState<"trial" | "free" | null>(null);

  const phase = useMemo(() => PHASE_MAP[step], [step]);
  const studioSlug = useMemo(() => slugify(studioName || "your-studio"), [studioName]);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleConsentContinue = () => {
    if (!region) {
      setConsentError("Please select your region.");
      return;
    }
    setConsentError(null);
    setStep("signup");
  };

  const handleEmailContinue = () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email.");
      return;
    }
    setEmailError(null);
    setStep("persona");
  };

  const handlePersonaContinue = () => {
    if (!studioName.trim() || !role || !teamSize || !clientWork) {
      setPersonaError("Complete the studio profile to continue.");
      return;
    }
    setPersonaError(null);
    setStep("intent");
  };

  const handleIntentContinue = () => {
    if (!intent || !destination || !deadline) {
      setIntentError("Select all three to continue.");
      return;
    }
    setIntentError(null);
    setStep("brand");
  };

  const handleCalibrationAdvance = (reason?: string | null) => {
    const round = calibrationRounds[calibrationIndex];
    if (!calibrationPicked) {
      return;
    }
    setCalibrationChoices((prev) => {
      const next = [...prev];
      next[calibrationIndex] = {
        axis: round.id,
        choice: calibrationPicked,
        rationale: reason ?? undefined,
      };
      return next;
    });

    if (calibrationIndex < calibrationRounds.length - 1) {
      setCalibrationIndex((prev) => prev + 1);
      setCalibrationPicked(null);
      setCalibrationReason(null);
    } else {
      setStep("negative");
    }
  };

  const handleNegativeContinue = () => {
    if (!negativeSelection) {
      setNegativeError("Choose one to continue.");
      return;
    }
    setNegativeError(null);
    setStep("variants");
  };

  const handleVariantContinue = () => {
    if (!selectedVariant) {
      setVariantError("Pick the best variant to continue.");
      return;
    }
    setVariantError(null);
    setStep("edit");
  };

  const handleEditApply = () => {
    if (!editIntent && !editText.trim()) {
      setEditError("Pick an edit intent or write a change.");
      return;
    }
    setEditError(null);
    setStep("collab");
  };

  const handleInviteSend = () => {
    if (!inviteInput.trim()) {
      setInviteError("Enter an email or skip for now.");
      return;
    }
    if (!validateEmail(inviteInput.trim())) {
      setInviteError("That email does not look valid.");
      return;
    }
    setInviteSent(true);
    setInviteError(null);
    setStep("trial");
  };

  const phaseLabel = phase !== null ? `Phase ${phase} of ${PHASE_TOTAL}` : null;

  return (
    <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
      {step === "consent" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <h1 className="font-display text-3xl">Your data contract.</h1>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                Help us tailor your results and keep your data preferences clear.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--charcoal)]/15 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">Personalize my results</p>
                    <p className="text-xs text-[color:var(--grey)]">
                      Lets Moody tune your workspace and defaults.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConsentPersonalize((prev) => !prev)}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                      consentPersonalize
                        ? "bg-[color:var(--charcoal)] text-white"
                        : "border border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                    }`}
                  >
                    {consentPersonalize ? "On" : "Off"}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--charcoal)]/15 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">Help improve Moody</p>
                    <p className="text-xs text-[color:var(--grey)]">
                      Share anonymized usage to improve the model.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConsentImprove((prev) => !prev)}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                      consentImprove
                        ? "bg-[color:var(--charcoal)] text-white"
                        : "border border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                    }`}
                  >
                    {consentImprove ? "On" : "Off"}
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">Select region</option>
                    <option value="us">United States / Canada</option>
                    <option value="eu">EU / UK</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                    Referral (optional)
                  </label>
                  <input
                    value={referral}
                    onChange={(event) => setReferral(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm"
                    placeholder="Search, friend, ad"
                  />
                </div>
              </div>
              {consentError && (
                <p className="mt-4 text-xs text-red-400">{consentError}</p>
              )}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleConsentContinue}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "signup" && (
        <section className="min-h-[100svh]">
          <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
              <div className="max-w-md">
                {phaseLabel && (
                  <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                    {phaseLabel}
                  </div>
                )}
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
                    onClick={() => setStep("persona")}
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

      {step === "persona" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <h2 className="font-display text-3xl">Set your studio profile.</h2>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                We use this to tailor your workspace defaults.
              </p>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                    Studio name
                  </label>
                  <input
                    value={studioName}
                    onChange={(event) => setStudioName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm"
                    placeholder="Ember Creative"
                  />
                  <p className="mt-2 text-xs text-[color:var(--grey)]">
                    Workspace URL: moody.com/{studioSlug}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                    Team size
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {teamSizeOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTeamSize(option.id)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          teamSize === option.id
                            ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                            : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                        }`}
                      >
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-xs text-[color:var(--grey)]">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  Your role
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRole(option.id)}
                      className={`rounded-2xl border px-5 py-4 text-left transition ${
                        role === option.id
                          ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                          : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs text-[color:var(--grey)]">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  Client work
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {clientWorkOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setClientWork(option.id)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        clientWork === option.id
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                          : "border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {personaError && (
                <p className="mt-4 text-xs text-red-400">{personaError}</p>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handlePersonaContinue}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "intent" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <h2 className="font-display text-4xl">Intent and delivery.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Tell us what you are building so we prep the right canvas.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {intentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setIntent(option.id)}
                    className={`rounded-[28px] border p-6 text-left transition ${
                      intent === option.id
                        ? "border-[color:var(--orange)] shadow-[0_20px_40px_rgba(232,153,104,0.18)]"
                        : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
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

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Where does it live?</h3>
                <div className="mt-3 grid gap-3">
                  {destinationOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setDestination(option.id)}
                      className={`rounded-2xl border px-5 py-4 text-left transition ${
                        destination === option.id
                          ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                          : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{option.title}</p>
                        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--grey)]">
                          {option.subtitle}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--grey)]">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">When do you need it?</h3>
                <div className="mt-3 grid gap-3">
                  {deadlineOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setDeadline(option.id)}
                      className={`rounded-2xl border px-5 py-4 text-left transition ${
                        deadline === option.id
                          ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                          : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs text-[color:var(--grey)]">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {intentError && (
              <p className="mt-4 text-xs text-red-400">{intentError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleIntentContinue}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "brand" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <h2 className="font-display text-3xl">Drop your brand kit.</h2>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                Optional - we will match your palette and typography instantly.
              </p>

              <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--charcoal)]/20 bg-[color:var(--white)] px-6 py-10 text-center">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []).map(
                      (file) => file.name,
                    );
                    setBrandFiles(files);
                  }}
                />
                <p className="text-sm font-semibold">Upload brand assets</p>
                <p className="mt-2 text-xs text-[color:var(--grey)]">
                  Logos, color palettes, fonts, sample posts
                </p>
              </label>

              {brandFiles.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                    Files added
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {brandFiles.map((file) => (
                      <span
                        key={file}
                        className="rounded-full border border-[color:var(--charcoal)]/15 px-3 py-1 text-xs"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep("calibration")}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep("calibration")}
                  className="text-xs font-semibold text-[color:var(--grey)]"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "calibration" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-4xl text-center">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <h2 className="font-display text-4xl">Taste calibration.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Three fast picks. Moody learns your style balance.
            </p>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-[color:var(--grey)]">
              {calibrationIndex + 1} / {calibrationRounds.length}
            </div>

            <div className="mt-8 rounded-2xl border border-[color:var(--charcoal)]/15 bg-white px-6 py-4 text-sm font-semibold">
              {calibrationRounds[calibrationIndex].title}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {(["left", "right"] as const).map((side) => {
                const round = calibrationRounds[calibrationIndex];
                const panel = side === "left" ? round.left : round.right;
                const isSelected = calibrationPicked === side;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setCalibrationPicked(side)}
                    className={`rounded-[28px] border p-5 text-left transition ${
                      isSelected
                        ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                        : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                    }`}
                  >
                    <div
                      className={`h-40 rounded-2xl bg-gradient-to-br ${panel.gradient}`}
                    />
                    <p className="mt-4 text-sm font-semibold">{panel.label}</p>
                  </button>
                );
              })}
            </div>

            {calibrationPicked && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                  Why this choice? (optional)
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {rationaleChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setCalibrationReason(chip);
                        handleCalibrationAdvance(chip);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        calibrationReason === chip
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                          : "border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCalibrationAdvance(null)}
                    className="rounded-full border border-[color:var(--charcoal)]/20 px-3 py-1 text-xs text-[color:var(--charcoal)]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {!calibrationPicked && (
              <p className="mt-6 text-xs text-[color:var(--grey)]">
                Pick a side to continue.
              </p>
            )}
          </div>
        </section>
      )}

      {step === "negative" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <h2 className="font-display text-4xl">Quality guardrails.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              Tell us what to avoid in your outputs.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {negativeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setNegativeSelection(option.id)}
                  className={`rounded-[24px] border px-5 py-4 text-left transition ${
                    negativeSelection === option.id
                      ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                      : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                </button>
              ))}
            </div>
            {negativeSelection === "other" && (
              <input
                value={negativeOther}
                onChange={(event) => setNegativeOther(event.target.value)}
                className="mt-4 w-full rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm"
                placeholder="Tell us what to avoid"
              />
            )}
            {negativeError && (
              <p className="mt-4 text-xs text-red-400">{negativeError}</p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleNegativeContinue}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "variants" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <h2 className="font-display text-4xl">Pick the best result.</h2>
            <p className="mt-2 text-sm text-[color:var(--grey)]">
              We generated four options from your calibration. Choose the winner.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {variantOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedVariant(option.id)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    selectedVariant === option.id
                      ? "border-[color:var(--orange)] shadow-[0_18px_30px_rgba(232,153,104,0.2)]"
                      : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                  }`}
                >
                  <div
                    className={`h-32 rounded-2xl bg-gradient-to-br ${option.gradient}`}
                  />
                  <p className="mt-3 text-sm font-semibold">{option.label}</p>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--grey)]">
                What is wrong with the others? (optional)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {failureChips.map((chip) => {
                  const isActive = variantNotes.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setVariantNotes((prev) =>
                          isActive
                            ? prev.filter((item) => item !== chip)
                            : [...prev, chip],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        isActive
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                          : "border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {variantError && (
              <p className="mt-4 text-xs text-red-400">{variantError}</p>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={handleVariantContinue}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "edit" && (
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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[color:var(--orange)]/20 px-3 py-1 text-xs font-semibold">
                  Edit triplet
                </span>
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
            </aside>

            <div className="rounded-3xl border border-[color:var(--charcoal)]/10 bg-white p-6">
              <div className="mb-6 rounded-2xl border border-[color:var(--charcoal)]/10 bg-[color:var(--white)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                  Selected variant
                </p>
                <div className="mt-4 h-44 rounded-2xl bg-gradient-to-br from-[#111827] via-[#7c3aed] to-[#f97316]" />
              </div>

              <div className="rounded-2xl border border-[color:var(--charcoal)]/15 bg-[color:var(--white)] p-4">
                <p className="text-xs font-semibold text-[color:var(--charcoal)]">
                  Not quite right? Choose a quick edit.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {editIntents.map((intentOption) => (
                    <button
                      key={intentOption}
                      type="button"
                      onClick={() => {
                        setEditIntent(intentOption);
                        setEditText(intentOption);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        editIntent === intentOption
                          ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                          : "border-[color:var(--charcoal)]/20 text-[color:var(--charcoal)]"
                      }`}
                    >
                      {intentOption}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[color:var(--grey)]">
                  Or tell us what to change.
                </p>
                <input
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                  className="mt-2 w-full border-none bg-transparent text-sm outline-none"
                  placeholder="Describe the edit you want..."
                />
                {editError && (
                  <p className="mt-2 text-xs text-red-400">{editError}</p>
                )}
                <button
                  type="button"
                  onClick={handleEditApply}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-5 py-2 text-xs font-semibold text-white"
                >
                  Apply edit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "collab" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                {phaseLabel}
              </div>
            )}
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--orange)]/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-3xl">Invite a teammate.</h2>
                  <p className="text-sm text-[color:var(--grey)]">
                    Unlock shared asset libraries and version history.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <input
                  value={inviteInput}
                  onChange={(event) => setInviteInput(event.target.value)}
                  className="flex-1 rounded-xl border border-[color:var(--charcoal)]/20 bg-white px-4 py-3 text-sm"
                  placeholder="teammate@studio.com"
                />
                <button
                  type="button"
                  onClick={handleInviteSend}
                  className="rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-xs font-semibold text-white"
                >
                  Send invite
                </button>
              </div>
              {inviteError && (
                <p className="mt-2 text-xs text-red-400">{inviteError}</p>
              )}
              {inviteSent && (
                <p className="mt-2 text-xs text-emerald-500">Invite sent.</p>
              )}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setStep("trial")}
                  className="text-xs font-semibold text-[color:var(--grey)]"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "trial" && (
        <section className="min-h-[100svh] bg-[#0f1115] px-6 py-16 text-white">
          <div className="mx-auto flex min-h-[100svh] max-w-xl flex-col items-center justify-center text-center">
            {phaseLabel && (
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                {phaseLabel}
              </div>
            )}
            <div className="w-full rounded-[28px] bg-white p-8 text-[color:var(--charcoal)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h3 className="font-display text-2xl">Start your 7-Day Pro Trial?</h3>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                You already dialed the look. Unlock 4K and advanced workflows.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--charcoal)]/15 bg-[color:var(--white)] p-4">
                  <p className="text-xs text-[color:var(--grey)]">Standard</p>
                  <div className="mt-3 h-24 rounded-xl bg-[color:var(--charcoal)]/10" />
                </div>
                <div className="rounded-2xl border border-[color:var(--orange)]/60 bg-[color:var(--orange)]/10 p-4">
                  <p className="text-xs text-[color:var(--grey)]">4K Upscaled</p>
                  <div className="mt-3 h-24 rounded-xl bg-gradient-to-br from-white to-[color:var(--orange)]/30" />
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-[color:var(--charcoal)]">
                {[
                  "Unlimited 4K exports",
                  "Advanced AI workflows",
                  "Priority rendering",
                  "Team-ready approvals",
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
                  onClick={() => {
                    setTrialChoice("trial");
                    setStep("done");
                  }}
                  className="rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Start Free Trial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrialChoice("free");
                    setStep("done");
                  }}
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
        </section>
      )}

      {step === "done" && (
        <section className="min-h-[100svh] px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="rounded-[32px] border border-[color:var(--charcoal)]/15 bg-white p-10 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
                Onboarding complete
              </p>
              <h2 className="font-display mt-4 text-3xl">Your studio is ready.</h2>
              <p className="mt-2 text-sm text-[color:var(--grey)]">
                {trialChoice === "trial"
                  ? "Pro trial is active. Your workspace is live."
                  : "Your workspace is live and ready for creation."}
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-3 text-sm font-semibold text-white"
              >
                Enter workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
