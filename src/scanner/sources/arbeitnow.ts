import type { RawJob } from "../types";
import { fetchJSON, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Arbeitnow API job shape.
 */
interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // unix timestamp
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: {
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
  };
}

/**
 * Scan Arbeitnow public API for German/EU creative leadership roles.
 *
 * Arbeitnow provides a free public API at https://www.arbeitnow.com/api/job-board-api
 * No authentication required. Paginates through results.
 */
export async function scanArbeitnow(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenSlugs = new Set<string>();
  let page = 1;
  const maxPages = 5;

  while (page <= maxPages) {
    const data = await fetchJSON<ArbeitnowResponse>(
      `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
    );

    if (!data?.data?.length) break;

    for (const job of data.data) {
      if (seenSlugs.has(job.slug)) continue;


      // Date filter
      const postedDate = job.created_at
        ? new Date(job.created_at * 1000)
        : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenSlugs.add(job.slug);
      jobs.push({
        title: job.title,
        company: job.company_name || "See listing",
        location: job.location || "Germany",
        link: job.url || `https://www.arbeitnow.com/view/${job.slug}`,
        source: "Arbeitnow",
        description: job.description?.slice(0, 500),
        postedAt: postedDate ?? undefined,
      });
    }

    if (!data.links.next || page >= data.meta.last_page) break;
    page++;
  }

  return jobs;
}
