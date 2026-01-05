"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";

type Status = { type: "success" | "error"; message: string } | null;

export function UpdateProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initialProfile, setInitialProfile] = useState({
    firstName: "",
    lastName: "",
  });
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [imageStatus, setImageStatus] = useState<Status>(null);
  const [isSaving, startSave] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentProfile = {
      firstName: "",
      lastName: "",
    };
    setFirstName(currentProfile.firstName);
    setLastName(currentProfile.lastName);
    setInitialProfile(currentProfile);
  }, []);

  const handleSave = () => {
    setProfileStatus(null);
    startSave(async () => {
      setProfileStatus({
        type: "error",
        message: "Profile updates are temporarily unavailable.",
      });
    });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setImageStatus(null);
    startUpload(async () => {
      setImageStatus({
        type: "error",
        message: "Profile photos are temporarily unavailable.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleRemoveImage = () => {
    setImageStatus(null);
    startUpload(async () => {
      setImageStatus({
        type: "error",
        message: "Profile photos are temporarily unavailable.",
      });
    });
  };

  const isDirty =
    firstName.trim() !== initialProfile.firstName.trim() ||
    lastName.trim() !== initialProfile.lastName.trim();
  const initials =
    (firstName.trim().charAt(0) || "M") +
    (lastName.trim().charAt(0) || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-[#1f1f1f]">
          (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
              {initials.toUpperCase()}
            </div>
          )
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Profile photo</p>
            <p className="text-xs text-white/60">
              Upload a square image for the best results.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload new photo"}
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isUploading}
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove
            </button>
            {imageStatus && (
              <span
                className={`text-xs ${
                  imageStatus.type === "success"
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {imageStatus.message}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              First name
            </label>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/30"
              placeholder="First name"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Last name
            </label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/30"
              placeholder="Last name"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="rounded-full bg-blue-500 px-5 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        {profileStatus && (
          <span
            className={`text-xs ${
              profileStatus.type === "success"
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {profileStatus.message}
          </span>
        )}
      </div>
    </div>
  );
}
