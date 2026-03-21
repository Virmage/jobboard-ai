import type { RawJob } from "../types";
import { sleep, isWithinCutoff, ALL_SEARCH_QUERIES } from "../utils";

const CUTOFF_DAYS = 14;
const UA = "Mozilla/5.0 (compatible; JobScanner/1.0)";

/**
 * USAJobs API result shapes.
 */
interface USAJobsResult {
  MatchedObjectId: string;
  MatchedObjectDescriptor: {
    PositionTitle: string;
    OrganizationName: string;
    PositionLocationDisplay: string;
    PositionURI: string;
    UserArea: {
      Details: {
        MajorDuties?: string[];
      };
    };
    PositionRemuneration: Array<{
      MinimumRange: string;
      MaximumRange: string;
      RateIntervalCode: string;
    }>;
    PublicationStartDate: string;
    PositionStartDate: string;
    ApplicationCloseDate: string;
  };
}

interface USAJobsResponse {
  SearchResult: {
    SearchResultCount: number;
    SearchResultCountAll: number;
    SearchResultItems: USAJobsResult[];
  };
}

/**
 * Subset of queries relevant to government roles.
 */
const GOV_QUERIES = [
  "Software Engineer", "Data Scientist", "Data Analyst",
  "Cybersecurity", "IT Specialist", "Program Manager",
  "Project Manager", "Financial Analyst", "Accountant",
  "Human Resources", "Contracting Officer", "Policy Analyst",
  "Operations Research", "Economist", "Statistician",
  "Engineering", "Scientist", "Researcher",
  "Attorney", "Paralegal", "Budget Analyst",
  "Communications", "Public Affairs",
];

/**
 * Scan USAJobs government jobs API.
 *
 * Endpoint: https://data.usajobs.gov/api/Search
 * Requires free API key via Authorization-Key header.
 * Also needs User-Agent header with email.
 * Set USAJOBS_API_KEY and USAJOBS_EMAIL in your environment.
 * Market: US government.
 */
export async function scanUSAJobs(): Promise<RawJob[]> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL || "jobscanner@example.com";

  if (!apiKey) {
    console.warn(
      "  [USAJobs] USAJOBS_API_KEY not set — skipping. Get a free key at https://developer.usajobs.gov/",
    );
    return [];
  }

  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  for (const query of GOV_QUERIES) {
    try {
      const params = new URLSearchParams({
        Keyword: query,
        ResultsPerPage: "50",
        DatePosted: "14", // last 14 days
      });

      const res = await fetch(
        `https://data.usajobs.gov/api/Search?${params}`,
        {
          headers: {
            "Authorization-Key": apiKey,
            "User-Agent": email,
            Accept: "application/json",
            Host: "data.usajobs.gov",
          },
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        await sleep(2_000);
        continue;
      }

      const data = (await res.json()) as USAJobsResponse;
      const items = data?.SearchResult?.SearchResultItems;
      if (!items?.length) {
        await sleep(1_000);
        continue;
      }

      for (const item of items) {
        const desc = item.MatchedObjectDescriptor;
        const id = item.MatchedObjectId;

        if (!id || seenIds.has(id)) continue;


        const postedDate = desc.PublicationStartDate
          ? new Date(desc.PublicationStartDate)
          : null;
        if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

        seenIds.add(id);

        // Build salary string
        const remun = desc.PositionRemuneration?.[0];
        const salary = remun
          ? `$${parseInt(remun.MinimumRange).toLocaleString()} - $${parseInt(remun.MaximumRange).toLocaleString()} ${remun.RateIntervalCode}`
          : undefined;

        jobs.push({
          title: desc.PositionTitle,
          company: desc.OrganizationName || "US Government",
          location: desc.PositionLocationDisplay || "United States",
          link: desc.PositionURI || `https://www.usajobs.gov/job/${id}`,
          source: "USAJobs",
          description: desc.UserArea?.Details?.MajorDuties?.join(" ")?.slice(0, 500),
          salary,
          postedAt: postedDate ?? undefined,
        });
      }
    } catch {
      // Continue to next query on error
    }

    await sleep(1_500);
  }

  return jobs;
}
