import { SignIn } from "@clerk/nextjs";
import { AuthStorageReset } from "@/components/auth/AuthStorageReset";

export default function SignInPage() {
  return (
    <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
      <AuthStorageReset reason="sign-in" />
      <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Continue your vision.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--grey)]">
            Pick up right where you left off.
          </p>
        </div>

        <SignIn
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "rounded-3xl border border-[color:var(--charcoal)]/15 bg-white shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary:
                "rounded-full bg-[color:var(--charcoal)] text-[color:var(--white)] hover:brightness-95",
              formFieldInput:
                "rounded-xl border border-[color:var(--charcoal)]/20 bg-white text-[color:var(--charcoal)]",
              footerActionLink:
                "text-[color:var(--grey)] hover:text-[color:var(--charcoal)]",
            },
          }}
        />
      </div>
    </div>
  );
}
