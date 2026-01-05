"use client";

import { useState, useTransition } from "react";
import { deleteUserAccount } from "@/app/actions/user";

export function DangerZone() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete your account.",
    );
    if (!confirmed) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await deleteUserAccount();
        if (result?.message) {
          setErrorMessage(result.message);
          return;
        }
        if (result?.success) {
          window.location.assign("/");
        }
      } catch (error) {
        console.error("Failed to delete account", error);
        setErrorMessage("Failed to delete account. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full border border-red-400/50 px-5 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Delete account"}
      </button>
      {errorMessage && (
        <p className="text-xs text-red-200" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
