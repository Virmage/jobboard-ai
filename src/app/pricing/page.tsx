import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Pricing — JobBoard AI",
  description:
    "Simple, transparent pricing for JobBoard AI. Free tier for hobbyists, Pro for power users, Enterprise for scale.",
};

// ---------------------------------------------------------------------------
// Check icon
// ---------------------------------------------------------------------------
function Check() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-green"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for hobbyists and testing the API.",
      features: [
        "100 queries per day",
        "Basic search with filters",
        "20 results per query",
        "Role intelligence (read-only)",
        "Community support",
      ],
      cta: "Get Free API Key",
      ctaHref: "/docs#authentication",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "For developers building AI-powered job tools.",
      features: [
        "10,000 queries per day",
        "100 results per query",
        "Full role intelligence API",
        "Job alerts via webhook",
        "Freshness scoring",
        "Priority support",
        "Custom search presets",
      ],
      cta: "Start Pro Trial",
      ctaHref: "/docs#authentication",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "$499",
      period: "/month",
      description: "Unlimited access with dedicated support and SLAs.",
      features: [
        "Unlimited queries",
        "Unlimited results per query",
        "Custom role taxonomies",
        "Dedicated account manager",
        "99.9% uptime SLA",
        "Custom data feeds",
        "White-label widget",
        "Priority feature requests",
      ],
      cta: "Contact Sales",
      ctaHref: "mailto:hello@jobboard-ai.com",
      highlight: false,
    },
  ];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-text-secondary">
            Start free. Scale when you need to. No hidden fees.
          </p>
        </div>

        {/* API Tiers */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                tier.highlight
                  ? "border-accent/40 bg-accent/[0.03]"
                  : "border-border bg-surface"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {tier.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-text-primary">
                    {tier.price}
                  </span>
                  <span className="text-sm text-text-tertiary">
                    {tier.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  {tier.description}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "border border-border bg-surface-hover text-text-primary hover:border-border-hover"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Employer Featured Listings */}
        <div id="employers" className="mt-24 scroll-mt-20">
          <div className="text-center">
            <p className="text-sm font-medium text-yellow">For Employers</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Featured Listings
            </h2>
            <p className="mt-3 text-text-secondary">
              Get your job listing in front of every AI agent searching for
              matching roles.
            </p>
          </div>

          <div className="mt-12 mx-auto max-w-3xl">
            <div className="rounded-xl border border-yellow/20 bg-yellow/[0.03] p-8">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
                <div className="shrink-0 rounded-xl bg-yellow/10 p-4">
                  <svg
                    className="h-8 w-8 text-yellow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary">
                    $299 per listing
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    30-day featured placement across all AI search results. Your
                    listing appears first when AI agents search for matching
                    roles through our API, MCP server, or ChatGPT Actions.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      "Priority placement in all AI search results",
                      "Featured badge across all platforms and widgets",
                      "Real-time analytics: impressions, clicks, applications",
                      "Schema.org structured data included",
                      "Renewal and multi-listing discounts available",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <Check />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/dashboard"
                      className="rounded-lg bg-yellow px-5 py-2.5 text-center text-sm font-medium text-black transition-colors hover:bg-yellow/90"
                    >
                      Create Featured Listing
                    </Link>
                    <Link
                      href="/docs#employers"
                      className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-surface-hover"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-center text-2xl font-bold tracking-tight text-text-primary">
            Frequently asked questions
          </h2>
          <div className="mt-10 mx-auto max-w-3xl divide-y divide-border">
            {[
              {
                q: "Can I switch plans at any time?",
                a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle.",
              },
              {
                q: "What happens when I hit my rate limit?",
                a: "The API returns a 429 status code with a Retry-After header. Your access resumes at midnight UTC or you can upgrade for higher limits.",
              },
              {
                q: "Do you offer a free trial of Pro?",
                a: "Yes, all new Pro accounts get a 14-day free trial with full access. No credit card required to start.",
              },
              {
                q: "How does the featured listing work?",
                a: "When any AI agent queries our API with a role matching your listing, your job appears at the top of results with a Featured badge. This works across Claude, ChatGPT, and all integrated platforms.",
              },
              {
                q: "Can I use the free tier in production?",
                a: "Absolutely. The free tier is production-ready with 100 queries per day. Many smaller projects run successfully on the free tier.",
              },
            ].map((faq) => (
              <div key={faq.q} className="py-5">
                <h3 className="text-sm font-semibold text-text-primary">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
