import type { RawJob } from "../types";

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY ?? "";
const BASE_URL = "https://jsearch.p.rapidapi.com/search";

/** Max results per query (JSearch max is 10 per page, we fetch up to 2 pages = 20). */
const MAX_PAGES = 2;

/** Max concurrent query fetches — keeps us under RapidAPI rate limits.
 *  Basic plan: 500 req/month. At 3 concurrent × 2 pages × 30 queries = 180 req/run.
 *  That's ~2-3 runs/month on Basic; upgrade to Pro for daily runs. */
const CONCURRENCY = 3;

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_apply_link?: string;
  job_description?: string;
  job_salary_currency?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_posted_at_timestamp?: number;
}

interface JSearchResponse {
  data?: JSearchJob[];
  status?: string;
}

async function fetchPage(query: string, page: number): Promise<JSearchJob[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("num_pages", "1");
  url.searchParams.set("date_posted", "week");

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
      "x-rapidapi-key": JSEARCH_API_KEY,
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    console.warn(`  JSearch: HTTP ${res.status} for "${query}" page ${page}`);
    return [];
  }

  const json = (await res.json()) as JSearchResponse;
  return json.data ?? [];
}

async function fetchQuery(query: string): Promise<JSearchJob[]> {
  const results: JSearchJob[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const pageResults = await fetchPage(query, page);
      if (pageResults.length === 0) break;
      results.push(...pageResults);
    } catch (err) {
      console.warn(`  JSearch: error for "${query}" page ${page}:`, err);
      break;
    }
  }
  return results;
}

function formatLocation(job: JSearchJob): string {
  if (job.job_is_remote) return "Remote";
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(", ") || "Unknown";
}

function formatSalary(job: JSearchJob): string | undefined {
  if (!job.job_min_salary && !job.job_max_salary) return undefined;
  const currency = job.job_salary_currency ?? "USD";
  if (job.job_min_salary && job.job_max_salary) {
    return `${currency} ${job.job_min_salary.toLocaleString()} – ${job.job_max_salary.toLocaleString()}`;
  }
  const val = job.job_min_salary ?? job.job_max_salary;
  return `${currency} ${val!.toLocaleString()}`;
}

/**
 * Scan JSearch (RapidAPI) for jobs matching the given queries.
 * Aggregates Indeed, Glassdoor, ZipRecruiter, and more.
 * Fetches queries in parallel batches of CONCURRENCY to stay within timeout.
 */
export async function scanJSearch(queries: string[]): Promise<RawJob[]> {
  if (!JSEARCH_API_KEY) {
    console.log("  JSearch: JSEARCH_API_KEY not set — skipping");
    return [];
  }

  const seen = new Set<string>();
  const jobs: RawJob[] = [];

  // Process queries in parallel batches
  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    const batch = queries.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fetchQuery));

    for (const results of batchResults) {
      for (const j of results) {
        const key = `${j.job_title}|${j.employer_name}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        jobs.push({
          title: j.job_title,
          company: j.employer_name,
          location: formatLocation(j),
          link: j.job_apply_link ?? "",
          source: "jsearch",
          description: j.job_description?.slice(0, 2000),
          salary: formatSalary(j),
          postedAt: j.job_posted_at_timestamp
            ? new Date(j.job_posted_at_timestamp * 1000)
            : undefined,
        });
      }
    }

    console.log(`  JSearch: processed ${Math.min(i + CONCURRENCY, queries.length)}/${queries.length} queries, ${jobs.length} jobs so far`);
  }

  return jobs;
}
