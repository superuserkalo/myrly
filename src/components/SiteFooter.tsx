"use client";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto w-full bg-[color:var(--periwinkle)]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-0 pt-8 sm:px-6">
        <div className="relative border-y border-dotted border-[color:var(--charcoal)] py-8">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l border-dotted border-[color:var(--charcoal)] md:block" />
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-6 text-[color:var(--charcoal)]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[color:var(--charcoal)]">
                    Stay Uptade with Moooday
                  </p>
                  <p className="text-sm text-[color:var(--grey)]">
                    Updates and Announcements about Mooody
                    <br />
                    No Spam. Pinky promise :)
                  </p>
                </div>
                <form className="space-y-4">
                  <label className="sr-only" htmlFor="footer-email">
                    Email address
                  </label>
                  <div className="flex w-full max-w-xs items-center justify-between rounded-xl border border-dotted border-[color:var(--charcoal)]/50 bg-transparent px-3 py-2">
                    <input
                      id="footer-email"
                      type="email"
                      placeholder="Your email"
                      required
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-[color:var(--charcoal)] placeholder:text-[color:var(--grey)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-[color:var(--charcoal)]/40 bg-[color:var(--orange)] px-3 py-1 text-xs font-semibold text-[color:var(--charcoal)] transition hover:brightness-95"
                    >
                      Submit
                    </button>
                  </div>
                  <label className="group flex items-start gap-2 text-[11px] text-[color:var(--grey)] cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      className="peer sr-only"
                    />
                    <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded border border-[color:var(--charcoal)] bg-transparent text-[color:var(--orange)] transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--orange)] peer-checked:border-[color:var(--charcoal)] peer-checked:bg-[color:var(--orange)]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3 w-3 text-[color:var(--charcoal)] opacity-0 transition peer-checked:opacity-100"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.5 8.5l2.5 2.5 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="select-none">
                      I agree to receive updates and accept the{" "}
                      <a
                        className="underline underline-offset-4 transition-colors group-hover:text-[color:var(--orange)] hover:text-[color:var(--orange)]"
                        href="/privacy"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </form>
              </div>

            <div className="grid gap-6 md:pl-8">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-3 text-sm text-[color:var(--grey)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--charcoal)]">
                      Company
                    </p>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    About Us
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    Contact
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="/pricing">
                    Pricing
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    Refund
                  </a>
                  </div>
                  <div className="space-y-3 text-sm text-[color:var(--grey)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--charcoal)]">
                      Legal
                    </p>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    Impressum
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    Terms and Conditions
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="/privacy">
                    Privacy
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="/cookies">
                    Cookies
                  </a>
                  </div>
                  <div className="space-y-3 text-sm text-[color:var(--grey)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--charcoal)]">
                      Explore
                    </p>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    Affiliate Program
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="/quiz">
                    Manifestation Quiz
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#community">
                    Store
                  </a>
                  <a className="block transition hover:text-[color:var(--orange)]" href="#">
                    FAQ
                  </a>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs text-[color:var(--grey)] md:flex-row md:items-center md:justify-start">
                  <span className="text-[color:var(--charcoal)]">© Mooody 2026</span>
                </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-0">
          <div className="flex justify-center">
            <img
              src="/moooday_black-removed.png"
              alt="The Mooody"
              className="h-24 w-auto sm:h-28"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
