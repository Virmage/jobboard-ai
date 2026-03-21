import * as fs from "fs/promises";
import * as path from "path";
import type { RawJob, CareerProject, TitleMatcher } from "../types";
import {
  fetchJSON,
  fetchText,
  sleep,
  isWithinCutoff,
} from "../utils";

const CUTOFF_DAYS = 14;
const BATCH_SIZE = 15;
const BATCH_DELAY_MS = 500;

/**
 * Path to the career-cache.json file (built by cache-builder.ts).
 */
const CACHE_FILE = path.join(process.cwd(), "career-cache.json");

// ---------------------------------------------------------------------------
// ATS-specific job list shapes
// ---------------------------------------------------------------------------

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url?: string;
  location?: { name?: string };
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

interface LeverJob {
  text: string;
  createdAt: number;
  hostedUrl?: string;
  applyUrl?: string;
  categories?: { location?: string };
}

interface AshbyJob {
  id: string;
  title: string;
  publishedAt?: string;
  location?: string;
  jobUrl?: string;
}

interface AshbyResponse {
  jobs?: AshbyJob[];
}

// ---------------------------------------------------------------------------
// Read cache file
// ---------------------------------------------------------------------------

async function loadCacheFile(): Promise<CareerProject[]> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn(`  [greenhouse-cache] No cache file at ${CACHE_FILE}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

/**
 * Read career-cache.json and scan Greenhouse/Lever/Ashby APIs
 * for jobs at known crypto/tech companies.
 *
 * This scanner reads the locally cached project list (built by cache-builder.ts)
 * and hits each project's ATS API to collect all jobs.
 *
 * Returns all jobs found — taxonomy matching is handled downstream by
 * the main scanner index.ts.
 */
export async function scanGreenhouseCache(
  matchers?: TitleMatcher[],
): Promise<RawJob[]> {
  const projects = await loadCacheFile();
  if (!projects.length) return [];

  const atsProjects = projects.filter(
    (p) => p.atsType && p.atsId && p.atsType !== "generic",
  );
  console.log(
    `  [greenhouse-cache] ${atsProjects.length} ATS projects from cache`,
  );

  const jobs: RawJob[] = [];

  for (let i = 0; i < atsProjects.length; i += BATCH_SIZE) {
    const batch = atsProjects.slice(i, i + BATCH_SIZE);
    const batchJobs = await Promise.all(
      batch.map((proj) => scanSingleProject(proj)),
    );
    jobs.push(...batchJobs.flat());
    await sleep(BATCH_DELAY_MS);
  }

  return jobs;
}

async function scanSingleProject(
  proj: CareerProject,
): Promise<RawJob[]> {
  try {
    switch (proj.atsType) {
      case "greenhouse":
        return await scanGreenhouse(proj);
      case "lever":
        return await scanLever(proj);
      case "ashby":
        return await scanAshby(proj);
      default:
        return [];
    }
  } catch {
    return [];
  }
}

async function scanGreenhouse(
  proj: CareerProject,
): Promise<RawJob[]> {
  const data = await fetchJSON<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${proj.atsId}/jobs`,
  );
  if (!data?.jobs) return [];

  const out: RawJob[] = [];
  for (const job of data.jobs) {
    if (
      job.updated_at &&
      !isWithinCutoff(new Date(job.updated_at), CUTOFF_DAYS)
    )
      continue;

    out.push({
      title: job.title,
      company: proj.name,
      location: job.location?.name || "Remote",
      link:
        job.absolute_url ||
        `https://boards.greenhouse.io/${proj.atsId}/jobs/${job.id}`,
      source: `${proj.name} (Greenhouse)`,
      postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
    });
  }
  return out;
}

async function scanLever(
  proj: CareerProject,
): Promise<RawJob[]> {
  const data = await fetchJSON<LeverJob[]>(
    `https://api.lever.co/v0/postings/${proj.atsId}?mode=json`,
  );
  if (!Array.isArray(data)) return [];

  const out: RawJob[] = [];
  for (const job of data) {
    if (
      job.createdAt &&
      !isWithinCutoff(new Date(job.createdAt), CUTOFF_DAYS)
    )
      continue;

    out.push({
      title: job.text,
      company: proj.name,
      location: job.categories?.location || "Remote",
      link: job.hostedUrl || job.applyUrl || "",
      source: `${proj.name} (Lever)`,
      postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
    });
  }
  return out;
}

async function scanAshby(
  proj: CareerProject,
): Promise<RawJob[]> {
  // Ashby has a public API endpoint
  const data = await fetchJSON<AshbyResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${proj.atsId}`,
  );

  const out: RawJob[] = [];

  if (data?.jobs) {
    for (const job of data.jobs) {
      if (
        job.publishedAt &&
        !isWithinCutoff(new Date(job.publishedAt), CUTOFF_DAYS)
      )
        continue;

      out.push({
        title: job.title,
        company: proj.name,
        location: job.location || "Remote",
        link:
          job.jobUrl ||
          `https://jobs.ashbyhq.com/${proj.atsId}/${job.id}`,
        source: `${proj.name} (Ashby)`,
        postedAt: job.publishedAt
          ? new Date(job.publishedAt)
          : undefined,
      });
    }
  } else {
    // Fallback: scrape HTML
    const html = await fetchText(
      `https://jobs.ashbyhq.com/${proj.atsId}`,
    );
    if (!html) return out;

    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);
    $("a[href*='/j/'], a[href]").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href");
      if (!text || !href) return;

      out.push({
        title: text,
        company: proj.name,
        location: "Remote",
        link: href.startsWith("http")
          ? href
          : `https://jobs.ashbyhq.com${href}`,
        source: `${proj.name} (Ashby)`,
      });
    });
  }

  return out;
}
