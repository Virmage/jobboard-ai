"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RoleSuggestion {
  title: string;
  confidence: "high" | "medium" | "low";
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Confidence styling
// ---------------------------------------------------------------------------
const CONFIDENCE_STYLES = {
  high: {
    border: "border-green/30",
    bg: "bg-green/5",
    badge: "bg-green/10 text-green",
    label: "High match",
    activeBorder: "border-green/60",
    activeBg: "bg-green/10",
  },
  medium: {
    border: "border-yellow/30",
    bg: "bg-yellow/5",
    badge: "bg-yellow/10 text-yellow",
    label: "Medium match",
    activeBorder: "border-yellow/60",
    activeBg: "bg-yellow/10",
  },
  low: {
    border: "border-border",
    bg: "bg-surface",
    badge: "bg-surface-raised text-text-tertiary",
    label: "Low match",
    activeBorder: "border-border-hover",
    activeBg: "bg-surface-hover",
  },
};

// ---------------------------------------------------------------------------
// Mock role suggestion logic (client-side demo)
// In production, this would call /api/v1/roles/suggest
// ---------------------------------------------------------------------------
const ROLE_DATABASE: Record<string, RoleSuggestion[]> = {
  design: [
    { title: "Creative Director", confidence: "high", enabled: true },
    { title: "Design Director", confidence: "high", enabled: true },
    { title: "Head of Design", confidence: "high", enabled: true },
    { title: "Brand Director", confidence: "medium", enabled: true },
    { title: "Art Director", confidence: "medium", enabled: true },
    { title: "UX Director", confidence: "medium", enabled: true },
    { title: "VP of Creative", confidence: "medium", enabled: false },
    { title: "Senior Product Designer", confidence: "low", enabled: false },
    { title: "Design Lead", confidence: "low", enabled: false },
    { title: "Visual Designer", confidence: "low", enabled: false },
  ],
  engineering: [
    { title: "Software Engineer", confidence: "high", enabled: true },
    { title: "Senior Software Engineer", confidence: "high", enabled: true },
    { title: "Full Stack Developer", confidence: "high", enabled: true },
    { title: "Frontend Engineer", confidence: "medium", enabled: true },
    { title: "Backend Engineer", confidence: "medium", enabled: true },
    { title: "Staff Engineer", confidence: "medium", enabled: true },
    { title: "Engineering Manager", confidence: "medium", enabled: false },
    { title: "DevOps Engineer", confidence: "low", enabled: false },
    { title: "Platform Engineer", confidence: "low", enabled: false },
    { title: "Solutions Architect", confidence: "low", enabled: false },
  ],
  marketing: [
    { title: "Marketing Manager", confidence: "high", enabled: true },
    { title: "Head of Marketing", confidence: "high", enabled: true },
    { title: "Growth Marketing Manager", confidence: "high", enabled: true },
    { title: "Digital Marketing Manager", confidence: "medium", enabled: true },
    { title: "Content Marketing Manager", confidence: "medium", enabled: true },
    { title: "Performance Marketing Manager", confidence: "medium", enabled: true },
    { title: "VP of Marketing", confidence: "medium", enabled: false },
    { title: "Brand Manager", confidence: "low", enabled: false },
    { title: "Marketing Coordinator", confidence: "low", enabled: false },
    { title: "SEO Specialist", confidence: "low", enabled: false },
  ],
  product: [
    { title: "Product Manager", confidence: "high", enabled: true },
    { title: "Senior Product Manager", confidence: "high", enabled: true },
    { title: "Product Lead", confidence: "high", enabled: true },
    { title: "Head of Product", confidence: "medium", enabled: true },
    { title: "VP of Product", confidence: "medium", enabled: true },
    { title: "Technical Product Manager", confidence: "medium", enabled: true },
    { title: "Product Owner", confidence: "medium", enabled: false },
    { title: "Group Product Manager", confidence: "low", enabled: false },
    { title: "Chief Product Officer", confidence: "low", enabled: false },
    { title: "Product Analyst", confidence: "low", enabled: false },
  ],
  data: [
    { title: "Data Scientist", confidence: "high", enabled: true },
    { title: "Senior Data Scientist", confidence: "high", enabled: true },
    { title: "Machine Learning Engineer", confidence: "high", enabled: true },
    { title: "Data Analyst", confidence: "medium", enabled: true },
    { title: "Data Engineer", confidence: "medium", enabled: true },
    { title: "AI/ML Engineer", confidence: "medium", enabled: true },
    { title: "Analytics Engineer", confidence: "medium", enabled: false },
    { title: "Research Scientist", confidence: "low", enabled: false },
    { title: "Business Intelligence Analyst", confidence: "low", enabled: false },
    { title: "Quantitative Analyst", confidence: "low", enabled: false },
  ],
};

