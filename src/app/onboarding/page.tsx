"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { completeOnboarding } from "./actions";

type Step = "purpose" | "discovery" | "invites" | "workspace";

type Purpose = "work" | "school" | "personal";
type Role =
    | "designer"
    | "ui_ux"
    | "developer"
    | "teacher"
    | "student"
    | "interior_designer"
    | "marketing";

type DiscoverySource =
    | "search_engine"
    | "linkedin"
    | "tiktok"
    | "ai_tools"
    | "tv_streaming"
    | "reddit"
    | "friend_colleague"
    | "software_review"
    | "youtube"
    | "facebook_instagram"
    | "other";

const purposeOptions: { id: Purpose; label: string }[] = [
    { id: "work", label: "Work" },
    { id: "school", label: "School" },
    { id: "personal", label: "Personal" },
];

const roleOptions: { id: Role; label: string }[] = [
    { id: "designer", label: "Designer" },
    { id: "ui_ux", label: "UI/UX" },
    { id: "developer", label: "Developer" },
    { id: "teacher", label: "Teacher" },
    { id: "student", label: "Student" },
    { id: "interior_designer", label: "Interior Designer" },
    { id: "marketing", label: "Marketing" },
];

const discoveryOptions: { id: DiscoverySource; label: string }[] = [
    { id: "search_engine", label: "Search Engine (Google, Bing, etc.)" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "tiktok", label: "TikTok" },
    { id: "ai_tools", label: "AI Tools (ChatGPT, Perplexity, etc.)" },
    { id: "tv_streaming", label: "TV / Streaming (Hulu, NBC, etc.)" },
    { id: "reddit", label: "Reddit" },
    { id: "friend_colleague", label: "Friend / Colleague" },
    { id: "software_review", label: "Software Review Sites" },
    { id: "youtube", label: "YouTube" },
    { id: "facebook_instagram", label: "Facebook / Instagram" },
    { id: "other", label: "Other" },
];

