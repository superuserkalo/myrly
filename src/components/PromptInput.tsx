"use client";

type PromptInputProps = {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showEdgeHighlights?: boolean;
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
}: PromptInputProps) {
  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2 shadow-[0_12px_34px_rgba(0,0,0,0.45)] ${className}`}
    >
      {showEdgeHighlights && (
        <>
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-border/70 via-white/40 to-border/70" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-border/70 via-white/35 to-border/70" />
        </>
      )}
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-muted transition hover:text-white"
        aria-label="Add reference image"
        type="button"
      >
        <IconPlus className="h-5 w-5" />
      </button>
      <input
        className={`h-11 flex-1 bg-transparent px-2 text-base text-white placeholder:text-muted focus:outline-none sm:text-base ${inputClassName}`}
        placeholder={placeholder}
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
  );
}
