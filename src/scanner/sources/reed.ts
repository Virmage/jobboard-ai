import type { RawJob } from "../types";
import {
  fetchJSONWithAuth,
  sleep,
  isWithinCutoff,
  ALL_SEARCH_QUERIES,
} from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Reed API job result shape (simplified).
 */
interface ReedJob {
  jobId: number;
  employerName: string;
  jobTitle: string;
  locationName: string;
  jobDescription: string;
  jobUrl: string;
  date: string;
  expirationDate: string;
  minimumSalary: number | null;
  maximumSalary: number | null;
}

interface ReedSearchResponse {
  results: ReedJob[];
  totalResults: number;
}

/**
 * Search keywords — covers all major job categories.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_,i) => i % 5 === 0);

/**
 * Scan Reed UK API for creative leadership roles.
 *
 * Reed offers a free API at https://www.reed.co.uk/api/1.0/search
 * using basic auth with the API key as username (password empty).
 *
 * Set REED_API_KEY in your environment to use this scanner.
 */
export async function scanReed(): Promise<RawJob[]> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) {
    console.warn(
      "  [Reed] REED_API_KEY not set — skipping. Get a free key at https://www.reed.co.uk/developers/jobseeker",
    );
    return [];
  }

  const jobs: RawJob[] = [];
  const seenIds = new Set<number>();

  for (const query of SEARCH_QUERIES) {
    const params = new URLSearchParams({
      keywords: query,
      resultsToTake: "50",
      resultsToSkip: "0",
    });

    const data = await fetchJSONWithAuth<ReedSearchResponse>(
      `https://www.reed.co.uk/api/1.0/search?${params}`,
      apiKey,
      "",
      15_000,
    );

    if (!data?.results) {
      await sleep(1_500);
      continue;
    }

    for (const job of data.results) {
      if (seenIds.has(job.jobId)) continue;


      // Date filter
      const postedDate = job.date ? new Date(job.date) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenIds.add(job.jobId);

      const salary =
        job.minimumSalary && job.maximumSalary
          ? `£${job.minimumSalary.toLocaleString()} - £${job.maximumSalary.toLocaleString()}`
          : job.minimumSalary
            ? `From £${job.minimumSalary.toLocaleString()}`
            : undefined;

      jobs.push({
        title: job.jobTitle,
        company: job.employerName || "See listing",
        location: job.locationName || "United Kingdom",
        link: job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
        source: "Reed",
        description: job.jobDescription?.slice(0, 500),
        salary,
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(1_500);
  }

  return jobs;
}