function matchRoles(description: string): RoleSuggestion[] {
  const lower = description.toLowerCase();

  // Simple keyword matching for demo purposes
  if (lower.includes("design") || lower.includes("creative") || lower.includes("brand") || lower.includes("visual"))
    return ROLE_DATABASE.design.map((r) => ({ ...r }));
  if (lower.includes("engineer") || lower.includes("developer") || lower.includes("code") || lower.includes("software"))
    return ROLE_DATABASE.engineering.map((r) => ({ ...r }));
  if (lower.includes("marketing") || lower.includes("growth") || lower.includes("content") || lower.includes("seo"))
    return ROLE_DATABASE.marketing.map((r) => ({ ...r }));
  if (lower.includes("product") || lower.includes("roadmap") || lower.includes("feature") || lower.includes("pm"))
    return ROLE_DATABASE.product.map((r) => ({ ...r }));
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("machine learning") || lower.includes("ai"))
    return ROLE_DATABASE.data.map((r) => ({ ...r }));

  // Default fallback: combine some results
  return [
    { title: "Product Manager", confidence: "medium", enabled: true },
    { title: "Software Engineer", confidence: "medium", enabled: true },
    { title: "Marketing Manager", confidence: "low", enabled: false },
    { title: "Data Analyst", confidence: "low", enabled: false },
    { title: "UX Designer", confidence: "low", enabled: false },
  ];
}

