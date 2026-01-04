"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Pencil,
  X,
} from "lucide-react";

type PromptInputProps = {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showEdgeHighlights?: boolean;
  showShadow?: boolean;
  variant?: "default" | "light";
  showMic?: boolean;
  loadingOnSubmit?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  readOnly?: boolean;
  layout?: "single" | "stacked";
  loadingOverride?: boolean;
  submitHoverOverride?: boolean;
  onSubmit?: () => void;
  onFocusChange?: (focused: boolean) => void;
  modelOptions?: Array<{ id: string; label: string }>;
  selectedModel?: string;
  onSelectModel?: (id: string) => void;
  enableAttachmentMenu?: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    name?: string;
  }>;
  onAddAttachments?: (files: File[]) => void;
  onReplaceAttachment?: (id: string, file: File) => void;
  onRemoveAttachment?: (id: string) => void;
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

const IconMic = ({ className }: { className?: string }) => (
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
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </svg>
);

export default function PromptInput({
  placeholder = "Describe items to start generating your mood board",
  className = "",
  inputClassName = "",
  showEdgeHighlights = false,
  showShadow = true,
  variant = "default",
  showMic = false,
  loadingOnSubmit = false,
  value,
  onValueChange,
  readOnly = false,
  layout = "single",
  loadingOverride,
  submitHoverOverride = false,
  onSubmit,
  onFocusChange,
  modelOptions = [],
  selectedModel,
  onSelectModel,
  enableAttachmentMenu = false,
  attachments = [],
  onAddAttachments,
  onReplaceAttachment,
  onRemoveAttachment,
}: PromptInputProps) {
  const maxTextareaHeight = 152;
  const [internalValue, setInternalValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef("");
  const finalTranscriptRef = useRef("");
  const loadingTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const modelButtonRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedValue = value ?? internalValue;
  const handleValueChange = onValueChange ?? setInternalValue;
  const resolvedLoading = loadingOverride ?? showLoading;

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

  useEffect(() => {
    if (!showMic || typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsMicSupported(false);
      return;
    }

    setIsMicSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const prefix = baseValueRef.current
        ? `${baseValueRef.current} `
        : "";
      handleValueChange(
        `${prefix}${finalTranscriptRef.current}${interimTranscript}`.trim(),
      );
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [showMic]);

  useEffect(() => {
    if (layout !== "stacked") {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, maxTextareaHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxTextareaHeight ? "auto" : "hidden";
  }, [resolvedValue]);

  useEffect(() => {
    if (!isMenuOpen && !isModelMenuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target) ||
        modelMenuRef.current?.contains(target) ||
        modelButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsMenuOpen(false);
      setIsModelMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [isMenuOpen, isModelMenuOpen]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }

    baseValueRef.current = resolvedValue.trim();
    finalTranscriptRef.current = "";
    setIsRecording(true);

    try {
      recognitionRef.current.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmitClick = () => {
    onSubmit?.();
    if (!loadingOnSubmit) {
      return;
    }
    setShowLoading(true);
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = window.setTimeout(() => {
      setShowLoading(false);
    }, 2000);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    handleSubmitClick();
  };

  const handleSelectModel = (id: string) => {
    onSelectModel?.(id);
    setIsModelMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleAddPhotosClick = () => {
    setIsMenuOpen(false);
    fileInputRef.current?.click();
  };

  const selectedModelLabel =
    modelOptions.find((option) => option.id === selectedModel)?.label ??
    "Select model";

  const modelSelector =
    modelOptions.length > 0 ? (
      <div className="relative">
        <button
          ref={modelButtonRef}
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            setIsModelMenuOpen((prev) => !prev);
          }}
          className="flex h-11 items-center gap-2 rounded-full border border-[color:var(--charcoal)] bg-[color:var(--prompt-button-soft)] px-3 text-left text-sm text-[color:var(--prompt-text)] transition hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)]"
          aria-haspopup="menu"
          aria-expanded={isModelMenuOpen}
        >
          <span className="max-w-[140px] truncate">{selectedModelLabel}</span>
          {isModelMenuOpen ? (
            <ChevronDown className="h-4 w-4 text-[color:var(--prompt-muted)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[color:var(--prompt-muted)]" />
          )}
        </button>
        {isModelMenuOpen && (
          <div
            ref={modelMenuRef}
            className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-2xl border border-[color:var(--prompt-border)]/30 bg-[color:var(--prompt-surface)] p-2 text-sm text-[color:var(--prompt-text)] shadow-[0_20px_40px_rgba(15,23,42,0.18)]"
            role="menu"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--prompt-muted)]">
              Select model
            </p>
            <div className="flex flex-col gap-1">
              {modelOptions.map((option) => {
                const isSelected = option.id === selectedModel;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectModel(option.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-text)]"
                        : "text-[color:var(--prompt-muted)] hover:bg-[color:var(--prompt-button-soft)]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-[color:var(--prompt-accent-strong)]" />
                    ) : (
                      <span className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : null;

  const menuContent = (
    <>
      <button
        type="button"
        onClick={handleAddPhotosClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[color:var(--prompt-button-soft)]"
      >
        <ImagePlus className="h-5 w-5 text-[color:var(--prompt-muted)]" />
        <span>Add photos</span>
      </button>
    </>
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    if (replaceTargetId && onReplaceAttachment) {
      onReplaceAttachment(replaceTargetId, files[0]);
      setReplaceTargetId(null);
    } else {
      onAddAttachments?.(files);
    }
    event.target.value = "";
  };

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-2xl border-2 border-[color:var(--prompt-border)] bg-[color:var(--prompt-surface)] p-3 ${
        showShadow ? "shadow-[var(--prompt-shadow)]" : ""
      } ${className}`}
      style={variantStyles}
    >
      {showEdgeHighlights && (
        <div className="pointer-events-none absolute inset-0 rounded-[14px] border border-[color:var(--prompt-border)]/20" />
      )}
      {attachments.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-1 pb-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--prompt-border)]/30 bg-[color:var(--prompt-button-soft)] sm:h-20 sm:w-20"
            >
              <img
                src={attachment.url}
                alt={attachment.name ?? "Attachment"}
                className="h-full w-full object-cover"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <button
                  type="button"
                  aria-label="Replace attachment"
                  onClick={() => {
                    setReplaceTargetId(attachment.id);
                    fileInputRef.current?.click();
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--white)]/90 text-[color:var(--charcoal)] shadow-sm"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => onRemoveAttachment?.(attachment.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--white)]/90 text-[color:var(--charcoal)] shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {layout === "stacked" ? (
        <>
          <textarea
            ref={textareaRef}
            rows={2}
            className={`min-h-[64px] max-h-[152px] w-full resize-none overflow-y-auto bg-transparent px-2 py-1 text-base leading-6 text-[color:var(--prompt-text)] placeholder:text-[color:var(--prompt-muted)] focus:outline-none sm:text-base ${inputClassName}`}
            placeholder={placeholder}
            aria-label="Describe your vision"
            value={resolvedValue}
            onChange={(event) => handleValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            readOnly={readOnly}
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  ref={menuButtonRef}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-muted)] transition hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)] cursor-pointer"
                  aria-label="Add reference image"
                  type="button"
                  aria-haspopup={enableAttachmentMenu ? "menu" : undefined}
                  aria-expanded={enableAttachmentMenu ? isMenuOpen : undefined}
                  onClick={() => {
                    if (!enableAttachmentMenu) {
                      return;
                    }
                    setIsModelMenuOpen(false);
                    setIsMenuOpen((prev) => !prev);
                  }}
                >
                  <IconPlus className="h-5 w-5" />
                </button>
                {enableAttachmentMenu && isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 bottom-12 z-20 w-56 rounded-2xl border border-[color:var(--prompt-border)]/20 bg-[color:var(--prompt-surface)] p-2 text-sm text-[color:var(--prompt-text)] shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
                    role="menu"
                  >
                    {menuContent}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {modelSelector}
            </div>
            <div className="flex items-center gap-2">
              {showMic && (
                <button
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] transition ${
                    isRecording
                      ? "bg-[color:var(--prompt-accent-soft)] text-[color:var(--prompt-accent-strong)]"
                      : "bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-muted)] hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)]"
                  } ${isMicSupported ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
                  aria-label="Start voice input"
                  aria-pressed={isRecording}
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!isMicSupported}
                >
                  <IconMic className="h-5 w-5" />
                </button>
              )}
              <button
                className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] text-[color:var(--prompt-text)] transition cursor-pointer ${
                  submitHoverOverride
                    ? "bg-[color:var(--prompt-accent-soft)] text-[color:var(--prompt-accent-strong)]"
                    : "bg-[color:var(--prompt-button-bg)] hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)]"
                }`}
                aria-label="Generate mood board"
                type="button"
                aria-busy={resolvedLoading}
                onClick={handleSubmitClick}
              >
                {resolvedLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--prompt-accent-strong)] border-t-transparent" />
                ) : (
                  <IconArrow className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={menuButtonRef}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-muted)] transition hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)] cursor-pointer"
              aria-label="Add reference image"
              type="button"
              aria-haspopup={enableAttachmentMenu ? "menu" : undefined}
              aria-expanded={enableAttachmentMenu ? isMenuOpen : undefined}
              onClick={() => {
                if (!enableAttachmentMenu) {
                  return;
                }
                setIsModelMenuOpen(false);
                setIsMenuOpen((prev) => !prev);
              }}
            >
              <IconPlus className="h-5 w-5" />
            </button>
            {enableAttachmentMenu && isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute left-0 bottom-12 z-20 w-56 rounded-2xl border border-[color:var(--prompt-border)]/20 bg-[color:var(--prompt-surface)] p-2 text-sm text-[color:var(--prompt-text)] shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
                role="menu"
              >
                {menuContent}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {modelSelector}
          <input
            className={`h-11 flex-1 bg-transparent px-2 text-base text-[color:var(--prompt-text)] placeholder:text-[color:var(--prompt-muted)] focus:outline-none sm:text-base ${inputClassName}`}
            placeholder={placeholder}
            type="text"
            aria-label="Describe your vision"
            value={resolvedValue}
            onChange={(event) => handleValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            readOnly={readOnly}
          />
          {showMic && (
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] transition ${
                isRecording
                  ? "bg-[color:var(--prompt-accent-soft)] text-[color:var(--prompt-accent-strong)]"
                  : "bg-[color:var(--prompt-button-soft)] text-[color:var(--prompt-muted)] hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)]"
              } ${isMicSupported ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
              aria-label="Start voice input"
              aria-pressed={isRecording}
              type="button"
              onClick={handleMicToggle}
              disabled={!isMicSupported}
            >
              <IconMic className="h-5 w-5" />
            </button>
          )}
          <button
            className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--charcoal)] text-[color:var(--prompt-text)] transition cursor-pointer ${
              submitHoverOverride
                ? "bg-[color:var(--prompt-accent-soft)] text-[color:var(--prompt-accent-strong)]"
                : "bg-[color:var(--prompt-button-bg)] hover:bg-[color:var(--prompt-accent-soft)] hover:text-[color:var(--prompt-accent-strong)]"
            }`}
            aria-label="Generate mood board"
            type="button"
            aria-busy={resolvedLoading}
            onClick={handleSubmitClick}
          >
            {resolvedLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--prompt-accent-strong)] border-t-transparent" />
            ) : (
              <IconArrow className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
