"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";

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
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      window.location.assign(redirectUrl);
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