const TOTAL_STEPS = 4;

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("purpose");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Purpose & Role
    const [purpose, setPurpose] = useState<Purpose | null>(null);
    const [role, setRole] = useState<Role | null>(null);

    // Step 2: Discovery
    const [discoverySource, setDiscoverySource] = useState<DiscoverySource | null>(null);
    const [referralCode, setReferralCode] = useState("");

    // Step 3: Invites
    const [inviteInput, setInviteInput] = useState("");
    const [invites, setInvites] = useState<string[]>([]);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Step 4: Workspace
    const [workspaceName, setWorkspaceName] = useState("");

    const stepNumber = {
        purpose: 1,
        discovery: 2,
        invites: 3,
        workspace: 4,
    }[step];

    const progressPercent = (stepNumber / TOTAL_STEPS) * 100;

    const canContinue = {
        purpose: purpose !== null && role !== null,
        discovery: discoverySource !== null,
        invites: true, // Optional step
        workspace: workspaceName.trim().length >= 2,
    }[step];

    const handleBack = () => {
        if (step === "discovery") setStep("purpose");
        else if (step === "invites") setStep("discovery");
        else if (step === "workspace") setStep("invites");
    };

    const handleNext = () => {
        if (step === "purpose") setStep("discovery");
        else if (step === "discovery") setStep("invites");
        else if (step === "invites") setStep("workspace");
        else if (step === "workspace") handleComplete();
    };

    const addInvites = useCallback(() => {
        const emails = inviteInput
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.length > 0);

        const invalid = emails.filter((e) => !validateEmail(e));
        if (invalid.length > 0) {
            setInviteError(`Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`);
            return;
        }

        const newInvites = emails.filter((e) => !invites.includes(e));
        if (newInvites.length > 0) {
            setInvites((prev) => [...prev, ...newInvites]);
        }
        setInviteInput("");
        setInviteError(null);
    }, [inviteInput, invites]);

    const removeInvite = (email: string) => {
        setInvites((prev) => prev.filter((e) => e !== email));
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            // Complete onboarding via server action
            const result = await completeOnboarding({
                purpose: purpose!,
                role: role!,
                discoverySource: discoverySource!,
                referralCode: referralCode || undefined,
                invitedEmails: invites,
                workspaceName: workspaceName.trim(),
            });

            if (result.success && result.workspaceId) {
                // Redirect to workspace dashboard
                router.push(`/workspaces/${result.workspaceId}/dashboard`);
            } else {
                console.error("Onboarding error:", result.error);
            }
        } catch (error) {
            console.error("Onboarding error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
            {/* Progress bar */}
            <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-[color:var(--charcoal)]/10">
                <div
                    className="h-full bg-[color:var(--charcoal)] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Header */}
            <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-4 sm:px-10">
                <img src="/moooday_black-removed.png" alt="Mooody" className="h-8 w-auto" />
                <span className="text-xs font-medium text-[color:var(--grey)]">
                    Step {stepNumber} of {TOTAL_STEPS}
                </span>
            </header>

            <main className="mx-auto flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-24 sm:px-10">
                {/* Step 1: Purpose & Role */}
                {step === "purpose" && (
                    <div className="space-y-10">
                        <div>
                            <h1 className="text-3xl font-semibold sm:text-4xl">
                                What will you use Mooody for?
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {purposeOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setPurpose(option.id)}
                                        className={`rounded-full border px-6 py-3 text-sm font-medium transition ${purpose === option.id
                                            ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                                            : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                How would you describe yourself?
                            </h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {roleOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setRole(option.id)}
                                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${role === option.id
                                            ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                                            : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Discovery */}
                {step === "discovery" && (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-semibold sm:text-4xl">
                                How did you hear about us?
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {discoveryOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setDiscoverySource(option.id)}
                                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${discoverySource === option.id
                                            ? "border-[color:var(--charcoal)] bg-[color:var(--charcoal)] text-white"
                                            : "border-[color:var(--charcoal)]/15 hover:border-[color:var(--charcoal)]/40"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[color:var(--grey)]">
                                Have a referral code? (optional)
                            </label>
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Enter referral code"
                                className="mt-2 w-full max-w-xs rounded-xl border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--charcoal)]/40"
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Invites */}
                {step === "invites" && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-semibold sm:text-4xl">
                                Invite people to your Workspace:
                            </h1>
                            <p className="mt-2 text-sm text-[color:var(--grey)]">
                                Enter email addresses (or paste multiple)
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={inviteInput}
                                onChange={(e) => setInviteInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addInvites();
                                    }
                                }}
                                placeholder="teammate@studio.com"
                                className="flex-1 rounded-xl border border-[color:var(--charcoal)]/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--charcoal)]/40"
                            />
                            <button
                                type="button"
                                onClick={addInvites}
                                className="rounded-xl border border-[color:var(--charcoal)]/15 px-5 py-3 text-sm font-medium transition hover:border-[color:var(--charcoal)]/40"
                            >
                                Add
                            </button>
                        </div>

                        {inviteError && (
                            <p className="text-sm text-red-500">{inviteError}</p>
                        )}

                        {invites.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {invites.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--charcoal)]/5 px-3 py-1.5 text-sm"
                                    >
                                        {email}
                                        <button
                                            type="button"
                                            onClick={() => removeInvite(email)}
                                            className="text-[color:var(--grey)] hover:text-[color:var(--charcoal)]"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-sm text-emerald-700">
                                <span className="mr-2">πŸ''</span>
                                Don't do it alone - Invite your crew to unlock shared asset libraries
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 4: Workspace */}
                {step === "workspace" && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-semibold sm:text-4xl">
                                Name your workspace
                            </h1>
                            <p className="mt-2 text-sm text-[color:var(--grey)]">
                                This is where your team's boards and assets live.
                            </p>
                        </div>

                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="My Creative Studio"
                            className="w-full rounded-xl border border-[color:var(--charcoal)]/15 bg-white px-4 py-4 text-lg outline-none transition focus:border-[color:var(--charcoal)]/40"
                            autoFocus
                        />
                    </div>
                )}
            </main>

            {/* Footer navigation */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-[color:var(--charcoal)]/10 bg-white px-6 py-4 sm:px-10">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === "purpose"}
                    className="flex items-center gap-2 rounded-full border border-[color:var(--charcoal)]/15 px-5 py-2.5 text-sm font-medium transition hover:border-[color:var(--charcoal)]/40 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canContinue || isSubmitting}
                    className="flex items-center gap-2 rounded-full bg-[color:var(--charcoal)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {step === "workspace" ? (isSubmitting ? "Creating..." : "Create Workspace") : "Next"}
                    {step !== "workspace" && <ArrowRight className="h-4 w-4" />}
                </button>
            </footer>
        </div>
    );
}
