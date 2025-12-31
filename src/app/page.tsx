"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const headlineText = "Manifest Your Reality\u00A0";
const headlineChars = Array.from(headlineText);

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

const IconArrow = ({ className }: { className?: string }) => (
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
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
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
  const [typedIndex, setTypedIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setTypedIndex(headlineChars.length - 1);
      setTypingDone(true);
      return;
    }

    let index = 0;
    let timeoutId: number;
    const startDelay = 300;
    const stepDelay = 90;

    const step = () => {
      setTypedIndex(index);
      if (index >= headlineChars.length - 1) {
        setTypingDone(true);
        return;
      }
      index += 1;
      timeoutId = window.setTimeout(step, stepDelay);
    };

    timeoutId = window.setTimeout(step, startDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="relative flex min-h-[100svh] min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 -top-[200px] h-[520px] w-[90vw] max-w-3xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_rgba(15,23,42,0)_70%)] blur-[120px] sm:-top-[260px] sm:h-[600px]" />
      </div>

      <header
        className={`fixed left-0 right-0 top-0 z-30 w-full border-b transition-colors ${
          isScrolled
            ? "border-white/10 bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:py-5 md:px-8">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:text-white"
          >
            <span>Manifest</span>
            <span className="font-light text-muted">OS</span>
          </a>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            Upgrade
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pb-12 pt-20 md:px-8 sm:pb-16 sm:pt-24">
        <section className="w-full max-w-2xl text-center">
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="typewriter"
              aria-label={headlineText.trimEnd()}
            >
              {headlineChars.map((char, index) => {
                const isVisible = index <= typedIndex;
                const isCaret = index === typedIndex;
                return (
                  <span
                    key={`${char}-${index}`}
                    aria-hidden="true"
                    className={`typewriter-char ${
                      isVisible ? "is-visible" : "is-hidden"
                    } ${isCaret ? "is-caret" : ""} ${
                      isCaret && typingDone ? "is-caret-blink" : ""
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Describe your vision for 2026. Be specific.
          </p>
        </section>

        <div className="relative mt-8 w-full max-w-2xl">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/28 via-indigo-500/17 to-sky-500/23 blur-lg" />
          <div className="relative flex items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2 shadow-[0_12px_34px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-border/70 via-white/40 to-border/70" />
            <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-border/70 via-white/35 to-border/70" />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-muted transition hover:text-white"
              aria-label="Add reference image"
              type="button"
            >
              <IconPlus className="h-5 w-5" />
            </button>
            <input
              className="h-11 flex-1 bg-transparent px-2 text-sm text-white placeholder:text-muted focus:outline-none sm:text-base"
              placeholder="Describe your dream life to generate your vision board..."
              type="text"
              aria-label="Describe your vision"
            />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Generate mood board"
              type="button"
            >
              <IconArrow className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex w-full max-w-2xl justify-center text-center">
          <a
            href="/quiz"
            className="text-xs font-semibold text-blue-400 underline underline-offset-4 transition hover:text-blue-300 sm:rounded-full sm:border sm:border-blue-400/40 sm:bg-white/5 sm:px-4 sm:py-2 sm:text-sm sm:no-underline sm:hover:border-blue-300/70 sm:hover:bg-white/10"
          >
            Not sure what to type? Take Quiz to Visualize your New Self.
          </a>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-6 sm:mt-12 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          <section className="lg:col-span-4 flex flex-col items-center text-center">
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
                          ? "border-white/45 bg-white/15 text-white"
                          : "border-border bg-surface text-muted group-hover:border-zinc-500 group-hover:bg-surface-strong group-hover:text-white"
                      }`}
                    >
                      <IconLayout
                        variant={option.icon as "single" | "grid" | "collage" | "bento"}
                        className="h-6 w-6"
                      />
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        isActive ? "text-white" : "text-muted group-hover:text-white"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-4 flex flex-col items-center text-center">
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
                          ? "bg-white/15 text-white"
                          : "text-muted hover:bg-white/5 hover:text-white"
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
                          ? "border-primary/60 text-white"
                          : "text-muted hover:border-white/20 hover:text-white"
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
                                isSelected ? "sm:scale-100 sm:opacity-100" : ""
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

          <section className="lg:col-span-4 flex flex-col items-center text-center">
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
                        ? "border-white/45 bg-white/15 text-white"
                        : "border-border bg-surface text-muted hover:border-zinc-500 hover:bg-surface-strong hover:text-white"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Add aesthetic style"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-muted transition hover:border-zinc-500 hover:text-white"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <section className="mt-12 w-full max-w-4xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              From the Community
            </h2>
            <a
              href="#"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
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
            <div className="w-full max-w-xs sm:max-w-sm">
              <Image
                src="/community/manifestos-1767066386371.png"
                alt="Pinterest editorial vision board"
                width={1000}
                height={1778}
                className="h-auto w-full rounded-3xl border border-white/10 object-cover shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                sizes="(max-width: 640px) 80vw, 320px"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-white/5 bg-black/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs text-white/40 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
          <p>© 2026 Manifest OS. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <a className="transition hover:text-white" href="#">
              Impressum
            </a>
            <a className="transition hover:text-white" href="/privacy">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="/cookies">
              Cookies
            </a>
            <a className="transition hover:text-white" href="#">
              Refund
            </a>
            <a className="transition hover:text-white" href="#">
              Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
