import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-[100svh] bg-[var(--white)] text-[color:var(--charcoal)]">
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

        <div className="w-full max-w-md rounded-3xl border border-[color:var(--charcoal)]/15 bg-white p-6 text-center shadow-none">
          <p className="text-sm text-[color:var(--grey)]">
            Sign-up is being refreshed. You can still explore the product
            while we wire the new system.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="rounded-full bg-[color:var(--charcoal)] px-6 py-2 text-sm font-semibold text-[color:var(--white)]"
            >
              Start onboarding
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-[color:var(--charcoal)]/30 px-6 py-2 text-sm font-semibold text-[color:var(--charcoal)]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
