"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const corePillars = [
  {
    id: "Career & Purpose",
    title: "Career & Purpose",
    description: "Meaningful work, milestones, or starting a venture.",
  },
  {
    id: "Lifestyle & Environment",
    title: "Lifestyle & Environment",
    description: "Upgrading your space, routines, and daily rhythm.",
  },
  {
    id: "Health & Wellness",
    title: "Health & Wellness",
    description: "Fitness, clarity, and holistic well-being.",
  },
  {
    id: "Relationship & Social",
    title: "Relationship & Social",
    description: "Deepening connections, community, or attracting a partner.",
  },
];

const shadowWorkOptions = [
  {
    id: "Procrastination / Burnout",
    title: "Procrastination / Burnout",
    description:
      "Antidote: minimalist space, zen organization, peaceful atmosphere.",
  },
  {
    id: "Imposter Syndrome",
    title: "Imposter Syndrome",
    description:
      "Antidote: awards on shelf, podium cues, confident posture.",
  },
  {
    id: "Fear of Failure",
    title: "Fear of Failure",
    description: "Antidote: action cues, progress boards, steady momentum.",
  },
  {
    id: "Overwhelmed",
    title: "Overwhelmed",
    description: "Antidote: clear priorities, clean surfaces, calm light.",
  },
  {
    id: "Self-Doubt",
    title: "Self-Doubt",
    description: "Antidote: reflective mirror cues, affirmations, grounded stance.",
  },
  {
    id: "Comparison Trap",
    title: "Comparison Trap",
    description: "Antidote: personal milestones, focus anchors, muted noise.",
  },
];

const emotionalGoals = [
  {
    id: "Peace",
    title: "Peace",
    description: "Soft focus, pastel palette, airy composition.",
  },
  {
    id: "Excitement",
    title: "Excitement",
    description: "Bold energy, motion blur, saturated lighting.",
  },
  {
    id: "Power",
    title: "Power",
    description: "High contrast, dramatic shadows, low angle.",
  },
  {
    id: "Safety",
    title: "Safety",
    description: "Warm light, grounded framing, calm tones.",
  },
  {
    id: "Joy",
    title: "Joy",
    description: "Bright highlights, playful color pops, open air.",
  },
  {
    id: "Confidence",
    title: "Confidence",
    description: "Crisp lighting, strong posture, polished textures.",
  },
];

const aestheticOptions = [
  {
    id: "Pinterest",
    label: "Pinterest",
    image: "https://placehold.co/480x320?text=Pinterest",
  },
  {
    id: "Minimal",
    label: "Minimal",
    image: "https://placehold.co/480x320?text=Minimal",
  },
  {
    id: "Old Money",
    label: "Old Money",
    image: "https://placehold.co/480x320?text=Old+Money",
  },
  {
    id: "Quiet Luxury",
    label: "Quiet Luxury",
    image: "https://placehold.co/480x320?text=Quiet+Luxury",
  },
  {
    id: "Dreamcore",
    label: "Dreamcore",
    image: "https://placehold.co/480x320?text=Dreamcore",
  },
  {
    id: "Indie Sleaze",
    label: "Indie Sleaze",
    image: "https://placehold.co/480x320?text=Indie+Sleaze",
  },
  {
    id: "Dark Academia",
    label: "Dark Academia",
    image: "https://placehold.co/480x320?text=Dark+Academia",
  },
  {
    id: "Y2K",
    label: "Y2K",
    image: "https://placehold.co/480x320?text=Y2K",
  },
  {
    id: "Cyberpunk",
    label: "Cyberpunk",
    image: "https://placehold.co/480x320?text=Cyberpunk",
  },
  {
    id: "Cottagecore",
    label: "Cottagecore",
    image: "https://placehold.co/480x320?text=Cottagecore",
  },
  {
    id: "Ethereal",
    label: "Ethereal",
    image: "https://placehold.co/480x320?text=Ethereal",
  },
  {
    id: "Grunge",
    label: "Grunge",
    image: "https://placehold.co/480x320?text=Grunge",
  },
  {
    id: "Coastal",
    label: "Coastal",
    image: "https://placehold.co/480x320?text=Coastal",
  },
  {
    id: "Modern Luxe",
    label: "Modern Luxe",
    image: "https://placehold.co/480x320?text=Modern+Luxe",
  },
];

