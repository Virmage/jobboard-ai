import { FRESHNESS_THRESHOLDS } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FreshnessResult {
  /** Normalized score from 0 (stale) to 1 (very fresh) */
  score: number;
  /** Human-readable label like "verified 2 hours ago" */
  label: string;
  /** Category key */
  tier: "very_fresh" | "fresh" | "recent" | "aging" | "stale" | "expired";
}

// ---------------------------------------------------------------------------
// getFreshnessScore — returns score + label + tier
// ---------------------------------------------------------------------------
export function getFreshnessScore(
  lastSeenAt: Date | string | null | undefined
): FreshnessResult {
  if (!lastSeenAt) {
    return { score: 0, label: "freshness unknown", tier: "expired" };
  }

  const seen = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const now = new Date();
  const hoursAgo = (now.getTime() - seen.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 0) {
    // Future date — treat as very fresh
    return { score: 1, label: "just verified", tier: "very_fresh" };
  }

  if (hoursAgo < FRESHNESS_THRESHOLDS.VERY_FRESH) {
    const score = 1 - hoursAgo / FRESHNESS_THRESHOLDS.VERY_FRESH * 0.1;
    return {
      score: Math.max(0.9, score),
      label: getFreshnessLabel(seen),
      tier: "very_fresh",
    };
  }

  if (hoursAgo < FRESHNESS_THRESHOLDS.FRESH) {
    const score =
      0.9 -
      ((hoursAgo - FRESHNESS_THRESHOLDS.VERY_FRESH) /
        (FRESHNESS_THRESHOLDS.FRESH - FRESHNESS_THRESHOLDS.VERY_FRESH)) *
        0.2;
    return {
      score: Math.max(0.7, score),
      label: getFreshnessLabel(seen),
      tier: "fresh",
    };
  }

  if (hoursAgo < FRESHNESS_THRESHOLDS.RECENT) {
    const score =
      0.7 -
      ((hoursAgo - FRESHNESS_THRESHOLDS.FRESH) /
        (FRESHNESS_THRESHOLDS.RECENT - FRESHNESS_THRESHOLDS.FRESH)) *
        0.2;
    return {
      score: Math.max(0.5, score),
      label: getFreshnessLabel(seen),
      tier: "recent",
    };
  }

  if (hoursAgo < FRESHNESS_THRESHOLDS.AGING) {
    const score =
      0.5 -
      ((hoursAgo - FRESHNESS_THRESHOLDS.RECENT) /
        (FRESHNESS_THRESHOLDS.AGING - FRESHNESS_THRESHOLDS.RECENT)) *
        0.2;
    return {
      score: Math.max(0.3, score),
      label: getFreshnessLabel(seen),
      tier: "aging",
    };
  }

  if (hoursAgo < FRESHNESS_THRESHOLDS.STALE) {
    const score =
      0.3 -
      ((hoursAgo - FRESHNESS_THRESHOLDS.AGING) /
        (FRESHNESS_THRESHOLDS.STALE - FRESHNESS_THRESHOLDS.AGING)) *
        0.2;
    return {
      score: Math.max(0.1, score),
      label: getFreshnessLabel(seen),
      tier: "stale",
    };
  }

  return {
    score: 0.05,
    label: getFreshnessLabel(seen),
    tier: "expired",
  };
}

// ---------------------------------------------------------------------------
// getFreshnessLabel — human-readable "verified X ago" string
// ---------------------------------------------------------------------------
export function getFreshnessLabel(
  lastSeenAt: Date | string | null | undefined
): string {
  if (!lastSeenAt) return "freshness unknown";

  const seen = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  const now = new Date();
  const diffMs = now.getTime() - seen.getTime();

  if (diffMs < 0) return "just verified";

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "verified just now";
  if (minutes < 60) return `verified ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `verified ${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "verified yesterday";
  if (days < 7) return `verified ${days} days ago`;
  if (days < 14) return "verified last week";
  if (days < 30) return `verified ${Math.floor(days / 7)} weeks ago`;
  return `verified ${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}
