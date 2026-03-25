import { db } from "@/db/index";
import { savedSearches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { searchJobs, type SearchJobsParams } from "@/db/queries";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://jobboard-ai-rllv.vercel.app";

// ---------------------------------------------------------------------------
// Frequency → millisecond thresholds
// ---------------------------------------------------------------------------
const FREQUENCY_MS: Record<string, number> = {
  instant: 0,
  daily: 24 * 60 * 60 * 1000,
  "every-2-days": 2 * 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// sendAlertEmail — sends via Resend
// ---------------------------------------------------------------------------
interface JobSummary {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
}

async function sendAlertEmail(
  email: string,
  searchName: string | null,
  jobs: JobSummary[],
  searchId: string
): Promise<void> {
  if (!resend) {
    console.log(`[alerts] Resend not configured — would send ${jobs.length} jobs to ${email}`);
    return;
  }

  const jobRows = jobs
    .slice(0, 20)
    .map(
      (j) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #333"><a href="${APP_URL}/go/${j.id}" style="color:#7c6af6;text-decoration:none;font-weight:600">${j.title}</a><br><span style="color:#999">${j.company ?? "Unknown"} · ${j.location ?? "Remote"}</span></td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;padding:24px;border-radius:8px">
      <h2 style="color:#7c6af6;margin-top:0">AgentJobs Alert</h2>
      <p>${jobs.length} new job${jobs.length === 1 ? "" : "s"} matching "${searchName ?? "your search"}"</p>
      <table style="width:100%;border-collapse:collapse">${jobRows}</table>
      ${jobs.length > 20 ? `<p style="color:#999;margin-top:12px">...and ${jobs.length - 20} more</p>` : ""}
      <p style="margin-top:24px"><a href="${APP_URL}/jobs" style="color:#7c6af6">View all jobs →</a></p>
      <hr style="border:none;border-top:1px solid #333;margin:24px 0">
      <p style="color:#666;font-size:12px"><a href="${APP_URL}/api/alerts/unsubscribe?id=${searchId}" style="color:#666">Unsubscribe</a></p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "AgentJobs <onboarding@resend.dev>",
    to: email,
    subject: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} — ${searchName ?? "AgentJobs Alert"}`,
    html,
  });

  console.log(`[alerts] Sent ${jobs.length} jobs to ${email}`);
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

    // Filter to only jobs seen after lastNotifiedAt (use scannedAt as fallback for missing postedAt)
    const cutoff = search.lastNotifiedAt ?? search.createdAt;
    const newJobs = result.jobs.filter((job) => {
      const jobDate = job.postedAt ? new Date(job.postedAt) : (job.scannedAt ? new Date(job.scannedAt) : null);
      return jobDate && jobDate > cutoff;
    });

    if (newJobs.length > 0) {
      await sendAlertEmail(
        search.email,
        search.name,
        newJobs.map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
        })),
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