const wealthOptions = [
  {
    id: "Time Freedom",
    title: "Time Freedom",
    description: "Empty calendar, hammock, sunset view.",
  },
  {
    id: "Material",
    title: "Material",
    description: "Designer bags, sports car keys, luxury watch.",
  },
  {
    id: "Experiences",
    title: "Experiences",
    description: "Passport stamps, shared dinners, unforgettable trips.",
  },
  {
    id: "Impact",
    title: "Impact",
    description: "Giving moments, community wins, legacy cues.",
  },
];

const inventoryOptions = [
  "Stack of Cash",
  "Passport",
  "Matcha",
  "Espresso",
  "Luxury Watch",
  "Sports Car Keys",
  "Designer Bag",
  "Fresh Flowers",
  "Books",
  "Champagne",
  "Camera",
  "Laptop",
  "Meditation Cushion",
  "Plane Ticket",
  "Vision Board",
  "Journal",
  "Skincare Set",
  "Noise Canceling Headphones",
  "Guitar",
  "Yoga Mat",
  "City Map",
  "Boarding Pass",
  "Sun Hat",
  "Sneakers",
  "Art Print",
  "Laptop Stickers",
  "Gourmet Coffee",
  "Vinyl Record",
  "Sketchbook",
  "House Keys",
  "Plant",
  "Gold Pen",
  "Suitcase",
  "Silk Robe",
  "Travel Journal",
  "Perfume",
  "Sunglasses",
  "Film Camera",
  "Headphones",
  "Tennis Racket",
  "Coffee Cup",
  "Makeup Bag",
  "Ring",
  "Planner",
];

const povOptions = [
  {
    id: "First Person",
    title: "First Person",
    description: "I am living this (hands in frame).",
  },
  {
    id: "Cinematic",
    title: "Cinematic",
    description: "I am watching this (wide shot).",
  },
];

type Selections = {
  calibration: {
    firstName: string;
    lastName: string;
    gender: string;
    birthday: string;
  };
  corePillars: string[];
  shadowWork: string;
  emotionalGoal: string;
  aesthetic: string[];
  wealthDefinition: string[];
  inventory: string[];
  pov: string;
  affirmation: string;
  email: string;
};

const synthesisMessages = [
  "Analyzing Cosmic Profile (Fire Element)...",
  "Integrating Shadow Work (Clearing Burnout)...",
  "Aligning 2026 Reality...",
  "Manifestation Complete.",
];

const totalSteps = 9;

