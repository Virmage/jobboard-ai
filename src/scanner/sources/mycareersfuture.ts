import type { RawJob } from "../types";
import {
  fetchJSON,
  sleep,
  titleMatchesCreativeLeadership,
  isWithinCutoff,
  ALL_SEARCH_QUERIES,
} from "../utils";

const CUTOFF_DAYS = 14;

/**
 * MyCareersFuture API job result shape.
 */
interface MCFJob {
  uuid: string;
  title: string;
  metadata: {
    jobPostId: string;
    newPostingDate: string;
    expiryDate?: string;
  };
  postedCompany: {
    name: string;
  };
  address: {
    block?: string;
    street?: string;
    postalCode?: string;
    addressLine?: string;
  };
  salary?: {
    minimum?: { amount: number };
    maximum?: { amount: number };
    type?: { salaryType: string };
  };
  employmentTypes?: string[];
  categories?: Array<{ category: string }>;
  description?: string;
}

interface MCFResponse {
  results: MCFJob[];
  total: number;
}

/**
 * Scan MyCareersFuture (Singapore Government job board) via JSON API.
 *
 * MCF provides a public JSON API at /api/v2/search.
 * Market: Singapore, Categories: all. No authentication required.
 */
export async function scanMyCareersFuture(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  // Use a representative subset
  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

  for (const query of queries) {
    const params = new URLSearchParams({
      search: query,
      sortBy: "new_posting_date",
      limit: "100",
      page: "0",
    });

    const url = `https://www.mycareersfuture.gov.sg/api/v2/search?${params}`;
    const data = await fetchJSON<MCFResponse>(url);

    if (!data?.results) {
      await sleep(2_000);
      continue;
    }

    for (const job of data.results) {
      if (!job.uuid || seenIds.has(job.uuid)) continue;
      if (!titleMatchesCreativeLeadership(job.title)) continue;

      // Date filter
      const postedDate = job.metadata?.newPostingDate
        ? new Date(job.metadata.newPostingDate)
        : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenIds.add(job.uuid);

      const salary =
        job.salary?.minimum?.amount && job.salary?.maximum?.amount
          ? `S$${job.salary.minimum.amount.toLocaleString()} - S$${job.salary.maximum.amount.toLocaleString()}`
          : undefined;

      jobs.push({
        title: job.title,
        company: job.postedCompany?.name || "See listing",
        location: "Singapore",
        link: `https://www.mycareersfuture.gov.sg/job/${job.uuid}`,
        source: "MyCareersFuture",
        description: job.description?.slice(0, 500),
        salary,
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(2_000);
  }

  return jobs;
}
