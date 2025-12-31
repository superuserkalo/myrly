"use client";

import type { CSSProperties } from "react";

type PromptInputProps = {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showEdgeHighlights?: boolean;
  variant?: "default" | "light";
};

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

export default function PromptInput({
  placeholder = "Describe your dream life to generate your vision board...",
  className = "",
  inputClassName = "",
  showEdgeHighlights = false,
  variant = "default",
}: PromptInputProps) {
  const variantStyles =
    variant === "light"
      ? ({
          "--prompt-text": "#111827",
          "--prompt-muted": "rgba(17, 24, 39, 0.55)",
          "--prompt-button-bg": "rgba(15, 23, 42, 0.08)",
          "--prompt-button-soft": "rgba(15, 23, 42, 0.05)",
          "--prompt-button-hover": "rgba(15, 23, 42, 0.14)",
          "--prompt-surface": "#ffffff",
          "--prompt-border": "rgba(15, 23, 42, 0.18)",
          "--prompt-shadow": "0 12px 28px rgba(15, 23, 42, 0.15)",
        } as CSSProperties)
      : undefined;

  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl border border-[color:var(--prompt-border)] bg-[color:var(--prompt-surface)] p-2 shadow-[var(--prompt-shadow)] ${className}`}
      style={variantStyles}
    >
      {showEdgeHighlights && (
        <>
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-border/70 via-white/40 to-border/70" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-border/70 via-white/35 to-border/70" />
        </>
      )}
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-muted)] transition hover:text-[color:var(--prompt-text)]"
        aria-label="Add reference image"
        type="button"
      >
        <IconPlus className="h-5 w-5" />
      </button>
      <input
        className={`h-11 flex-1 bg-transparent px-2 text-base text-[color:var(--prompt-text)] placeholder:text-[color:var(--prompt-muted)] focus:outline-none sm:text-base ${inputClassName}`}
        placeholder={placeholder}
        type="text"
        aria-label="Describe your vision"
      />
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--prompt-button-bg)] text-[color:var(--prompt-text)] transition hover:bg-[color:var(--prompt-button-hover)]"
        aria-label="Generate mood board"
        type="button"
      >
        <IconArrow className="h-5 w-5" />
      </button>
    </div>
  );
}
