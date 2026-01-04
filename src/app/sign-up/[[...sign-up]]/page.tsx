import { SignUp } from "@clerk/nextjs";
import { AuthStorageReset } from "@/components/auth/AuthStorageReset";

export default function SignUpPage() {
  return (
    <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
      <AuthStorageReset reason="sign-up" />
      <div className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--grey)]">
            Create account
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Start your manifesto.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--grey)]">
            Build your vision with a studio designed for creators.
          </p>
        </div>

        <SignUp
          forceRedirectUrl="/onboarding"
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
