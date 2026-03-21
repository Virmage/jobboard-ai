import type { RawJob } from "../types";
import { fetchJSON, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * RemoteOK API job shape.
 * The first element in the array is a legal notice object; actual jobs follow.
 */
interface RemoteOKJob {
  id: string;
  epoch: string; // unix timestamp as string
  date: string;
  company: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  company_logo?: string;
}

/**
 * Scan RemoteOK public JSON API for remote jobs.
 *
 * Endpoint: https://remoteok.com/api (returns JSON array)
 * No authentication required.
 * Market: global remote.
 */
export async function scanRemoteOK(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  const data = await fetchJSON<RemoteOKJob[]>(
    "https://remoteok.com/api",
    20_000,
  );

  if (!data || !Array.isArray(data)) return [];

  // First element is a legal/meta object — skip it
  const listings = data.slice(1);

  for (const job of listings) {
    if (!job.id || !job.position) continue;
    if (seenIds.has(job.id)) continue;


    // Date filter
    const postedDate = job.epoch
      ? new Date(parseInt(job.epoch, 10) * 1000)
      : job.date
        ? new Date(job.date)
        : null;
    if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

    seenIds.add(job.id);

    const salary =
      job.salary_min && job.salary_max
        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
        : job.salary_min
          ? `From $${job.salary_min.toLocaleString()}`
          : undefined;

    jobs.push({
      title: job.position,
      company: job.company || "See listing",
      location: job.location || "Remote",
      link: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      source: "RemoteOK",
      description: job.description?.slice(0, 500),
      salary,
      postedAt: postedDate ?? undefined,
    });
  }

  return jobs;
}