export default function ManifestationQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<"quiz" | "synthesis" | "reveal" | "offer">(
    "quiz"
  );
  const [synthesisIndex, setSynthesisIndex] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [selections, setSelections] = useState<Selections>({
    calibration: {
      firstName: "",
      lastName: "",
      gender: "",
      birthday: "",
    },
    corePillars: [],
    shadowWork: "",
    emotionalGoal: "",
    aesthetic: [],
    wealthDefinition: [],
    inventory: [],
    pov: "",
    affirmation: "",
    email: "",
  });

  const maxBirthDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear() - 14;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isValidBirthday =
    selections.calibration.birthday.length === 0 ||
    selections.calibration.birthday <= maxBirthDate;

  const toggleMulti = (
    key: "corePillars" | "aesthetic" | "inventory" | "wealthDefinition",
    value: string,
    max: number
  ) => {
    setSelections((prev) => {
      const list = prev[key] as string[];
      if (list.includes(value)) {
        return { ...prev, [key]: list.filter((item) => item !== value) };
      }
      if (list.length >= max) {
        return prev;
      }
      return { ...prev, [key]: [...list, value] };
    });
  };

  const toggleSingle = (
    key: "shadowWork" | "emotionalGoal" | "pov",
    value: string
  ) => {
    setSelections((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  };

  const isValidEmail = selections.email.trim().includes("@");

  const stepValidations = [
    selections.calibration.firstName.trim().length > 0 &&
      selections.calibration.lastName.trim().length > 0 &&
      selections.calibration.gender.trim().length > 0 &&
      selections.calibration.birthday.trim().length > 0 &&
      isValidBirthday,
    selections.corePillars.length > 0,
    selections.shadowWork.length > 0,
    selections.emotionalGoal.length > 0,
    selections.aesthetic.length > 0,
    selections.wealthDefinition.length > 0,
    selections.inventory.length > 0,
    selections.pov.length > 0,
    true,
  ];

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const canNext = stepValidations[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (!canNext) {
      return;
    }
    if (isLastStep) {
      setPhase("synthesis");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleAdjustVibe = () => {
    setPhase("quiz");
    setCurrentStep(4);
  };

  const handleUnlock = () => {
    if (!isValidEmail) {
      return;
    }
    setShowGate(false);
    setPhase("offer");
  };

  useEffect(() => {
    if (phase !== "synthesis") {
      return;
    }
    setSynthesisIndex(0);
    const interval = setInterval(() => {
      setSynthesisIndex((prev) =>
        prev < synthesisMessages.length - 1 ? prev + 1 : prev
      );
    }, 1400);
    const timeout = setTimeout(() => {
      setPhase("reveal");
    }, 5200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase]);

  if (phase === "synthesis") {
    return (
      <div className="relative min-h-[100svh] bg-black text-foreground">
        <div className="flex min-h-[100svh] items-center justify-center px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Synthesizing
            </p>
            <h1
              key={synthesisIndex}
              className="mt-4 text-xl font-semibold text-white/90 drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] animate-pulse sm:text-2xl"
            >
              {synthesisMessages[synthesisIndex]}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -top-[200px] h-[520px] w-[90vw] max-w-3xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_rgba(15,23,42,0)_70%)] blur-[120px] sm:-top-[260px] sm:h-[600px]" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-30 w-full border-b border-transparent bg-transparent">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            <span className="text-white">Manifest</span>
            <span className="font-light text-muted">OS</span>
          </a>
          <a
            href="/"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/20 hover:text-white"
          >
            Exit Quiz ✕
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col justify-center px-5 pb-16 pt-24 md:px-8 md:pt-6">
        {phase === "quiz" && (
          <>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Go back"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/70 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-8">
              {currentStep === 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 0/9
                  </p>
                  <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                    Avatar Calibration
                  </h1>
                  <p className="mt-2 text-sm text-muted sm:text-base">
                    First, let&apos;s calibrate your visualization.
                  </p>

                  <form className="mt-8 grid gap-7">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                        Who is manifesting?
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="first-name"
                            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted"
                          >
                            First name
                            <span className="ml-1 text-white/70">*</span>
                          </label>
                          <input
                            id="first-name"
                            required
                            value={selections.calibration.firstName}
                            onChange={(event) =>
                              setSelections((prev) => ({
                                ...prev,
                                calibration: {
                                  ...prev.calibration,
                                  firstName: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                            placeholder="First name"
                            type="text"
                            autoComplete="given-name"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="last-name"
                            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted"
                          >
                            Last name
                            <span className="ml-1 text-white/70">*</span>
                          </label>
                          <input
                            id="last-name"
                            required
                            value={selections.calibration.lastName}
                            onChange={(event) =>
                              setSelections((prev) => ({
                                ...prev,
                                calibration: {
                                  ...prev.calibration,
                                  lastName: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                            placeholder="Last name"
                            type="text"
                            autoComplete="family-name"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mt-2 grid gap-3 sm:mt-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="gender"
                            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted"
                          >
                            Gender
                            <span className="ml-1 text-white/70">*</span>
                          </label>
                          <div className="relative mt-2">
                            <select
                              id="gender"
                              required
                              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                              value={selections.calibration.gender}
                              onChange={(event) =>
                                setSelections((prev) => ({
                                  ...prev,
                                  calibration: {
                                    ...prev.calibration,
                                    gender: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Select gender</option>
                              <option value="Man">Man</option>
                              <option value="Woman">Woman</option>
                              <option value="Non-Binary">Non-Binary</option>
                            </select>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted">
                              ▼
                            </span>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="birthday"
                            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted"
                          >
                            Birthday
                            <span className="ml-1 text-white/70">*</span>
                          </label>
                          <input
                            id="birthday"
                            required
                            value={selections.calibration.birthday}
                            onChange={(event) =>
                              setSelections((prev) => ({
                                ...prev,
                                calibration: {
                                  ...prev.calibration,
                                  birthday: event.target.value,
                                },
                              }))
                            }
                            max={maxBirthDate}
                            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                            placeholder="Birthday (MM / DD / YYYY)"
                            type="date"
                            autoComplete="bday"
                          />
                          {!isValidBirthday && (
                            <p className="mt-2 text-xs text-white/60">
                              You must be at least 14 years old.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 1/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    Which realities are you merging in 2026?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Select up to two core pillars.
                  </p>
                  <p className="mt-4 text-xs text-white/60">
                    {selections.corePillars.length}/2 Selected
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {corePillars.map((pillar) => {
                      const isSelected = selections.corePillars.includes(pillar.id);
                      return (
                        <button
                          key={pillar.id}
                          type="button"
                          onClick={() => toggleMulti("corePillars", pillar.id, 2)}
                          className={`group rounded-2xl border p-5 text-left transition ${
                            isSelected
                              ? "border-blue-400/70 bg-white/5 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                              : "border-border bg-surface hover:border-white/30"
                          }`}
                        >
                          <h3 className="text-base font-semibold">{pillar.title}</h3>
                          <p className="mt-2 text-sm text-muted">
                            {pillar.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 2/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    What are you clearing to move forward?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Choose the shadow work block.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {shadowWorkOptions.map((option) => {
                      const isSelected = selections.shadowWork === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleSingle("shadowWork", option.id)}
                          className={`rounded-2xl border p-5 text-left transition ${
                            isSelected
                              ? "border-white/60 bg-white/10"
                              : "border-border bg-surface hover:border-white/30"
                          }`}
                        >
                          <h3 className="text-base font-semibold">{option.title}</h3>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 3/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    How do you want to feel in 2026?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Set the emotional layer for the vision.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {emotionalGoals.map((goal) => {
                      const isSelected = selections.emotionalGoal === goal.id;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => toggleSingle("emotionalGoal", goal.id)}
                          className={`rounded-2xl border p-5 text-left transition ${
                            isSelected
                              ? "border-white/60 bg-white/10"
                              : "border-border bg-surface hover:border-white/30"
                          }`}
                        >
                          <h3 className="text-base font-semibold">{goal.title}</h3>
                          <p className="mt-2 text-sm text-muted">
                            {goal.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 4/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    What is the texture of your future?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Choose up to two aesthetics.
                  </p>
                  <p className="mt-4 text-xs text-white/60">
                    {selections.aesthetic.length}/2 Selected
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {aestheticOptions.map((option) => {
                      const isSelected = selections.aesthetic.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleMulti("aesthetic", option.id, 2)}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                            isSelected
                              ? "border-white/60 bg-white/10 text-white"
                              : "border-border bg-surface text-muted hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 5/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    How do you define wealth?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Choose up to two definitions.
                  </p>
                  <p className="mt-4 text-xs text-white/60">
                    {selections.wealthDefinition.length}/2 Selected
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {wealthOptions.map((option) => {
                      const isSelected = selections.wealthDefinition.includes(
                        option.id
                      );
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            toggleMulti("wealthDefinition", option.id, 2)
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            isSelected
                              ? "border-white/60 bg-white/10"
                              : "border-border bg-surface hover:border-white/30"
                          }`}
                        >
                          <h3 className="text-base font-semibold">{option.title}</h3>
                          <p className="mt-2 text-sm text-muted">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 6/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    What specific objects anchor your reality?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Select up to three items.
                  </p>
                  <p className="mt-4 text-xs text-white/60">
                    {selections.inventory.length}/3 Selected
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {inventoryOptions.map((item) => {
                      const isSelected = selections.inventory.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleMulti("inventory", item, 3)}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "border-blue-400/60 bg-white text-black shadow-[0_0_14px_rgba(59,130,246,0.3)]"
                              : "border-border bg-surface text-muted hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 7/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    How do you view this moment?
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Choose a point of view.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {povOptions.map((option) => {
                      const isSelected = selections.pov === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleSingle("pov", option.id)}
                          className={`flex h-full flex-col gap-2 rounded-2xl border p-5 text-left transition ${
                            isSelected
                              ? "border-white/45 bg-white/10"
                              : "border-border bg-surface hover:border-white/30"
                          }`}
                        >
                          <div>
                            <h3 className="text-base font-semibold">{option.title}</h3>
                            <p className="text-sm text-muted">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 8 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Step 8/9
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    One word to define your 2026.
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    Optional. We&apos;ll overlay this on your image later.
                  </p>
                  <p className="mt-2 text-xs text-white/60">
                    Tip: If you are religious, you can include a Bible verse or
                    other spiritual phrase here.
                  </p>
                  <div className="mt-6 max-w-md">
                    <label
                      htmlFor="affirmation"
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-muted"
                    >
                      Affirmation
                      <span className="ml-1 text-white/50">(optional)</span>
                    </label>
                    <input
                      id="affirmation"
                      value={selections.affirmation}
                      onChange={(event) =>
                        setSelections((prev) => ({
                          ...prev,
                          affirmation: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                      placeholder="Unstoppable"
                      type="text"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {phase === "reveal" && (
          <div className="mx-auto w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Manifestation Ready
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Your Vision, Compressed Preview
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Tap to claim the high-resolution pack.
            </p>
            <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-surface">
              <img
                src="https://placehold.co/1200x700"
                alt="Generated manifestation preview"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute bottom-5 right-6 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
                Manifest Your Reality
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={() => setShowGate(true)}
                className="flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(255,255,255,0.25)] transition hover:bg-zinc-200 animate-pulse"
              >
                Claim This Reality
              </button>
              <button
                type="button"
                onClick={handleAdjustVibe}
                className="flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Adjust Vibe
              </button>
            </div>
          </div>
        )}

        {phase === "offer" && (
          <div className="mx-auto w-full">
            <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Your 2026 is loading...
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Choose your manifestation pack.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-surface p-6">
                <img
                  src="https://placehold.co/800x500"
                  alt="Free manifestation preview"
                  className="w-full rounded-2xl object-cover"
                />
                <button
                  type="button"
                  className="mt-6 w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
                >
                  Download Free Image
                </button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Upgrade Pack</h3>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                    $4.99
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white" />
                    4K Upscaled Wallpaper (No Watermark)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white" />
                    Phone &amp; Desktop Crops
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white" />
                    Shadow Work Guide PDF
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_26px_rgba(255,255,255,0.25)] transition hover:bg-zinc-200"
                >
                  Unlock Full Pack ($4.99)
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "quiz" && (
          <div className="mt-12 flex items-center justify-center">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60 disabled:hover:bg-white/20"
            >
              {isLastStep ? "Generate Vision" : "Next"}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </main>

      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/80 p-6 text-left text-white backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Save to your History.
                </p>
                <p className="mt-2 text-sm text-white/70">
                  We&apos;ll send the high-res vision board and your Shadow Work
                  analysis to your inbox.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6">
              <label
                htmlFor="gate-email"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
              >
                Email Address
              </label>
              <input
                id="gate-email"
                value={selections.email}
                onChange={(event) =>
                  setSelections((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                placeholder="you@email.com"
                type="email"
                autoComplete="email"
              />
            </div>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={!isValidEmail}
              className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60 disabled:hover:bg-white/20"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