// ---------------------------------------------------------------------------
// Role Card
// ---------------------------------------------------------------------------
function RoleCard({
  role,
  onToggle,
}: {
  role: RoleSuggestion;
  onToggle: () => void;
}) {
  const styles = CONFIDENCE_STYLES[role.confidence];

  return (
    <button
      onClick={onToggle}
      className={`group flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
        role.enabled
          ? `${styles.activeBorder} ${styles.activeBg}`
          : `${styles.border} ${styles.bg} opacity-60 hover:opacity-80`
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle switch */}
        <span
          className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            role.enabled ? "bg-accent" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              role.enabled ? "translate-x-[18px]" : "translate-x-[2px]"
            }`}
          />
        </span>
        <span
          className={`text-sm font-medium truncate ${
            role.enabled ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {role.title}
        </span>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}>
        {styles.label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function RolesPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState<RoleSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);
    // Simulate API delay for magical feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    const results = matchRoles(description);
    setRoles(results);
    setHasSearched(true);
    setIsAnalyzing(false);
  }, [description]);

  const toggleRole = (index: number) => {
    setRoles((prev) =>
      prev.map((r, i) => (i === index ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const enabledRoles = roles.filter((r) => r.enabled);

  const handleSearch = () => {
    if (enabledRoles.length === 0) return;
    const titles = enabledRoles.map((r) => r.title).join(",");
    router.push(`/jobs?q=${encodeURIComponent(titles)}`);
  };

  const highMatches = roles.filter((r) => r.confidence === "high");
  const mediumMatches = roles.filter((r) => r.confidence === "medium");
  const lowMatches = roles.filter((r) => r.confidence === "low");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-20">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
            Role Intelligence
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Discover your role titles
          </h1>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Describe what you do and we&apos;ll find the job titles that match.
            Toggle the ones you want, then search across all of them at once.
          </p>
        </div>

        {/* Input area */}
        <div className="mt-10">
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAnalyze();
                }
              }}
              placeholder="I lead the design team at a crypto startup. I do brand strategy, manage a team of 5 designers, and oversee our visual identity across all platforms..."
              rows={4}
              className="w-full rounded-xl border border-border bg-surface p-4 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-text-tertiary">
              Ctrl+Enter to analyze
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!description.trim() || isAnalyzing}
            className="mt-4 w-full rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing your description...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                Find matching roles
              </span>
            )}
          </button>
        </div>

        {/* Results */}
        {hasSearched && !isAnalyzing && (
          <div className="mt-12 space-y-8">
            {/* Summary */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {roles.length} role titles found
                </p>
                <p className="text-xs text-text-tertiary">
                  {enabledRoles.length} selected for search
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setRoles((prev) => prev.map((r) => ({ ...r, enabled: true })))
                  }
                  className="rounded-md border border-border px-2.5 py-1 text-[10px] text-text-tertiary transition-colors hover:border-border-hover hover:text-text-secondary"
                >
                  Select all
                </button>
                <button
                  onClick={() =>
                    setRoles((prev) =>
                      prev.map((r) => ({ ...r, enabled: false }))
                    )
                  }
                  className="rounded-md border border-border px-2.5 py-1 text-[10px] text-text-tertiary transition-colors hover:border-border-hover hover:text-text-secondary"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* High confidence */}
            {highMatches.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green" />
                  <h3 className="text-sm font-medium text-text-primary">
                    High confidence ({highMatches.length})
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles
                    .map((r, i) => ({ role: r, index: i }))
                    .filter(({ role }) => role.confidence === "high")
                    .map(({ role, index }) => (
                      <RoleCard
                        key={role.title}
                        role={role}
                        onToggle={() => toggleRole(index)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Medium confidence */}
            {mediumMatches.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow" />
                  <h3 className="text-sm font-medium text-text-primary">
                    Medium confidence ({mediumMatches.length})
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles
                    .map((r, i) => ({ role: r, index: i }))
                    .filter(({ role }) => role.confidence === "medium")
                    .map(({ role, index }) => (
                      <RoleCard
                        key={role.title}
                        role={role}
                        onToggle={() => toggleRole(index)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Low confidence */}
            {lowMatches.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-text-tertiary" />
                  <h3 className="text-sm font-medium text-text-primary">
                    Lower confidence ({lowMatches.length})
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles
                    .map((r, i) => ({ role: r, index: i }))
                    .filter(({ role }) => role.confidence === "low")
                    .map(({ role, index }) => (
                      <RoleCard
                        key={role.title}
                        role={role}
                        onToggle={() => toggleRole(index)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Search CTA */}
            <div className="sticky bottom-6 z-30">
              <button
                onClick={handleSearch}
                disabled={enabledRoles.length === 0}
                className="w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {enabledRoles.length === 0
                  ? "Select at least one role to search"
                  : `Search jobs with ${enabledRoles.length} role title${enabledRoles.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* Example prompts */}
        {!hasSearched && (
          <div className="mt-16">
            <p className="mb-4 text-center text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Try these examples
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "I build and ship frontend features using React and TypeScript at a SaaS company",
                "I lead brand strategy and creative campaigns for a Web3 protocol",
                "I analyze user behavior data and build dashboards to inform product decisions",
                "I manage a product roadmap and work with engineering to ship features",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setDescription(example);
                  }}
                  className="rounded-xl border border-border bg-surface p-4 text-left text-xs text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover"
                >
                  &quot;{example}&quot;
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
