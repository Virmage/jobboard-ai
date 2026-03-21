import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getJobById } from "@/db/queries";
import { getFreshnessScore } from "@/lib/freshness";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return { title: "Job Not Found" };

  const title = `${job.title} at ${job.company} — AgentJobs`;
  const description = job.description
    ? job.description.slice(0, 160)
    : `${job.title} position at ${job.company}. Found by AgentJobs.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function FreshnessBadge({ label, tier }: { label: string; tier: string }) {
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
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${tierColors[tier] ?? "bg-border text-text-tertiary"}`}
    >
      {label}
    </span>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  const freshness = getFreshnessScore(job.lastSeenAt);

  // Schema.org JobPosting JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? `${job.title} at ${job.company}`,
    datePosted: job.postedAt
      ? new Date(job.postedAt).toISOString()
      : undefined,
    validThrough: job.expiresAt
      ? new Date(job.expiresAt).toISOString()
      : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: job.isRemote
      ? { "@type": "VirtualLocation" }
      : job.location
        ? {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
            },
          }
        : undefined,
    jobLocationType: job.isRemote ? "TELECOMMUTE" : undefined,
    baseSalary: job.salary
      ? {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: { "@type": "QuantitativeValue", value: job.salary },
        }
      : undefined,
    url: job.link ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <div className="mx-auto flex max-w-6xl gap-8 px-6 pt-24 pb-20">
        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-text-tertiary">
            <Link
              href="/jobs"
              className="transition-colors hover:text-text-secondary"
            >
              Jobs
            </Link>
            <span>/</span>
            <span className="text-text-secondary truncate">{job.title}</span>
          </div>

          {/* Header card */}
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {job.isFeatured && (
                <span className="rounded bg-yellow/20 px-2 py-0.5 text-[10px] font-semibold text-yellow uppercase tracking-wider">
                  Featured
                </span>
              )}
              <FreshnessBadge label={freshness.label} tier={freshness.tier} />
              {job.isRemote && (
                <span className="rounded bg-purple/10 px-2 py-0.5 text-[10px] font-medium text-purple">
                  Remote
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {job.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">
                {job.company}
              </span>
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 text-text-tertiary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {job.location}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1.5 text-green">
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
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {job.salary}
                </span>
              )}
            </div>

            {/* Metadata grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-[#0a0a0a] p-3">
                <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Posted
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {formatDate(job.postedAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-[#0a0a0a] p-3">
                <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Last Seen
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {getTimeAgo(job.lastSeenAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-[#0a0a0a] p-3">
                <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Source
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {job.source ?? "Direct"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-[#0a0a0a] p-3">
                <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                  Region
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {job.region ?? (job.isRemote ? "Remote" : "N/A")}
                </p>
              </div>
            </div>

            {/* Apply button */}
            {job.link && (
              <div className="mt-6">
                <a
                  href={`/go/${job.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  Apply on {job.source ?? "company site"}
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
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-text-primary">
                Job Description
              </h2>
              <div className="mt-4 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          )}

          {/* API Access CTA */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-lg bg-accent/10 p-2">
                <svg
                  className="h-5 w-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Access this job via API
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Fetch this job programmatically for your AI agent or
                  application.
                </p>
                <code className="mt-3 block rounded-lg border border-border bg-[#0a0a0a] px-3 py-2 text-xs text-text-tertiary">
                  GET /api/v1/jobs/{id}
                </code>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to jobs
            </Link>
          </div>
        </main>

        {/* Sidebar: Related jobs placeholder */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4 pt-4">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Related Jobs
            </h3>
            <div className="space-y-3">
              {/* These would be fetched server-side in production */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-border bg-surface p-4"
                >
                  <div className="h-3 w-32 rounded bg-border" />
                  <div className="mt-2 h-2.5 w-24 rounded bg-border" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-tertiary">
              Related jobs based on role taxonomy matching.
            </p>
          </div>
        </aside>
      </div>
      <Footer />
    </>
  );
}
