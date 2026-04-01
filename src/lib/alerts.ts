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
  region: string | null;
}

// Classify a job into a region bucket for email grouping
const APAC_PATTERNS = /australia|sydney|melbourne|brisbane|perth|auckland|singapore|tokyo|hong kong|bangkok|seoul|mumbai|delhi|bangalore|jakarta|manila|kuala lumpur|taipei|vietnam|hanoi|ho chi minh|new zealand|india|japan|china|philippines|malaysia|thailand|indonesia|apac|asia|oceania/i;
const REMOTE_PATTERNS = /remote|anywhere|global|worldwide|distributed/i;

function classifyRegion(job: JobSummary): "apac" | "americas" | "emea" | "remote" | "other" {
  const loc = job.location ?? "";
  const region = job.region ?? "";

  if (APAC_PATTERNS.test(loc) || region === "apac") return "apac";
  if (REMOTE_PATTERNS.test(loc) || region === "remote") return "remote";
  if (/europe|uk|london|berlin|paris|amsterdam|dublin|spain|germany|france|italy|switzerland|sweden|norway|denmark|emea/i.test(loc) || region === "emea") return "emea";
  if (/united states|usa|us|canada|new york|san francisco|los angeles|chicago|toronto|americas|latin america|brazil|mexico/i.test(loc) || region === "americas") return "americas";
  return "other";
}

function renderJobRow(j: JobSummary): string {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e1e2e">
        <a href="${APP_URL}/go/${j.id}" style="color:#a78bfa;text-decoration:none;font-weight:600;font-size:15px">${j.title}</a>
        <div style="color:#94a3b8;font-size:13px;margin-top:4px">${j.company ?? "Unknown"} &middot; ${j.location ?? "Remote"}</div>
      </td>
    </tr>`;
}

function renderSection(title: string, emoji: string, jobs: JobSummary[]): string {
  if (jobs.length === 0) return "";
  const rows = jobs.map(renderJobRow).join("");
  const more = "";
  return `
    <div style="margin:24px 0 0">
      <div style="background:#1e1e2e;padding:10px 16px;border-radius:8px 8px 0 0;border-bottom:2px solid #a78bfa">
        <span style="font-size:14px;font-weight:700;color:#e2e8f0;letter-spacing:0.5px">${emoji} ${title}</span>
        <span style="float:right;color:#a78bfa;font-size:13px;font-weight:600">${jobs.length} role${jobs.length === 1 ? "" : "s"}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#13131f">${rows}${more}</table>
    </div>`;
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

  // Group jobs by region, APAC first
  const groups: Record<string, JobSummary[]> = { apac: [], remote: [], americas: [], emea: [], other: [] };
  for (const job of jobs) {
    groups[classifyRegion(job)].push(job);
  }

  const sections = [
    renderSection("Asia Pacific & Australia", "🌏", groups.apac),
    renderSection("Remote / Global", "🌐", groups.remote),
    renderSection("Americas", "🌎", groups.americas),
    renderSection("Europe, Middle East & Africa", "🌍", groups.emea),
    renderSection("Other", "📍", groups.other),
  ].join("");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e1e2e 0%,#0a0a14 100%);padding:32px 24px 24px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#a78bfa;letter-spacing:-0.5px">AgentJobs</div>
        <div style="color:#94a3b8;font-size:14px;margin-top:8px">${jobs.length} new role${jobs.length === 1 ? "" : "s"} matching <strong style="color:#e2e8f0">${searchName ?? "your search"}</strong></div>
      </div>
      <div style="padding:0 24px 24px">
        ${sections}
        <div style="text-align:center;margin-top:32px">
          <a href="${APP_URL}/jobs" style="display:inline-block;background:#a78bfa;color:#0a0a14;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View all jobs</a>
        </div>
        <hr style="border:none;border-top:1px solid #1e1e2e;margin:32px 0 16px">
        <div style="text-align:center">
          <span style="color:#475569;font-size:11px">Powered by <a href="${APP_URL}" style="color:#a78bfa;text-decoration:none">AgentJobs</a></span>
          <span style="color:#334155;font-size:11px">&nbsp;&middot;&nbsp;</span>
          <a href="${APP_URL}/api/alerts/unsubscribe?id=${searchId}" style="color:#475569;font-size:11px;text-decoration:none">Unsubscribe</a>
        </div>
      </div>
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

    // Parse special prefixes from query field:
    //   "location:sydney|<terms>"  → post-filter to Sydney + remote jobs
    //   "remote:true|<terms>"      → post-filter to remote-only jobs
    let locationFilter: string | null = null;
    let remoteOnly = false;
    let cleanQuery = search.query ?? undefined;

    if (search.query?.startsWith("location:")) {
      const [prefix, ...rest] = search.query.split("|");
      locationFilter = prefix.replace("location:", "").trim();
      cleanQuery = rest.join("|").trim() || undefined;
    } else if (search.query?.startsWith("remote:true")) {
      remoteOnly = true;
      const rest = search.query.replace(/^remote:true\|?/, "").trim();
      cleanQuery = rest || undefined;
    }

    // Build search params — post-filter handles location/remote below
    const params: SearchJobsParams = {
      query: cleanQuery,
      industrySlug: search.industrySlug ?? undefined,
      taxonomySlug: search.taxonomySlug ?? undefined,
      region: locationFilter ? undefined : (search.region ?? undefined),
      includeRemote: !locationFilter && !remoteOnly && search.region != null,
      isRemote: search.isRemote ?? undefined,
      limit: 500,
      offset: 0,
    };

    const result = await searchJobs(params);

    // Always show all jobs from the last 7 days, regardless of when last email was sent.
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let newJobs = result.jobs.filter((job) => {
      const jobDate = job.scannedAt ? new Date(job.scannedAt) : (job.postedAt ? new Date(job.postedAt) : null);
      return jobDate && jobDate > sevenDaysAgo;
    });

    // Remote-only filter: strip any job that isn't flagged remote or has "remote" in title/location
    const remoteRe = /\bremote\b|global|worldwide|anywhere|distributed/i;
    if (remoteOnly) {
      newJobs = newJobs.filter((job) => {
        const loc = job.location ?? "";
        const title = job.title ?? "";
        return job.isRemote || remoteRe.test(loc) || remoteRe.test(title);
      });
    }

    // Location filter: keep only jobs matching the city/country OR remote/global
    if (locationFilter) {
      // Build city + country aliases (e.g. "sydney" also matches "australia", "nsw")
      const LOCATION_ALIASES: Record<string, string[]> = {
        sydney: ["sydney", "australia", "nsw", "new south wales"],
      };
      const aliases = LOCATION_ALIASES[locationFilter.toLowerCase()] ?? [locationFilter];
      const cityRe = new RegExp(aliases.join("|"), "i");
      newJobs = newJobs.filter((job) => {
        const loc = job.location ?? "";
        const title = job.title ?? "";
        return cityRe.test(loc) || remoteRe.test(loc) || remoteRe.test(title) || job.isRemote;
      });
    }

    if (newJobs.length > 0) {
      await sendAlertEmail(
        search.email,
        search.name,
        newJobs.map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          region: j.region,
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
