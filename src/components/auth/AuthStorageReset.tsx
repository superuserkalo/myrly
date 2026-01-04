"use client";

import { useEffect } from "react";

const STORAGE_KEY = "moody-onboarding";

type AuthStorageResetProps = {
  reason?: string;
};

export function AuthStorageReset({ reason }: AuthStorageResetProps) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors.
    }
    if (process.env.NEXT_PUBLIC_DEBUG_ONBOARDING === "true") {
      console.info("[onboarding] storage cleared", { reason });
    }
  }, [reason]);

  return null;
}
