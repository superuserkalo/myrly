"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";

const STORAGE_KEY = "moody-onboarding";

type SignOutWithResetProps = {
  redirectUrl?: string;
  className?: string;
  children?: ReactNode;
};

export function SignOutWithReset({
  redirectUrl = "/",
  className,
  children,
}: SignOutWithResetProps) {
  const { signOut } = useClerk();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage access errors.
      }
      if (process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === "true") {
        console.info("[onboarding] storage cleared", { reason: "sign-out" });
      }
      try {
        await signOut({ redirectUrl });
      } catch (error) {
        console.error("Failed to sign out", error);
        window.location.assign(redirectUrl);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={
        className ??
        "rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {isPending ? "Signing out..." : children ?? "Sign out"}
    </button>
  );
}
