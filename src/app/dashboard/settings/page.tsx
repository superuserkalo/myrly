import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { UpdateProfile } from "@/components/settings/UpdateProfile";
import { DangerZone } from "@/components/settings/DangerZone";
import { SignOutWithReset } from "@/components/settings/SignOutWithReset";

export default function DashboardSettingsPage() {
  return (
    <div className="min-h-[100svh] bg-[#2b2b2b] text-[#e6e6e6]">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <SignedIn>
            <SignOutWithReset>
              Sign out
            </SignOutWithReset>
          </SignedIn>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
        <SignedOut>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/70">
              Sign in to manage your account settings.
            </p>
            <div className="mt-4 flex items-center justify-center">
              <SignInButton forceRedirectUrl="/dashboard/settings">
                <button
                  type="button"
                  className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold text-white"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Profile
              </p>
              <h1 className="mt-2 text-xl font-semibold text-white">
                Account details
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Update your profile name and see the email tied to your account.
              </p>
            </div>
            <UpdateProfile />
          </section>

          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200/70">
                Danger zone
              </p>
              <h2 className="mt-2 text-lg font-semibold text-red-100">
                Delete account
              </h2>
              <p className="mt-2 text-sm text-red-100/70">
                Permanently remove your data and revoke access to your workspace.
              </p>
            </div>
            <DangerZone />
          </section>
        </SignedIn>
      </main>
    </div>
  );
}
