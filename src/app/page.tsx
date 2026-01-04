"use client";

import { useEffect, useRef, useState } from "react";
import PromptInput from "@/components/PromptInput";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const headlinePrefix = "Manifest Your";
const headlineWords = ["Palette", "Ideas", "Interior", "Vision"];
const promptDemoText = "Warm earth tones...";
const maxHeadlineWordLength =
  Math.max(...headlineWords.map((word) => word.length)) + 1;
const isFeatureEnabled = (value?: string) => value === "true" || value === "1";
const settingsFeatureFlags = {
  layout: isFeatureEnabled(process.env.NEXT_PUBLIC_SHOW_LAYOUT_STRUCTURE),
  aspectRatio: isFeatureEnabled(process.env.NEXT_PUBLIC_SHOW_ASPECT_RATIO),
  aestheticStyle: isFeatureEnabled(
    process.env.NEXT_PUBLIC_SHOW_AESTHETIC_STYLE,
  ),
};

const layoutOptions = [
  { label: "Single", icon: "single", active: false },
  { label: "Grid", icon: "grid", active: true },
  { label: "Collage", icon: "collage", active: false },
  { label: "Bento", icon: "bento", active: false },
];

const aspectRatios = [
  { label: "9:16", active: true },
  { label: "3:4", active: false },
  { label: "1:1", active: false },
];

const palettePresets = [
  {
    id: "minimal",
    name: "Minimal",
    colors: ["#1C1C1C", "#3A3A3A", "#6B6B6B", "#B0B0B0", "#F2F2F2"],
  },
  {
    id: "earthy",
    name: "Earthy",
    colors: ["#3B2F2F", "#6B4F3F", "#9C6B43", "#C89B70", "#F0D8B1"],
  },
  {
    id: "retro",
    name: "Retro",
    colors: ["#1E40AF", "#F43F5E", "#F59E0B", "#22C55E", "#60A5FA"],
  },
  {
    id: "neon",
    name: "Neon",
    colors: ["#8B5CF6", "#EC4899", "#22D3EE", "#38BDF8", "#0EA5E9"],
  },
];

const getLuminance = (hex: string) => {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) {
    return 0;
  }
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const sortByLuminance = (colors: string[]) =>
  [...colors].sort((a, b) => getLuminance(a) - getLuminance(b));

const aestheticStyles = [
  { label: "Pinterest", active: true },
  { label: "Old Money" },
  { label: "Dreamcore" },
  { label: "Indie Sleaze" },
  { label: "Y2K" },
  { label: "Cyberpunk" },
  { label: "Ethereal" },
  { label: "Grunge" },
];

const IconPlus = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const IconLayout = ({
  className,
  variant,
}: {
  className?: string;
  variant: "single" | "grid" | "collage" | "bento";
}) => {
  if (variant === "single") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 12h16" />
      </svg>
    );
  }
  if (variant === "grid") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (variant === "collage") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="9" height="7" rx="1.2" />
        <rect x="15" y="4" width="5" height="12" rx="1.2" />
        <rect x="4" y="13" width="9" height="7" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="8" height="16" rx="1.4" />
      <rect x="14" y="4" width="6" height="7" rx="1.4" />
      <rect x="14" y="13" width="6" height="7" rx="1.4" />
    </svg>
  );
};

