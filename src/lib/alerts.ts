import { db } from "@/db/index";
import { savedSearches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { searchJobs, type SearchJobsParams } from "@/db/queries";

// ---------------------------------------------------------------------------
// Frequency → millisecond thresholds
// ---------------------------------------------------------------------------
const FREQUENCY_MS: Record<string, number> = {
  instant: 0,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// sendAlertEmail — stub for now
// ---------------------------------------------------------------------------
async function sendAlertEmail(
  email: string,
  searchName: string | null,
  matchCount: number,
  searchId: string
): Promise<void> {
  // TODO: integrate email provider (e.g. Resend, SendGrid, SES)
  console.log(
    `TODO: integrate email provider — would send alert to ${email} ` +
      `for saved search "${searchName ?? searchId}" with ${matchCount} new match(es)`
  );
}

// ---------------------------------------------------------------------------
// checkAlerts — run all active saved searches, notify if new matches
// ---------------------------------------------------------------------------
export async function checkAlerts(): Promise<void> {
  const now = new Date();

  // Fetch all active saved searches
  const activeSearches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.isActive, true));

  for (const search of activeSearches) {
    const thresholdMs = FREQUENCY_MS[search.frequency] ?? FREQUENCY_MS.daily;

    // Check if enough time has passed since last notification
    if (search.lastNotifiedAt) {
      const elapsed = now.getTime() - search.lastNotifiedAt.getTime();
      if (elapsed < thresholdMs) {
        continue;
      }
    }

    // Build search params from saved filters
    const params: SearchJobsParams = {
      query: search.query ?? undefined,
      industrySlug: search.industrySlug ?? undefined,
      taxonomySlug: search.taxonomySlug ?? undefined,
      region: search.region ?? undefined,
      isRemote: search.isRemote ?? undefined,
      limit: 50,
      offset: 0,
    };

    const result = await searchJobs(params);

    // Filter to only jobs posted after lastNotifiedAt
    const cutoff = search.lastNotifiedAt ?? search.createdAt;
    const newJobs = result.jobs.filter(
      (job) => job.postedAt && new Date(job.postedAt) > cutoff
    );

    if (newJobs.length > 0) {
      await sendAlertEmail(
        search.email,
        search.name,
        newJobs.length,
        search.id
      );

      // Update lastNotifiedAt
      await db
        .update(savedSearches)
        .set({ lastNotifiedAt: now })
        .where(eq(savedSearches.id, search.id));
    }
  }
}
