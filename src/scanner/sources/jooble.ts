import type { RawJob } from "../types";
import { sleep, titleMatchesCreativeLeadership, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Jooble API job shape.
 */
interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string; // ISO date string
  id: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

/**
 * Search queries — subset for Jooble to keep requests manageable.
 */
const SEARCH_QUERIES = [
  "Software Engineer", "Senior Software Engineer", "Frontend Engineer",
  "Backend Engineer", "Fullstack Engineer", "DevOps Engineer",
  "Product Manager", "Data Scientist", "Data Analyst",
  "UX Designer", "Product Designer", "Marketing Manager",
  "Engineering Manager", "Sales Manager", "Account Executive",
  "Financial Analyst", "HR Manager", "Project Manager",
  "ML Engineer", "AI Engineer", "Cloud Engineer",
];

/**
 * Scan Jooble API for jobs globally.
 *
 * Endpoint: https://jooble.org/api/{api_key}
 * POST request with {keywords, location, page}.
 * Requires free API key (env var JOOBLE_API_KEY).
 * Market: global (71 countries).
 */
export async function scanJooble(): Promise<RawJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.warn(
      "  [Jooble] JOOBLE_API_KEY not set — skipping. Get a free key at https://jooble.org/api/about",
    );
    return [];
  }

  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    for (let page = 1; page <= 2; page++) {
      try {
        const res = await fetch(`https://jooble.org/api/${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": UA,
          },
          body: JSON.stringify({
            keywords: query,
            location: "",
            page: String(page),
          }),
          signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
          await sleep(2_000);
          continue;
        }

        const data = (await res.json()) as JoobleResponse;
        if (!data?.jobs?.length) break;

        for (const job of data.jobs) {
          const id = job.id || job.link;
          if (!id || seenIds.has(id)) continue;
          if (!titleMatchesCreativeLeadership(job.title)) continue;

          // Date filter
          const postedDate = job.updated ? new Date(job.updated) : null;
          if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

          seenIds.add(id);

          jobs.push({
            title: job.title,
            company: job.company || "See listing",
            location: job.location || "Global",
            link: job.link,
            source: "Jooble",
            description: job.snippet?.slice(0, 500),
            salary: job.salary || undefined,
            postedAt: postedDate ?? undefined,
          });
        }
      } catch {
        // Continue on error
      }

      await sleep(1_500);
    }
  }

  return jobs;
}