export default function Home() {
  const [layoutSelection, setLayoutSelection] = useState("");
  const [aspectSelection, setAspectSelection] = useState("");
  const [paletteSelection, setPaletteSelection] = useState("");
  const [styleSelection, setStyleSelection] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [typingPhase, setTypingPhase] = useState<
    "typing" | "pausing" | "deleting"
  >("typing");
  const [introComplete, setIntroComplete] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [freezeTypewriter, setFreezeTypewriter] = useState(false);
  const [heroStep, setHeroStep] = useState<
    "header" | "input" | "clicking" | "loading" | "result"
  >("header");
  const [promptValue, setPromptValue] = useState("");
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const hasStartedHeroRef = useRef(false);
  const activeWord = headlineWords[currentWordIndex];
  const activeWordChars = Array.from(`${activeWord} `);
  const prefixChars = Array.from(`${headlinePrefix} `);
  const introLength = prefixChars.length + activeWordChars.length;
  const maxHeadlineLength =
    headlinePrefix.length + 1 + maxHeadlineWordLength;
const settingsCount = Object.values(settingsFeatureFlags).filter(Boolean)
  .length;
  const settingsSpanClass =
    settingsCount === 1
      ? "lg:col-span-12"
      : settingsCount === 2
        ? "lg:col-span-6"
        : "lg:col-span-4";
  const safeTypedIndex = Math.min(
    typedIndex,
    Math.max(activeWordChars.length - 1, 0),
  );
  const headlineLabel = `${headlinePrefix} ${activeWord}`;
  const shouldBlink =
    !reduceMotion &&
    typingPhase === "pausing" &&
    (introComplete
      ? safeTypedIndex === activeWordChars.length - 1
      : typedIndex === introLength - 1);
  const caretIndex = introComplete
    ? prefixChars.length + safeTypedIndex
    : typedIndex;
  const isSequenceActive =
    heroStep === "input" || heroStep === "clicking" || heroStep === "loading";
  const isCursorClicking = heroStep === "clicking";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setReduceMotion(true);
      setTypedIndex(headlineWords[0].length);
      setTypingPhase("pausing");
      setIntroComplete(true);
    }
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    if (freezeTypewriter) {
      return;
    }

    let timeoutId: number | undefined;
    const typeDelay = 90;
    const deleteDelay = 50;
    const pauseDelay = 900;
    const endDelay = 500;

    if (!introComplete) {
      if (typedIndex < introLength - 1) {
        timeoutId = window.setTimeout(() => {
          setTypedIndex((prev) => prev + 1);
        }, typeDelay);
      } else {
        timeoutId = window.setTimeout(() => {
          setIntroComplete(true);
          setTypingPhase("pausing");
          setTypedIndex(activeWordChars.length - 1);
        }, endDelay);
      }
    } else if (typingPhase === "typing") {
      if (typedIndex < activeWordChars.length - 1) {
        timeoutId = window.setTimeout(() => {
          setTypedIndex((prev) => prev + 1);
        }, typeDelay);
      } else {
        timeoutId = window.setTimeout(() => {
          setTypingPhase("pausing");
        }, endDelay);
      }
    } else if (typingPhase === "pausing") {
      timeoutId = window.setTimeout(() => {
        setTypingPhase("deleting");
      }, pauseDelay);
    } else if (typingPhase === "deleting") {
      if (typedIndex > 0) {
        timeoutId = window.setTimeout(() => {
          setTypedIndex((prev) => prev - 1);
        }, deleteDelay);
      } else {
        timeoutId = window.setTimeout(() => {
          setCurrentWordIndex(
            (prev) => (prev + 1) % headlineWords.length,
          );
          setTypingPhase("typing");
        }, 180);
      }
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    activeWordChars.length,
    introComplete,
    introLength,
    reduceMotion,
    typedIndex,
    typingPhase,
    freezeTypewriter,
  ]);

  useEffect(() => {
    if (hasStartedHeroRef.current) {
      return;
    }
    if (!introComplete || typingPhase !== "pausing") {
      return;
    }
    if (currentWordIndex !== 0) {
      return;
    }
    hasStartedHeroRef.current = true;
    setFreezeTypewriter(true);
    setHeroStep("input");
  }, [currentWordIndex, introComplete, typingPhase]);

  useEffect(() => {
    if (heroStep !== "input") {
      return;
    }
    let index = 0;
    setPromptValue("");
    const intervalId = window.setInterval(() => {
      index += 1;
      setPromptValue(promptDemoText.slice(0, index));
      if (index >= promptDemoText.length) {
        window.clearInterval(intervalId);
        setHeroStep("clicking");
      }
    }, 55);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroStep]);

  useEffect(() => {
    if (heroStep !== "clicking") {
      return;
    }
    const clickTimer = window.setTimeout(() => {
      setHeroStep("loading");
    }, 350);
    return () => {
      window.clearTimeout(clickTimer);
    };
  }, [heroStep]);

  useEffect(() => {
    if (heroStep !== "loading") {
      return;
    }
    setIsPromptLoading(true);
    const loadingTimer = window.setTimeout(() => {
      setIsPromptLoading(false);
      setFreezeTypewriter(false);
      setHeroStep("result");
    }, 2000);
    return () => {
      window.clearTimeout(loadingTimer);
    };
  }, [heroStep]);


  return (
    <div className="relative flex min-h-[100svh] min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0" />

      <SiteHeader />

      <main className="relative z-10 flex w-full flex-1 flex-col items-center">
        <section className="relative flex w-full flex-1 flex-col items-center min-h-[100svh]">
          <div className="flex w-full flex-1 flex-col items-center justify-center px-6 pb-10 pt-24 sm:px-8 sm:pb-14 sm:pt-28 lg:items-start lg:justify-start lg:px-12 lg:pt-40">
            <div className="w-full max-w-2xl lg:ml-0 lg:mr-auto">
              <div className="w-full text-center pt-2 sm:pt-0 lg:text-left">
                <h1
                  className="font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                  aria-label={headlineLabel}
                >
                  <span aria-hidden="true">
                    <span
                      className="typewriter justify-center text-[color:var(--charcoal)] lg:justify-start"
                      style={{ minWidth: `${maxHeadlineLength}ch` }}
                      aria-hidden="true"
                    >
                      {prefixChars.map((char, index) => {
                        const isVisible = introComplete || index <= typedIndex;
                        const isCaret = caretIndex === index;
                        return (
                          <span
                            key={`prefix-${char}-${index}`}
                            className={`typewriter-char ${
                              isVisible ? "is-visible" : "is-hidden"
                            } ${isCaret ? "is-caret" : ""} ${
                              isCaret && shouldBlink ? "is-caret-blink" : ""
                            }`}
                          >
                            {char}
                          </span>
                        );
                      })}
                      {activeWordChars.map((char, index) => {
                        const globalIndex = prefixChars.length + index;
                        const isVisible = introComplete
                          ? index <= safeTypedIndex
                          : globalIndex <= typedIndex;
                        const isCaret = caretIndex === globalIndex;
                        return (
                          <span
                            key={`word-${char}-${index}`}
                            className={`typewriter-char text-[color:var(--orange)] ${
                              isVisible ? "is-visible" : "is-hidden"
                            } ${isCaret ? "is-caret" : ""} ${
                              isCaret && shouldBlink ? "is-caret-blink" : ""
                            }`}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  </span>
                </h1>
                <p className="mt-3 text-sm text-muted sm:text-base">
                  Mooody is your creative partner to explore and unleash creativity
                </p>
              </div>

              <div className="relative mt-8 w-full">
                <PromptInput
                  showEdgeHighlights
                  showShadow={false}
                  loadingOnSubmit
                  value={promptValue}
                  onValueChange={setPromptValue}
                  readOnly={isSequenceActive}
                  loadingOverride={isPromptLoading ? true : undefined}
                  submitHoverOverride
                />
                <div
                  className={`pointer-events-none absolute bottom-2 right-2 ${
                    isCursorClicking ? "cursor-click" : ""
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                      <path
                        d="M6.5 11.5V6.2c0-.9.7-1.7 1.7-1.7.9 0 1.7.8 1.7 1.7v4.1h.4V4.8c0-.9.7-1.7 1.7-1.7.9 0 1.7.8 1.7 1.7v5.5h.4V6.2c0-.9.7-1.7 1.7-1.7.9 0 1.7.8 1.7 1.7v6.4c0 3.3-1.9 5.9-5.5 5.9H11c-2.4 0-4.5-1.5-5.2-3.8l-1.1-3.6c-.2-.6.2-1.2.8-1.4.6-.2 1.3.1 1.6.7l.4 1.1z"
                        fill="#ffffff"
                        stroke="#111111"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
              </div>

            </div>
          </div>

          <div
            className={`pointer-events-none absolute inset-0 hidden items-center justify-end pr-6 transition-opacity duration-700 lg:flex lg:pr-12 ${
              heroStep === "result" ? "opacity-100" : "opacity-0"
            }`}
          >
            {heroStep === "result" && (
              <video
                className="h-auto w-[min(520px,38vw)] rounded-3xl"
                src="/palette-results.mp4"
                autoPlay
                muted
                playsInline
              />
            )}
          </div>

          {settingsCount > 0 && (
            <div className="mt-10 w-full px-5 sm:px-8">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:mt-12 sm:gap-10 lg:grid-cols-12 lg:gap-12">
              {settingsFeatureFlags.layout && (
                <section
                  className={`${settingsSpanClass} flex flex-col items-center text-center`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Layout Structure
                  </p>
                  <div className="mt-3 flex w-full max-w-full justify-center gap-2 overflow-x-auto pb-1 sm:mt-4 sm:grid sm:max-w-[220px] sm:grid-cols-2 sm:gap-x-1 sm:gap-y-3 sm:overflow-visible sm:pb-0">
                    {layoutOptions.map((option) => {
                      const isActive = layoutSelection === option.label;
                      return (
                        <button
                          key={option.label}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() =>
                            setLayoutSelection((prev) =>
                              prev === option.label ? "" : option.label,
                            )
                          }
                          className="group flex shrink-0 flex-col items-center gap-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-2"
                        >
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                              isActive
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border bg-surface text-muted group-hover:border-slate-400 group-hover:bg-surface-strong group-hover:text-foreground"
                            }`}
                          >
                            <IconLayout
                              variant={
                                option.icon as
                                  | "single"
                                  | "grid"
                                  | "collage"
                                  | "bento"
                              }
                              className="h-6 w-6"
                            />
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              isActive
                                ? "text-primary"
                                : "text-muted group-hover:text-foreground"
                            }`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

            {settingsFeatureFlags.aspectRatio && (
              <section
                className={`${settingsSpanClass} flex flex-col items-center text-center`}
              >
                <div className="w-full max-w-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Aspect Ratio
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface p-1 sm:mt-4">
                    {aspectRatios.map((ratio) => {
                      const isActive = aspectSelection === ratio.label;
                      return (
                        <button
                          key={ratio.label}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() =>
                            setAspectSelection((prev) =>
                              prev === ratio.label ? "" : ratio.label,
                            )
                          }
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted hover:bg-black/5 hover:text-foreground"
                          }`}
                        >
                          {ratio.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 w-full max-w-md sm:mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                    Color Palette
                  </p>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3 sm:overflow-visible sm:pb-0">
                    {palettePresets.map((palette) => {
                      const isSelected = paletteSelection === palette.id;
                      const sortedColors = sortByLuminance(palette.colors);
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setPaletteSelection((prev) =>
                              prev === palette.id ? "" : palette.id,
                            )
                          }
                          className={`group relative flex w-[160px] shrink-0 items-center justify-center border-b border-transparent pb-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 focus-visible:outline-offset-2 sm:w-full sm:shrink ${
                            isSelected
                              ? "border-primary/60 text-primary"
                              : "text-muted hover:border-slate-300 hover:text-foreground"
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-3 sm:relative sm:justify-center sm:gap-0">
                            <div
                              className={`flex -space-x-1.5 transition-all duration-300 sm:absolute sm:right-0 sm:max-w-0 sm:translate-x-3 sm:overflow-hidden sm:opacity-0 sm:group-hover:max-w-[140px] sm:group-hover:translate-x-0 sm:group-hover:opacity-100 ${
                                isSelected
                                  ? "sm:max-w-[140px] sm:translate-x-0 sm:opacity-100"
                                  : ""
                              }`}
                            >
                              {sortedColors.map((color, index) => (
                                <span
                                  key={`${palette.id}-dot-${index}`}
                                  className={`inline-block h-5 w-5 shrink-0 rounded-full border border-black/40 transition-all duration-300 sm:scale-90 sm:opacity-0 sm:group-hover:scale-100 sm:group-hover:opacity-100 ${
                                    isSelected
                                      ? "sm:scale-100 sm:opacity-100"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor: color,
                                    transitionDelay: `${index * 60}ms`,
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-sm font-semibold transition-transform sm:group-hover:-translate-x-6 ${
                                isSelected ? "sm:-translate-x-6" : ""
                              }`}
                            >
                              {palette.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

              {settingsFeatureFlags.aestheticStyle && (
                <section
                  className={`${settingsSpanClass} flex flex-col items-center text-center`}
                >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                  Aesthetic Style
                </p>
                <div className="mt-3 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:mt-4 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
                  {aestheticStyles.map((style) => {
                    const isActive = styleSelection === style.label;
                    return (
                      <button
                        key={style.label}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() =>
                          setStyleSelection((prev) =>
                            prev === style.label ? "" : style.label,
                          )
                        }
                        className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-surface text-muted hover:border-slate-400 hover:bg-surface-strong hover:text-foreground"
                        }`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-label="Add aesthetic style"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-muted transition hover:border-slate-400 hover:text-foreground"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}
              </div>
            </div>
          )}
        </section>

        <section id="community" className="mt-12 w-full px-5 sm:px-8">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                From the Community
              </h2>
              <a
                href="#"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground"
              >
                Browse All
                <span className="text-base transition group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </div>
            <p className="mt-1 text-sm text-muted">
              Explore what people are manifesting for 2026.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-xs sm:max-w-sm" />
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
