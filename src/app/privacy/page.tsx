export default function PrivacyPage() {
  return (
    <main className="min-h-[100svh] bg-background px-5 pb-16 pt-24 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Privacy Policy
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Your privacy matters
          </h1>
          <p className="text-sm text-muted">Effective date: 2026-01-01</p>
        </div>

        <section className="space-y-4 text-sm text-white/80">
          <p>
            This Privacy Policy explains how The Mooody collects, uses, and
            protects your personal data.
          </p>

          <div>
            <h2 className="text-base font-semibold text-white">
              1) What We Collect
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account data: email address.</li>
              <li>Profile data: handle, display name.</li>
              <li>Content data: manifestations and uploads.</li>
              <li>Usage data (optional): analytics if you opt in.</li>
              <li>Support data: messages you send to support.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              2) How We Use Your Data
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide and improve the service.</li>
              <li>Authenticate you and secure your account.</li>
              <li>Generate and store manifestations.</li>
              <li>Show public content you publish.</li>
              <li>Send transactional emails.</li>
              <li>Send newsletters if you opt in.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              3) Legal Bases (EU/EEA)
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Contract: to provide the service.</li>
              <li>Consent: for analytics and marketing emails.</li>
              <li>Legitimate interests: to secure and improve the platform.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              4) Sharing & Third Parties
            </h2>
            <p className="mt-2">
              We share data only with providers needed to run the platform
              (Supabase, Cloudflare, Resend, AI providers). We do not sell your
              personal data.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              5) Public Content
            </h2>
            <p className="mt-2">
              If you publish a manifestation, it appears in the Community and
              on your profile. You can delete content at any time.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              6) Data Retention
            </h2>
            <p className="mt-2">
              We keep data as long as your account is active or needed to
              provide the service. You can request deletion at any time.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              7) Your Rights (EU/EEA)
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access, correct, delete, or export your data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              Contact us at hello@themooody.com to exercise your rights.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">8) Security</h2>
            <p className="mt-2">
              We use industry-standard safeguards, including access controls
              and encryption in transit.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">9) Children</h2>
            <p className="mt-2">
              The service is intended for users aged 14+. If you believe a
              minor has provided data, contact us.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">10) Changes</h2>
            <p className="mt-2">
              We may update this policy. Material changes will be communicated.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
