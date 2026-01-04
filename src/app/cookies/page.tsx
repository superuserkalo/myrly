export default function CookiesPage() {
  return (
    <main className="min-h-[100svh] bg-background px-5 pb-16 pt-24 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Cookie Policy
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Cookie usage and consent
          </h1>
          <p className="text-sm text-muted">Effective date: 2026-01-01</p>
        </div>

        <section className="space-y-4 text-sm text-muted">
          <p>
            This Cookie Policy explains how The Mooody uses cookies and
            similar technologies.
          </p>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              1) What Are Cookies
            </h2>
            <p className="mt-2">
              Cookies are small text files stored on your device. Similar
              technologies include local storage and device identifiers.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              2) Cookies We Use
            </h2>
            <p className="mt-2 font-semibold text-foreground">
              Essential (Always On)
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Authentication cookies to keep you signed in.</li>
              <li>Security cookies to protect the service.</li>
            </ul>

            <p className="mt-4 font-semibold text-foreground">
              Analytics (Optional)
            </p>
            <p className="mt-2">
              We only enable analytics after you consent. This helps us improve
              the product.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              3) How to Manage Cookies
            </h2>
            <p className="mt-2">
              You can control cookies in your browser settings. You can also
              adjust your consent choices in the app.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">
              4) Updates
            </h2>
            <p className="mt-2">
              We may update this policy. Material changes will be communicated.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
