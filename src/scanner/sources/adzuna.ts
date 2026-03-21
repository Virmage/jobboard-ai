import type { RawJob } from "../types";
import {
  fetchJSON,
  sleep,
  isWithinCutoff,
  ALL_SEARCH_QUERIES,
} from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Adzuna API job result shape.
 */
interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  redirect_url: string;
  description: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

/**
 * Adzuna country configs. Each country has its own API subdomain.
 * API docs: https://developer.adzuna.com/
 *
 * Set ADZUNA_APP_ID and ADZUNA_API_KEY in your environment.
 * Free tier: 250 calls/month per app.
 * Sign up at https://developer.adzuna.com/signup
 */
const COUNTRIES: Array<{
  code: string;
  name: string;
  region: string;
  currency: string;
}> = [
  { code: "au", name: "Australia", region: "APAC", currency: "A$" },
  { code: "gb", name: "United Kingdom", region: "EU", currency: "£" },
  { code: "us", name: "United States", region: "US", currency: "$" },
  { code: "de", name: "Germany", region: "EU", currency: "€" },
  { code: "fr", name: "France", region: "EU", currency: "€" },
  { code: "nl", name: "Netherlands", region: "EU", currency: "€" },
];

/**
 * Search keywords — covers all major job categories.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_,i) => i % 5 === 0);

/**
 * Scan Adzuna API for creative leadership roles across AU, UK, US, DE, FR, NL.
 *
 * Adzuna has a free public API. Set ADZUNA_APP_ID and ADZUNA_API_KEY.
 * Sign up at https://developer.adzuna.com/signup
 */
export async function scanAdzuna(): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    console.warn(
      "  [Adzuna] ADZUNA_APP_ID or ADZUNA_API_KEY not set — skipping. Sign up at https://developer.adzuna.com/signup",
    );
    return [];
  }

  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  for (const country of COUNTRIES) {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: apiKey,
        results_per_page: "50",
        what: query,
        max_days_old: String(CUTOFF_DAYS),
        sort_by: "date",
        content_type: "application/json",
      });

      const url = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?${params}`;
      const data = await fetchJSON<AdzunaResponse>(url);

      if (!data?.results) {
        await sleep(1_000);
        continue;
      }

      for (const job of data.results) {
        if (seenIds.has(job.id)) continue;


        // Date filter
        const postedDate = job.created ? new Date(job.created) : null;
        if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

        seenIds.add(job.id);

        const salary =
          job.salary_min && job.salary_max
            ? `${country.currency}${Math.round(job.salary_min).toLocaleString()} - ${country.currency}${Math.round(job.salary_max).toLocaleString()}`
            : undefined;

        jobs.push({
          title: job.title,
          company: job.company?.display_name || "See listing",
          location: job.location?.display_name || country.name,
          link: job.redirect_url,
          source: `Adzuna (${country.code.toUpperCase()})`,
          description: job.description?.slice(0, 500),
          salary,
          postedAt: postedDate ?? undefined,
        });
      }

      await sleep(1_000); // respect rate limits
    }
  }

  return jobs;
}
