"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Listing {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobServeCount: number;
  jobIsFeatured: boolean;
  jobFeaturedUntil: string | null;
  startsAt: string;
  endsAt: string;
  amountPaid: number;
}

interface DailyServe {
  date: string;
  totalServes: number;
}

// ---------------------------------------------------------------------------
// Auth forms (Login / Register)
// ---------------------------------------------------------------------------
function AuthForms({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/employers/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          company_name: mode === "register" ? companyName : undefined,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Employer Portal
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Manage your featured listings and track AI search analytics.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8">
        {/* Mode toggle */}
        <div className="flex rounded-lg bg-[#0a0a0a] p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "login"
                ? "bg-surface-hover text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "register"
                ? "bg-surface-hover text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={mode === "register"}
                className="w-full rounded-lg border border-border bg-[#0a0a0a] px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
                placeholder="Acme Inc."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-[#0a0a0a] px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-border bg-[#0a0a0a] px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red/30 bg-red/10 px-4 py-2 text-sm text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Listing Form
// ---------------------------------------------------------------------------
function NewListingForm({ onClose }: { onClose: () => void }) {
  const [jobId, setJobId] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const pricing: Record<number, string> = {
    7: "$49",
    30: "$299",
    90: "$699",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/employers/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, duration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to create checkout");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Create Featured Listing
        </h2>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors"
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1.5">
            Job ID
          </label>
          <input
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-[#0a0a0a] px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
            placeholder="Paste the job UUID from the API"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-2">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`rounded-lg border py-3 text-center transition-colors ${
                  duration === d
                    ? "border-accent/40 bg-accent/10 text-text-primary"
                    : "border-border bg-[#0a0a0a] text-text-secondary hover:border-border-hover"
                }`}
              >
                <span className="block text-lg font-semibold">
                  {pricing[d]}
                </span>
                <span className="block text-xs mt-1 text-text-tertiary">
                  {d} days
                </span>
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-yellow/30 bg-yellow/10 px-4 py-2 text-sm text-yellow">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? "Redirecting to payment..." : "Proceed to Payment"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Content
// ---------------------------------------------------------------------------
function DashboardContent() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [daily, setDaily] = useState<DailyServe[]>([]);
  const [totalServesThisWeek, setTotalServesThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "analytics" | "api-keys">("overview");

  useEffect(() => {
    async function load() {
      try {
        const [listingsRes, analyticsRes] = await Promise.all([
          fetch("/api/employers/listings"),
          fetch("/api/employers/analytics"),
        ]);

        if (listingsRes.status === 401 || analyticsRes.status === 401) {
          setIsAuthenticated(false);
          return;
        }

        const listingsData = await listingsRes.json();
        const analyticsData = await analyticsRes.json();

        setListings(listingsData.listings ?? []);
        setDaily(analyticsData.daily ?? []);
        setTotalServesThisWeek(analyticsData.totalServesThisWeek ?? 0);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function getStatus(listing: Listing): { label: string; isExpired: boolean } {
    if (!listing.jobFeaturedUntil) return { label: "Expired", isExpired: true };
    const until = new Date(listing.jobFeaturedUntil);
    if (until < new Date()) return { label: "Expired", isExpired: true };
    return { label: "Active", isExpired: false };
  }

  const maxDailyServes = Math.max(...daily.map((d) => d.totalServes), 1);
  const activeListings = listings.filter((l) => !getStatus(l).isExpired);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-[#0a0a0a] p-1 mb-8 overflow-x-auto">
        {(
          [
            { key: "overview", label: "Overview" },
            { key: "listings", label: "Listings" },
            { key: "analytics", label: "Analytics" },
            { key: "api-keys", label: "API Keys" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-surface-hover text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                AI Searches This Week
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {totalServesThisWeek.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Active Listings
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {activeListings.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Total Listings
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {listings.length}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setActiveTab("listings");
              }}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Add Featured Listing
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-surface-hover"
            >
              View Analytics
            </button>
          </div>

          {/* Recent listings */}
          <div>
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Recent Listings
            </h3>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface py-12 text-center">
                <p className="text-sm text-text-secondary">
                  No listings yet. Feature a job to boost its visibility.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listings.slice(0, 6).map((listing) => {
                  const status = getStatus(listing);
                  return (
                    <div
                      key={listing.id}
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-text-primary truncate">
                            {listing.jobTitle}
                          </h4>
                          <p className="text-xs text-text-tertiary">
                            {listing.jobCompany}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                            status.isExpired
                              ? "bg-red/10 text-red"
                              : "bg-green/10 text-green"
                          }`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {listing.jobServeCount.toLocaleString()} AI searches
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Featured Listings
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {showAddForm ? "Cancel" : "Add Listing"}
            </button>
          </div>

          {showAddForm && (
            <NewListingForm onClose={() => setShowAddForm(false)} />
          )}

          {listings.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface py-12 text-center">
              <p className="text-sm text-text-secondary">
                No featured listings yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-tertiary text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Job</th>
                    <th className="text-left px-5 py-3">Company</th>
                    <th className="text-left px-5 py-3">Ends</th>
                    <th className="text-right px-5 py-3">Serves</th>
                    <th className="text-center px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => {
                    const status = getStatus(listing);
                    return (
                      <tr
                        key={listing.id}
                        className="border-b border-border last:border-0 hover:bg-surface-hover"
                      >
                        <td className="px-5 py-3 font-medium text-text-primary">
                          {listing.jobTitle}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {listing.jobCompany}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {new Date(listing.endsAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-text-primary">
                          {listing.jobServeCount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              status.isExpired
                                ? "bg-red/10 text-red"
                                : "bg-green/10 text-green"
                            }`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Serves This Week
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {totalServesThisWeek.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Active Listings
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {activeListings.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Avg Serves/Day
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {daily.length > 0
                  ? Math.round(
                      daily.reduce((sum, d) => sum + d.totalServes, 0) /
                        daily.length
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              AI Serves Per Day (Last 30 Days)
            </h3>
            {daily.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                No serve data yet. Data will appear once your listings are
                returned in AI searches.
              </p>
            ) : (
              <>
                <div className="flex items-end gap-1 h-48">
                  {daily.map((day) => {
                    const heightPct =
                      (day.totalServes / maxDailyServes) * 100;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 group relative"
                      >
                        <div
                          className="w-full bg-accent/60 hover:bg-accent/80 rounded-t transition-colors min-h-[2px]"
                          style={{
                            height: `${Math.max(heightPct, 1)}%`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                  <span>
                    {new Date(daily[0].date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>
                    {new Date(
                      daily[daily.length - 1].date
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              API Key Management
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your API keys for programmatic access.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Production Key
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Created on sign-up
                </p>
              </div>
              <span className="rounded-md bg-green/10 px-2 py-0.5 text-[10px] font-medium text-green">
                Active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-lg border border-border bg-[#0a0a0a] px-4 py-2.5 text-sm text-text-tertiary font-mono">
                aj_******************************
              </code>
              <button className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary">
                Reveal
              </button>
              <button className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary">
                Regenerate
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Usage this month
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 rounded-full bg-[#0a0a0a] overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-accent" />
                </div>
              </div>
              <span className="text-xs text-text-tertiary">
                33 / 100 requests today
              </span>
            </div>
            <p className="mt-3 text-xs text-text-tertiary">
              <Link href="/pricing" className="text-accent hover:underline">
                Upgrade to Pro
              </Link>{" "}
              for 10,000 requests per day.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth by pinging listings endpoint
    fetch("/api/employers/listings")
      .then((res) => setIsAuthenticated(res.status !== 401))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
          <div className="flex items-center justify-center py-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        {isAuthenticated ? (
          <DashboardContent />
        ) : (
          <AuthForms onSuccess={() => setIsAuthenticated(true)} />
        )}
      </main>
    </>
  );
}
