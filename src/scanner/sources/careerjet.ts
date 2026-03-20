import type { RawJob } from "../types";
import { fetchJSON, sleep, titleMatchesCreativeLeadership, isWithinCutoff, ALL_SEARCH_QUERIES } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Careerjet API response shapes.
 */
interface CareerjetJob {
  title: string;
  company: string;
  locations: string;
  url: string;
  description: string;
  date: string; // e.g. "Mon, 10 Mar 2025"
  salary: string;
  site: string;
}

interface CareerjetResponse {
  type: string;
  hits: number;
  pages: number;
  page: number;
  jobs: CareerjetJob[];
}

/**
 * Locale configs for multi-country searching.
 * Each entry maps to a Careerjet locale code and default location.
 */
const LOCALES = [
  { locale_code: "en_US", location: "United States" },
  { locale_code: "en_GB", location: "United Kingdom" },
  { locale_code: "en_AU", location: "Australia" },
  { locale_code: "de_DE", location: "Germany" },
  { locale_code: "fr_FR", location: "France" },
  { locale_code: "nl_NL", location: "Netherlands" },
];

/**
 * Subset of search queries to keep API calls reasonable across locales.
 */
const SEARCH_SUBSET = [
  "Software Engineer", "Product Manager", "Data Scientist",
  "Marketing Manager", "UX Designer", "DevOps Engineer",
  "Engineering Manager", "Sales Manager", "Financial Analyst",
  "HR Manager", "Project Manager", "Account Executive",
];

/**
 * Scan Careerjet Partner API for jobs across multiple locales.
 *
 * Endpoint: http://public.api.careerjet.net/search (JSON)
 * Requires affid parameter (env var CAREERJET_AFFID).
 * Market: global (90+ countries).
 */
export async function scanCareerjet(): Promise<RawJob[]> {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) {
    console.warn(
      "  [Careerjet] CAREERJET_AFFID not set — skipping. Get a free affiliate ID at https://www.careerjet.com/partners/",
    );
    return [];
  }

  const jobs: RawJob[] = [];
  const seenUrls = new Set<string>();

  for (const loc of LOCALES) {
    for (const query of SEARCH_SUBSET) {
      const params = new URLSearchParams({
        keywords: query,
        location: loc.location,
        locale_code: loc.locale_code,
        affid,
        user_ip: "0.0.0.0",
        user_agent: "Mozilla/5.0",
        pagesize: "50",
        page: "1",
        sort: "date",
      });

      const data = await fetchJSON<CareerjetResponse>(
        `http://public.api.careerjet.net/search?${params}`,
      );

      if (!data?.jobs?.length) {
        await sleep(1_000);
        continue;
      }

      for (const job of data.jobs) {
        if (!job.url || seenUrls.has(job.url)) continue;
        if (!titleMatchesCreativeLeadership(job.title)) continue;

        // Date filter
        const postedDate = job.date ? new Date(job.date) : null;
        if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

        seenUrls.add(job.url);

        jobs.push({
          title: job.title,
          company: job.company || "See listing",
          location: job.locations || loc.location,
          link: job.url,
          source: "Careerjet",
          description: job.description?.slice(0, 500),
          salary: job.salary || undefined,
          postedAt: postedDate ?? undefined,
        });
      }

      await sleep(1_200);
    }
  }

  return jobs;
}
