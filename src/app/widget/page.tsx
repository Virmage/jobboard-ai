"use client";

import { useState, useMemo } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INDUSTRIES = [
  { slug: "", label: "All Industries" },
  { slug: "crypto", label: "Crypto" },
  { slug: "ai-startups", label: "AI / Startups" },
  { slug: "advertising", label: "Advertising" },
  { slug: "finance", label: "Fintech" },
  { slug: "saas", label: "SaaS" },
  { slug: "gaming", label: "Gaming" },
  { slug: "healthtech", label: "HealthTech" },
  { slug: "ecommerce", label: "E-commerce" },
];

const MARKETS = [
  { slug: "", label: "All Markets" },
  { slug: "US", label: "US" },
  { slug: "EU", label: "Europe" },
  { slug: "APAC", label: "Asia-Pacific" },
  { slug: "Global", label: "Global" },
];

const LIMITS = [3, 5, 10];

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

// ---------------------------------------------------------------------------
// Mock widget preview
// ---------------------------------------------------------------------------
function WidgetPreview({
  industry,
  market,
  limit,
  theme,
}: {
  industry: string;
  market: string;
  limit: number;
  theme: string;
}) {
  const isDark = theme === "dark";

  // Mock job data for preview
  const mockJobs = [
    {
      title: "Senior Software Engineer",
      company: "Acme Protocol",
      location: "Remote",
      isRemote: true,
    },
    {
      title: "Creative Director",
      company: "DeFi Labs",
      location: "San Francisco, CA",
      isRemote: false,
    },
    {
      title: "Product Manager",
      company: "TechCo",
      location: "New York, NY",
      isRemote: false,
    },
    {
      title: "Data Scientist",
      company: "AI Startup",
      location: "Remote",
      isRemote: true,
    },
    {
      title: "UX Designer",
      company: "DesignFirm",
      location: "London, UK",
      isRemote: false,
    },
    {
      title: "DevOps Engineer",
      company: "CloudCo",
      location: "Remote",
      isRemote: true,
    },
    {
      title: "Marketing Manager",
      company: "GrowthCo",
      location: "Berlin, DE",
      isRemote: false,
    },
    {
      title: "Frontend Developer",
      company: "WebStudio",
      location: "Remote",
      isRemote: true,
    },
    {
      title: "Backend Engineer",
      company: "InfraCo",
      location: "Sydney, AU",
      isRemote: false,
    },
    {
      title: "ML Engineer",
      company: "NeuraCorp",
      location: "Remote",
      isRemote: true,
    },
  ];

  const displayJobs = mockJobs.slice(0, limit);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark
          ? "border-[#262626] bg-[#111111]"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Widget header */}
      <div
        className={`px-4 py-3 border-b ${
          isDark ? "border-[#262626]" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Jobs{industry ? ` in ${INDUSTRIES.find((i) => i.slug === industry)?.label ?? industry}` : ""}
            {market ? ` (${market})` : ""}
          </span>
          <span
            className={`text-[10px] ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Powered by JobBoard AI
          </span>
        </div>
      </div>

      {/* Job list */}
      <div className="divide-y divide-border">
        {displayJobs.map((job, i) => (
          <div
            key={i}
            className={`px-4 py-3 transition-colors ${
              isDark ? "hover:bg-[#1a1a1a]" : "hover:bg-gray-50"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {job.title}
            </p>
            <div
              className={`mt-0.5 flex items-center gap-2 text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>{job.company}</span>
              <span>&middot;</span>
              <span>{job.location}</span>
              {job.isRemote && (
                <span
                  className={`rounded px-1 py-0.5 text-[10px] ${
                    isDark
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-purple-50 text-purple-600"
                  }`}
                >
                  Remote
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Widget footer */}
      <div
        className={`px-4 py-2.5 border-t ${
          isDark ? "border-[#262626]" : "border-gray-200"
        }`}
      >
        <span
          className={`text-[10px] ${
            isDark ? "text-blue-400" : "text-blue-600"
          }`}
        >
          View all jobs on JobBoard AI &rarr;
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function WidgetPage() {
  const [industry, setIndustry] = useState("");
  const [market, setMarket] = useState("");
  const [limit, setLimit] = useState(5);
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);

  const embedCode = useMemo(() => {
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    if (market) params.set("market", market);
    params.set("max", String(limit));
    params.set("theme", theme);
    return `<script\n  src="https://jobboard-ai.com/api/widget?${params.toString()}"\n  async>\n</script>`;
  }, [industry, market, limit, theme]);

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Embeddable Job Widget
          </h1>
          <p className="mt-3 text-text-secondary">
            Add a live job feed to any website with a single line of code.
            Configure it below and copy the embed snippet.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {/* Configuration */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Configuration
            </h2>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.slug} value={ind.slug}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Market */}
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">
                Market
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              >
                {MARKETS.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">
                Number of jobs
              </label>
              <div className="flex gap-3">
                {LIMITS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLimit(l)}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      limit === l
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-surface text-text-secondary hover:border-border-hover"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">
                Theme
              </label>
              <div className="flex gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      theme === t.value
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-surface text-text-secondary hover:border-border-hover"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Embed code */}
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wider">
                Embed Code
              </label>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-border bg-[#0a0a0a] p-4 text-xs text-text-secondary leading-relaxed">
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 rounded-md border border-border bg-surface px-2.5 py-1 text-[10px] font-medium text-text-tertiary transition-colors hover:border-border-hover hover:text-text-secondary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Preview
            </h2>
            <div
              className={`rounded-xl border border-border p-6 ${
                theme === "dark" ? "bg-[#0a0a0a]" : "bg-gray-100"
              }`}
            >
              <WidgetPreview
                industry={industry}
                market={market}
                limit={limit}
                theme={theme}
              />
            </div>
            <p className="mt-3 text-xs text-text-tertiary text-center">
              This is a preview. The live widget will display real job data from
              the API.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
