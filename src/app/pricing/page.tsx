"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const pricingPlans = [
  {
    id: "visitor",
    name: "Free",
    badge: null,
    description: "Start with the essentials.",
    monthly: "0.00",
    yearly: "0.00",
    billingNote: "3,000 credits / mo",
    billingNoteYearly: "36,000 credits / yr",
    seatBased: false,
    inherits: null,
    features: [
      "Full HD resolution",
      "Standard Export Options",
      "Personal Asset Library",
      "5 Background Removals per day",
      "Up to 5 Boards",
      "Private Boards",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    id: "studio",
    name: "Pro",
    badge: "Most Popular",
    description: "For creators and teams building daily.",
    monthly: "$14.99",
    yearly: "$129",
    billingNote: "10,000 credits / mo",
    billingNoteYearly: "120,000 credits / yr",
    yearlyNote: "(Like paying $10.75/mo)",
    inherits: "Everything in Free, plus",
    seatBased: false,
    features: [
      "Up to 2k & 4k Upscale",
      "Pro AI Models",
      "Priority Image Processing",
      "Unlimited Background Removals",
      "2-month credit bucket",
      "Advanced Export Options",
      "Live Collaboration",
      "Unlimited Boards",
      "Priority support",
      "Commercial rights",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Business",
    badge: null,
    description: "For teams of creators with more needs.",
    monthly: "$24.99",
    yearly: "$249",
    billingNote: "25,000 credits / seat / mo",
    billingNoteYearly: "300,000 credits / seat / yr",
    yearlyNote: "(Like paying $20.75/mo)",
    inherits: "Everything in Pro, plus",
    seatBased: true,
    features: [
      "Unified Team Workspace",
      "Advanced Team Roles",
      "Team Asset Management",
      "Pooled Team Credit Wallet",
      "Centralized Admin & Billing",
      "SSO & Business Security",
      "Up to 8K Ultra-HD Upscale",
      "Dedicated Priority Support",
    ],
    cta: "Get started",
    highlight: false,
  },
];

const refillPacks = [
  {
    id: "quick",
    name: "1,500 Credits",
    price: "$5.00",
    images: "15 Images",
    tag: "Standard Rate",
    savings: null,
  },
  {
    id: "weekender",
    name: "3,200 Credits",
    price: "$10.00",
    images: "32 Images",
    tag: "Popular",
    savings: "+200 Bonus Credits",
  },
  {
    id: "studio",
    name: "5,000 Credits",
    price: "$15.00",
    images: "50 Images",
    tag: "Best Value",
    savings: "+500 Bonus Credits",
  },
];

type PlanValue =
  | { type: "check" }
  | { type: "text"; value: string; tone?: "muted" };

const checkValue: PlanValue = { type: "check" };
const textValue = (value: string, tone?: "muted"): PlanValue => ({
  type: "text",
  value,
  tone,
});

const featureGroups = [
  {
    title: "Creation Power",
    rows: [
      {
        label: "Monthly credits",
        free: textValue("3,000"),
        pro: textValue("10,000"),
        enterprise: textValue("25,000 (Pooled)"),
      },
      {
        label: "Model access",
        free: textValue("Turbo (Draft)"),
        pro: textValue("Flux, Gemini, Turbo"),
        enterprise: textValue("All Models"),
      },
      {
        label: "Generation speed",
        free: textValue("Standard"),
        pro: textValue("Fast Lane"),
        enterprise: textValue("Priority Zero-Queue"),
      },
      {
        label: "Negative prompting",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Image-to-Image",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
    ],
  },
  {
    title: "Image Quality & Editing",
    rows: [
      {
        label: "Max resolution",
        free: textValue("HD (1080p)"),
        pro: textValue("4K Ultra-HD"),
        enterprise: textValue("8K Ultra-HD"),
      },
      {
        label: "AI upscaling",
        free: textValue("—", "muted"),
        pro: textValue("2K & 4K"),
        enterprise: textValue("Up to 8K"),
      },
      {
        label: "Aspect ratios",
        free: textValue("16:9 & 9:16"),
        pro: textValue("Custom & All Ratios"),
        enterprise: textValue("Custom & All Ratios"),
      },
      {
        label: "Background removal",
        free: textValue("5 / day"),
        pro: textValue("Unlimited"),
        enterprise: textValue("Unlimited"),
      },
      {
        label: "Inpainting (Edit areas)",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
    ],
  },
  {
    title: "Canvas & Tools",
    rows: [
      {
        label: "Active boards",
        free: textValue("5 Boards"),
        pro: textValue("Unlimited"),
        enterprise: textValue("Unlimited"),
      },
      {
        label: "Reference uploads",
        free: textValue("50MB Limit"),
        pro: textValue("500MB Limit"),
        enterprise: textValue("5GB Limit"),
      },
      {
        label: "Color extraction",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Layer management",
        free: textValue("Basic"),
        pro: textValue("Advanced"),
        enterprise: textValue("Advanced"),
      },
    ],
  },
  {
    title: "Collaboration & Sharing",
    rows: [
      {
        label: "Live collaboration",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Guest viewing",
        free: checkValue,
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Guest editing",
        free: textValue("—", "muted"),
        pro: textValue("By Invite"),
        enterprise: textValue("Advanced Roles"),
      },
      {
        label: "Comments & threads",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Version history",
        free: textValue("24 Hours"),
        pro: textValue("30 Days"),
        enterprise: textValue("Unlimited"),
      },
    ],
  },
  {
    title: "Assets & Export",
    rows: [
      {
        label: "Export formats",
        free: textValue("JPG, PNG"),
        pro: textValue("PSD, PDF, TIFF"),
        enterprise: textValue("PSD, PDF, TIFF"),
      },
      {
        label: "Transparent exports",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
      {
        label: "Asset library",
        free: textValue("Personal Uploads"),
        pro: textValue("Personal Library"),
        enterprise: textValue("Team Asset Management"),
      },
      {
        label: "Commercial rights",
        free: textValue("—", "muted"),
        pro: checkValue,
        enterprise: checkValue,
      },
    ],
  },
  {
    title: "Admin & Security",
    rows: [
      {
        label: "Credit rollover",
        free: textValue("—", "muted"),
        pro: textValue("2-Month Bucket"),
        enterprise: textValue("1-Year Bucket"),
      },
      {
        label: "Credit pooling",
        free: textValue("—", "muted"),
        pro: textValue("—", "muted"),
        enterprise: textValue("Team Wallet"),
      },
      {
        label: "SSO / SAML",
        free: textValue("—", "muted"),
        pro: textValue("—", "muted"),
        enterprise: checkValue,
      },
      {
        label: "Data privacy",
        free: textValue("Private Boards"),
        pro: textValue("Private Boards"),
        enterprise: textValue("Stealth Mode (NDA)"),
      },
      {
        label: "Support",
        free: textValue("Community"),
        pro: textValue("Priority Email"),
        enterprise: textValue("Dedicated Manager"),
      },
    ],
  },
];

const renderPlanValue = (value: PlanValue) => {
  if (value.type === "check") {
    return <Check className="h-4 w-4 text-[color:var(--charcoal)]" />;
  }
  return (
    <span
      className={
        value.tone === "muted"
          ? "text-[color:var(--grey)]"
          : "text-[color:var(--charcoal)]"
      }
    >
      {value.value}
    </span>
  );
};

const faqItems = [
  {
    question: "How do I upgrade from Basic to Pro?",
    paragraphs: [
      "When you first sign up for Flow, you'll get a 14-day free trial of Flow Pro. To upgrade, open the app and click Try Flow Pro.",
      "You can also find Plan & Billing under Settings.",
      "If your Flow Pro trial expires and you're joining a team for the first time, your trial will reset when you're added—no credit card required upfront.",
    ],
  },
  {
    question: "Is there a free trial or free plan available?",
    paragraphs: [
      "Yes.",
      "Individuals: All new accounts include a 14-day Pro trial. After the trial, you'll convert to Flow Basic (our free plan) unless you upgrade.",
      "Teams: Every teammate you invite also gets their own 14-day Pro trial, even if they've already used their individual Pro trial. No upfront payment required.",
      "If you are already on a Pro plan, you do not get an additional trial.",
      "If you have already done a Pro trial with a team, you do not get a second trial if you join a new team.",
      "Enterprises: If you have advanced security and support needs or want a bulk pricing discount, you can reach out to our Sales team to learn more.",
    ],
  },
  {
    question: "Can I change or cancel my subscription at any time?",
    paragraphs: [
      "Yes. You can manage your subscription under Plan & Billing in the Flow Desktop App.",
      "If you need help, reach out through our Support Portal.",
    ],
  },
  {
    question: "Do you offer discounts for specific groups?",
    paragraphs: [
      "We're happy to offer discounted Flow Pro to students, educators and nonprofit organizations.",
    ],
  },
  {
    question: "Can I use Flow for my whole team?",
    paragraphs: [
      "Yes. Flow Pro supports both individuals and teams. With Pro, you can:",
    ],
    bullets: [
      "Create a team with no minimum seat requirement.",
      "Invite teammates (each one gets a 14-day free trial when they join).",
      "Use shared dictionary + snippets.",
      "Get centralized billing and admin controls.",
      "Basic usage dashboards (accessible by admin only)",
    ],
    footer:
      "For bulk pricing discounts, advanced IT controls and compliance (SSO/SAML, SOC 2 Type II and ISO 27001 compliance, enforced HIPAA compliance, or enforced Zero Data Retention), or advanced usage dashboards, reach out to our Sales team to upgrade to Enterprise.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[var(--white)] text-[color:var(--charcoal)]">
      <SiteHeader />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-40 -top-48 h-[420px] w-[640px] rounded-full border-[4px] border-[color:var(--periwinkle)]/80" />
        <div className="absolute -right-48 -top-64 h-[460px] w-[720px] rounded-full border-[4px] border-[color:var(--periwinkle)]/70" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pt-24">
        <section className="mt-4 text-center">
          <h1 className="font-display text-5xl sm:text-7xl">Pricing</h1>
          <p className="mt-3 text-sm text-[color:var(--charcoal)]">
            Sign up to get started for free.
            <br className="hidden sm:block" /> No credit card or download required.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="inline-flex items-center rounded-full border border-[color:var(--charcoal)] bg-[var(--white)]/80 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-[color:var(--periwinkle)] text-[color:var(--charcoal)]"
                    : "text-[color:var(--grey)]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  billingCycle === "yearly"
                    ? "bg-[color:var(--periwinkle)] text-[color:var(--charcoal)]"
                    : "text-[color:var(--grey)]"
                }`}
              >
                Yearly
              </button>
            </div>
            <a
              href="#plans-features"
              className="rounded-full border border-[color:var(--charcoal)] px-4 py-2 text-xs font-semibold text-[color:var(--charcoal)] transition hover:bg-[color:var(--periwinkle)]"
            >
              See details
            </a>
          </div>
          {billingCycle === "yearly" && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--charcoal)]">
              Save 17%
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isYearly = billingCycle === "yearly";
            const price = isYearly ? plan.yearly : plan.monthly;
            const periodLabel = isYearly ? "/ yr" : "/ mo";
            const billingNote = isYearly && plan.billingNoteYearly
              ? plan.billingNoteYearly
              : plan.billingNote;
            const isHighlighted = plan.highlight;
            const isEnterprise = plan.id === "enterprise";
            return (
              <div
                key={plan.id}
                className={`flex h-full flex-col justify-between rounded-[30px] border-2 px-6 py-7 ${
                  isHighlighted
                    ? "border-[color:var(--charcoal)] bg-[color:var(--periwinkle)]"
                    : isEnterprise
                      ? "border-[color:var(--charcoal)] bg-[color:var(--white)]"
                      : "border-[color:var(--grey)]/50 bg-[color:var(--white)]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--charcoal)]">
                      {plan.name}
                    </p>
                    {plan.badge && (
                      <span className="rounded-full border border-[color:var(--charcoal)]/30 bg-[color:var(--periwinkle)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--charcoal)]">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      isHighlighted
                        ? "text-[color:var(--charcoal)]"
                        : "text-[color:var(--grey)]"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">{price}</span>
                    {plan.seatBased && (
                      <span
                        className={`text-xs font-normal ${
                          isHighlighted
                            ? "text-[color:var(--charcoal)]"
                            : "text-[color:var(--grey)]"
                        }`}
                      >
                        / seat
                      </span>
                    )}
                    <span
                      className={`text-xs ${
                        isHighlighted
                          ? "text-[color:var(--charcoal)]"
                          : "text-[color:var(--grey)]"
                      }`}
                    >
                      {periodLabel}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-xs ${
                      isHighlighted
                        ? "text-[color:var(--charcoal)]"
                        : "text-[color:var(--grey)]"
                    }`}
                  >
                    {billingNote}
                  </p>
                  {isYearly && plan.yearlyNote && (
                    <p
                      className={`mt-1 text-xs ${
                        isHighlighted
                          ? "text-[color:var(--charcoal)]"
                          : "text-[color:var(--grey)]"
                      }`}
                    >
                      {plan.yearlyNote}
                    </p>
                  )}
                  <ul className="mt-6 space-y-2 text-sm">
                    {plan.inherits && (
                      <li className="flex items-start gap-2 font-semibold text-[color:var(--charcoal)]">
                        <span>{`${plan.inherits}:`}</span>
                      </li>
                    )}
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-[color:var(--charcoal)]" />
                        <span className="text-[color:var(--charcoal)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className={`mt-8 w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isHighlighted
                      ? "border-2 border-[color:var(--charcoal)] bg-[color:var(--orange)] text-[color:var(--charcoal)] hover:brightness-95"
                      : "border-2 border-[color:var(--charcoal)]/30 text-[color:var(--charcoal)] hover:border-[color:var(--charcoal)]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </section>

        <section id="student" className="mt-8">
          <div className="flex flex-col items-start gap-6 rounded-[32px] border-2 border-[color:var(--charcoal)] bg-[color:var(--orange)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Student Discount</h3>
              <p className="mt-1 text-sm text-[color:var(--charcoal)]">
                Students get 50% off the Pro plan.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border-2 border-[color:var(--charcoal)] bg-[color:var(--periwinkle)] px-5 py-2 text-sm font-semibold text-[color:var(--charcoal)] transition hover:brightness-95"
            >
              Get started
            </button>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">Refill Packs</h2>
            <span className="text-xs text-[color:var(--grey)]">
              Bulk savings, no subscriptions.
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {refillPacks.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col gap-4 rounded-[24px] border-2 border-[color:var(--charcoal)]/35 bg-white/90 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{pack.name}</h3>
                      <span className="rounded-full border border-[color:var(--charcoal)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--grey)]">
                        {pack.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[color:var(--grey)]">
                      {pack.images}{" "}
                      {pack.savings && (
                        <span className="text-[#16A34A]">{pack.savings}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">{pack.price}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-full border-2 border-[color:var(--charcoal)] bg-[color:var(--periwinkle)] px-4 py-2 text-xs font-semibold text-[color:var(--charcoal)] transition hover:brightness-95"
                >
                  Buy credits
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[32px] bg-[color:var(--charcoal)] px-6 py-10 text-[color:var(--white)] sm:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold">Built for Brands & Scale.</h2>
                <p className="mt-3 text-sm text-[color:var(--white)]/80">
                  Need more than standard generations? We build custom
                  infrastructure for agencies requiring:
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/70 px-5 py-2 text-sm font-semibold text-white transition hover:border-white"
              >
                Contact Sales
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Fine-Tuned Models: Train AI on your brand assets.",
                "Dedicated GPU Clusters: Zero wait times.",
                "SSO & NDA Mode: Enterprise-grade security.",
                "Data deletion policies & compliance support.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--white)]" />
                  <span className="text-[color:var(--white)]/90">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="plans-features" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-3xl text-center sm:text-4xl">
            Plans & features
          </h2>
          <div className="mt-8 rounded-[28px] border border-[color:var(--charcoal)]/20 bg-[color:var(--white)] px-4 py-6 sm:px-6">
            <div className="space-y-10">
              {featureGroups.map((group) => (
                <div key={group.title}>
                  <div className="overflow-x-auto">
                    <div className="min-w-0 sm:min-w-[640px]">
                      <div className="hidden grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] items-center gap-4 border-b border-[color:var(--charcoal)]/10 pb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--charcoal)] sm:grid">
                        <span>{group.title}</span>
                        <span className="text-center">Free</span>
                        <span className="text-center">Pro</span>
                        <span className="text-center">Business</span>
                      </div>
                      <div className="divide-y divide-[color:var(--charcoal)]/10">
                        {group.rows.map((row) => (
                          <div key={row.label} className="py-4">
                            <div className="hidden grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] items-center gap-4 text-sm sm:grid">
                              <span className="text-[color:var(--charcoal)]">
                                {row.label}
                              </span>
                              <span className="flex justify-center">
                                {renderPlanValue(row.free)}
                              </span>
                              <span className="flex justify-center">
                                {renderPlanValue(row.pro)}
                              </span>
                              <span className="flex justify-center">
                                {renderPlanValue(row.enterprise)}
                              </span>
                            </div>
                            <div className="sm:hidden">
                              <p className="text-sm font-semibold text-[color:var(--charcoal)]">
                                {row.label}
                              </p>
                              <div className="mt-3 grid gap-2 text-xs text-[color:var(--charcoal)]">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[color:var(--grey)]">
                                    Free
                                  </span>
                                  <span>{renderPlanValue(row.free)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[color:var(--grey)]">
                                    Pro
                                  </span>
                                  <span>{renderPlanValue(row.pro)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[color:var(--grey)]">
                                    Business
                                  </span>
                                  <span>{renderPlanValue(row.enterprise)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl text-left sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group self-start rounded-[28px] border-2 border-[color:var(--charcoal)]/15 bg-[var(--white)] px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-[color:var(--charcoal)]">
                  <span>{item.question}</span>
                  <ChevronDown className="h-4 w-4 text-[color:var(--charcoal)] transition group-open:rotate-180" />
                </summary>
                <div className="mt-4 space-y-2 text-sm leading-relaxed text-[color:var(--charcoal)]/80">
                  {item.paragraphs.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {item.bullets && (
                    <ul className="space-y-1 pl-5 text-[color:var(--charcoal)]/80">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.footer && <p>{item.footer}</p>}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
