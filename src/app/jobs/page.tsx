"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string | null;
  salary: string | null;
  isRemote: boolean;
  isFeatured: boolean;
  region: string | null;
  postedAt: string | null;
  lastSeenAt: string;
  freshness: {
    score: number;
    label: string;
    tier: string;
  };
  industry: { name: string; slug: string } | null;
  taxonomy: { canonicalTitle: string; slug: string } | null;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface SearchResponse {
  jobs: Job[];
  pagination: Pagination;
  meta: {
    query_expanded_to: string | null;
    sort: string;
    filters: Record<string, string | boolean | null>;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INDUSTRIES = [
  { slug: "crypto", label: "Crypto" },
  { slug: "ai-startups", label: "AI / Startups" },
  { slug: "advertising", label: "Advertising" },
  { slug: "finance", label: "Fintech" },
  { slug: "saas", label: "SaaS" },
  { slug: "gaming", label: "Gaming" },
  { slug: "healthtech", label: "HealthTech" },
  { slug: "ecommerce", label: "E-commerce" },
  { slug: "media", label: "Media" },
  { slug: "climate", label: "Climate" },
];

const MARKETS = [
  { slug: "US", label: "US" },
  { slug: "EU", label: "UK / Europe" },
  { slug: "APAC", label: "Asia-Pacific" },
  { slug: "Global", label: "Global" },
];

const ROLE_TYPES = [
  { slug: "engineering", label: "Engineering" },
  { slug: "design", label: "Design" },
  { slug: "product", label: "Product" },
  { slug: "marketing", label: "Marketing" },
  { slug: "sales", label: "Sales" },
  { slug: "operations", label: "Operations" },
  { slug: "data", label: "Data / Analytics" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// ---------------------------------------------------------------------------
// Freshness Badge
// ---------------------------------------------------------------------------
function FreshnessBadge({ freshness }: { freshness: Job["freshness"] }) {
  const tierColors: Record<string, string> = {
    very_fresh: "bg-green/10 text-green",
    fresh: "bg-green/10 text-green",
    recent: "bg-yellow/10 text-yellow",
    aging: "bg-yellow/10 text-yellow",
    stale: "bg-red/10 text-red",
    expired: "bg-red/10 text-red",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${tierColors[freshness.tier] ?? "bg-border text-text-tertiary"}`}
    >
      {freshness.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Filter Group
// ---------------------------------------------------------------------------
function FilterGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { slug: string; label: string }[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.slug}
            onClick={() => onSelect(selected === opt.slug ? null : opt.slug)}
            className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
              selected === opt.slug
                ? "bg-accent/10 text-accent font-medium"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job Card
// ---------------------------------------------------------------------------
function JobCard({ job }: { job: Job }) {
  const timeAgo = job.postedAt ? getTimeAgo(new Date(job.postedAt)) : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`group block rounded-xl border p-5 transition-all ${
        job.isFeatured
          ? "border-accent/30 bg-accent/[0.03] hover:border-accent/50 hover:bg-accent/[0.06]"
          : "border-border bg-surface hover:border-border-hover hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.isFeatured && (
              <span className="rounded bg-yellow/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow uppercase tracking-wider">
                Featured
              </span>
            )}
            <FreshnessBadge freshness={job.freshness} />
            {job.isRemote && (
              <span className="rounded bg-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-purple">
                Remote
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
            {job.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span className="font-medium">{job.company}</span>
            {job.location && (
              <>
                <span className="text-text-tertiary">&middot;</span>
                <span>{job.location}</span>
              </>
            )}
            {job.salary && (
              <>
                <span className="text-text-tertiary">&middot;</span>
                <span className="text-green">{job.salary}</span>
              </>
            )}
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          {timeAgo && <p className="text-xs text-text-tertiary">{timeAgo}</p>}
          {job.source && (
            <p className="mt-1 text-[10px] text-text-tertiary">
              via {job.source}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.industry && (
          <span className="rounded border border-border px-2 py-0.5 text-[10px] text-text-tertiary">
            {job.industry.name}
          </span>
        )}
        {job.region && (
          <span className="rounded border border-border px-2 py-0.5 text-[10px] text-text-tertiary">
            {job.region}
          </span>
        )}
        {job.taxonomy && (
          <span className="rounded border border-border px-2 py-0.5 text-[10px] text-text-tertiary">
            {job.taxonomy.canonicalTitle}
          </span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [remote, setRemote] = useState<boolean>(false);
  const [roleType, setRoleType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Alert signup state
  const [alertEmail, setAlertEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState("");

  const handleAlertSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) return;
    setAlertLoading(true);
    setAlertError("");
    try {
      const searchName = [
        query || "All jobs",
        industry ? INDUSTRIES.find(i => i.slug === industry)?.label : null,
        region ? MARKETS.find(m => m.slug === region)?.label : null,
        remote ? "Remote" : null,
      ].filter(Boolean).join(" · ");

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: alertEmail,
          name: searchName,
          query: query || null,
          industry: industry || null,
          region: region || null,
          is_remote: remote || null,
          frequency: "daily",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create alert");
      }
      setAlertSuccess(true);
    } catch (err) {
      setAlertError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAlertLoading(false);
    }
  }, [alertEmail, query, industry, region, remote]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (industry) params.set("industry", industry);
    if (region) params.set("region", region);
    if (remote) params.set("remote", "true");
    if (roleType) params.set("role", roleType);
    params.set("page", String(page));
    params.set("per_page", "20");

    try {
      const res = await fetch(`/api/v1/jobs?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      // Silent fail — keep current data
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [query, industry, region, remote, roleType, page]);

  useEffect(() => {
    const debounce = setTimeout(
      () => {
        fetchJobs();
      },
      initialLoad ? 0 : 300
    );
    return () => clearTimeout(debounce);
  }, [fetchJobs, initialLoad]);

  useEffect(() => {
    setPage(1);
  }, [query, industry, region, remote, roleType]);

  const activeFilterCount = [industry, region, roleType, remote || null].filter(
    Boolean
  ).length;

  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-6xl gap-8 px-6 pt-20 pb-20">
        {/* Sidebar */}
        <aside
          className={`shrink-0 ${
            sidebarOpen
              ? "fixed inset-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm lg:relative lg:bg-transparent lg:backdrop-blur-none"
              : "hidden lg:block"
          } lg:w-56`}
        >
          <div
            className={`${
              sidebarOpen
                ? "absolute left-0 top-0 h-full w-64 border-r border-border bg-[#0a0a0a] p-6 pt-20 overflow-y-auto"
                : ""
            } lg:sticky lg:top-20 lg:h-fit lg:pt-4`}
          >
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary lg:hidden"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            <div className="space-y-6">
              <FilterGroup
                title="Industry"
                options={INDUSTRIES}
                selected={industry}
                onSelect={setIndustry}
              />
              <FilterGroup
                title="Market"
                options={MARKETS}
                selected={region}
                onSelect={setRegion}
              />
              <FilterGroup
                title="Role Type"
                options={ROLE_TYPES}
                selected={roleType}
                onSelect={setRoleType}
              />

              {/* Remote toggle */}
              <div>
                <h3 className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Remote
                </h3>
                <button
                  onClick={() => setRemote(!remote)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    remote
                      ? "bg-purple/10 text-purple font-medium"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      remote ? "bg-purple" : "bg-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                        remote ? "translate-x-[14px]" : "translate-x-[2px]"
                      }`}
                    />
                  </span>
                  Remote only
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setIndustry(null);
                    setRegion(null);
                    setRoleType(null);
                    setRemote(false);
                  }}
                  className="w-full rounded-md border border-border px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:border-border-hover hover:text-text-secondary"
                >
                  Clear all filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pt-4">
          {/* Search input */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-tertiary transition-colors hover:border-border-hover hover:text-text-primary lg:hidden"
              aria-label="Open filters"
            >
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
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
            </button>
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by role, company, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>

          {/* Active filter pills (mobile) */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
              {industry && (
                <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[10px] text-accent">
                  {INDUSTRIES.find((i) => i.slug === industry)?.label}
                  <button onClick={() => setIndustry(null)}>&times;</button>
                </span>
              )}
              {region && (
                <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[10px] text-accent">
                  {MARKETS.find((m) => m.slug === region)?.label}
                  <button onClick={() => setRegion(null)}>&times;</button>
                </span>
              )}
              {remote && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple/10 px-2 py-1 text-[10px] text-purple">
                  Remote
                  <button onClick={() => setRemote(false)}>&times;</button>
                </span>
              )}
            </div>
          )}

          {/* Alert signup banner */}
          {data && data.jobs.length > 0 && !alertSuccess && (
            <div className="mt-6 rounded-xl border border-accent/20 bg-accent/[0.04] px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Get daily email alerts for these jobs
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    We scan 60+ sources every day — new matches sent straight to your inbox.
                  </p>
                </div>
                <form onSubmit={handleAlertSignup} className="flex gap-2 shrink-0">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                    required
                    className="h-9 w-48 rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={alertLoading}
                    className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {alertLoading ? "…" : "Alert me"}
                  </button>
                </form>
              </div>
              {alertError && (
                <p className="mt-2 text-xs text-red">{alertError}</p>
              )}
            </div>
          )}
          {alertSuccess && (
            <div className="mt-6 rounded-xl border border-green/20 bg-green/[0.04] px-5 py-4 text-sm text-green">
              ✓ You&apos;re set — check your inbox for a confirmation. We&apos;ll email you daily matches.
            </div>
          )}

          {/* Results meta */}
          {data && (
            <div className="mt-4 mb-4 flex items-center justify-between">
              <p className="text-xs text-text-tertiary">
                {data.pagination.total.toLocaleString()} result
                {data.pagination.total !== 1 ? "s" : ""}
                {query && (
                  <>
                    {" "}
                    for{" "}
                    <span className="text-text-secondary">
                      &quot;{query}&quot;
                    </span>
                  </>
                )}
                {data.meta.query_expanded_to && (
                  <span className="ml-2 text-accent">
                    (expanded to: {data.meta.query_expanded_to})
                  </span>
                )}
              </p>
              {loading && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {initialLoad && (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-border bg-surface p-5"
                >
                  <div className="h-3 w-20 rounded bg-border" />
                  <div className="mt-3 h-4 w-64 rounded bg-border" />
                  <div className="mt-2 h-3 w-40 rounded bg-border" />
                </div>
              ))}
            </div>
          )}

          {/* Jobs list */}
          {!initialLoad && data && (
            <>
              {data.jobs.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface py-16 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-text-tertiary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <p className="mt-3 text-sm text-text-secondary">
                    No jobs found matching your search.
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data.pagination.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.pagination.has_prev}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: Math.min(5, data.pagination.total_pages) },
                    (_, i) => {
                      const start = Math.max(
                        1,
                        Math.min(page - 2, data.pagination.total_pages - 4)
                      );
                      const pageNum = start + i;
                      if (pageNum > data.pagination.total_pages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                            pageNum === page
                              ? "bg-accent text-white"
                              : "border border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text-primary"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.pagination.has_next}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
