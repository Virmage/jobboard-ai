import type { RawJob } from "../types";
import { fetchJSON, fetchText, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Jobicy API v2 response shapes.
 */
interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string; // ISO date
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  salaryCurrency?: string;
}

interface JobicyResponse {
  apiVersion: string;
  documentationUrl: string;
  friendlyMessage: string;
  jobCount: number;
  lastUpdate: string;
  jobs: JobicyJob[];
}

/**
 * Geographic/industry combos to search.
 */
const SEARCH_COMBOS = [
  { geo: "usa", industry: "engineering" },
  { geo: "usa", industry: "marketing" },
  { geo: "usa", industry: "design" },
  { geo: "usa", industry: "finance" },
  { geo: "usa", industry: "product" },
  { geo: "uk", industry: "engineering" },
  { geo: "uk", industry: "marketing" },
  { geo: "anywhere", industry: "engineering" },
  { geo: "anywhere", industry: "marketing" },
  { geo: "anywhere", industry: "design" },
  { geo: "anywhere", industry: "data-science" },
  { geo: "anywhere", industry: "devops-sysadmin" },
  { geo: "anywhere", industry: "product" },
  { geo: "europe", industry: "engineering" },
  { geo: "australia", industry: "engineering" },
];

/**
 * Scan Jobicy API for remote jobs.
 *
 * API: https://jobicy.com/api/v2/remote-jobs
 * RSS: https://jobicy.com/jobs-rss-feed
 * No auth needed.
 * Market: global remote.
 */
export async function scanJobicy(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<number>();

  // --- API requests ---
  for (const combo of SEARCH_COMBOS) {
    const params = new URLSearchParams({
      count: "50",
      geo: combo.geo,
      industry: combo.industry,
    });

    const data = await fetchJSON<JobicyResponse>(
      `https://jobicy.com/api/v2/remote-jobs?${params}`,
    );

    if (!data?.jobs?.length) {
      await sleep(1_000);
      continue;
    }

    for (const job of data.jobs) {
      if (seenIds.has(job.id)) continue;


      // Date filter
      const postedDate = job.pubDate ? new Date(job.pubDate) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenIds.add(job.id);

      // Salary
      let salary: string | undefined;
      if (job.annualSalaryMin && job.annualSalaryMax) {
        const currency = job.salaryCurrency || "USD";
        salary = `${currency} ${job.annualSalaryMin} - ${job.annualSalaryMax}`;
      }

      jobs.push({
        title: job.jobTitle,
        company: job.companyName || "See listing",
        location: job.jobGeo || "Remote",
        link: job.url || `https://jobicy.com/jobs/${job.id}`,
        source: "Jobicy",
        description: (job.jobExcerpt || job.jobDescription)?.slice(0, 500),
        salary,
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(1_000);
  }

  // --- RSS fallback for anything not covered ---
  const xml = await fetchText("https://jobicy.com/jobs-rss-feed");
  if (xml) {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1]
        || block.match(/<title>(.*?)<\/title>/)?.[1]
        || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      if (!link || !title) continue;


      const postedDate = pubDate ? new Date(pubDate) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      // Dedupe by URL since RSS lacks numeric IDs
      const existing = jobs.some((j) => j.link === link);
      if (existing) continue;

      jobs.push({
        title,
        company: "See listing",
        location: "Remote",
        link,
        source: "Jobicy",
        postedAt: postedDate ?? undefined,
      });
    }
  }

  return jobs;
}
