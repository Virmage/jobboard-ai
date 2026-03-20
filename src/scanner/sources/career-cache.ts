import * as cheerio from "cheerio";
import type { RawJob, CareerProject, TitleMatcher } from "../types";
import {
  fetchJSON,
  fetchText,
  sleep,
  isWithinCutoff,
  titleMatchesAny,
} from "../utils";

const CUTOFF_DAYS = 14;
const BATCH_SIZE = 15;
const BATCH_DELAY_MS = 500;

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

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

/**
 * Scan career pages from a set of known projects (typically crypto).
 *
 * Supports Greenhouse API, Lever API, Ashby HTML, Workable HTML, and
 * generic career pages. Processes projects in batches of 15 with 500 ms
 * delay between batches to avoid hammering hosts.
 *
 * Title matching is done against the provided matchers — this scanner
 * is fully generic and works with any role taxonomy.
 */
export async function scanCareerCache(
  projects: CareerProject[],
  matchers: TitleMatcher[],
): Promise<RawJob[]> {
  if (!projects.length) return [];

  const jobs: RawJob[] = [];

  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);

    const batchJobs = await Promise.all(
      batch.map((proj) => scanSingleProject(proj, matchers)),
    );

    jobs.push(...batchJobs.flat());
    await sleep(BATCH_DELAY_MS);
  }

  return jobs;
}

async function scanSingleProject(
  proj: CareerProject,
  matchers: TitleMatcher[],
): Promise<RawJob[]> {
  const found: RawJob[] = [];

  try {
    if (proj.atsType === "greenhouse" && proj.atsId) {
      await scanGreenhouse(proj, matchers, found);
    } else if (proj.atsType === "lever" && proj.atsId) {
      await scanLever(proj, matchers, found);
    } else if (
      (proj.atsType === "ashby" || proj.atsType === "workable") &&
      proj.atsId
    ) {
      await scanAshbyOrWorkable(proj, matchers, found);
    } else if (proj.careerUrl) {
      await scanGenericCareerPage(proj, matchers, found);
    }
  } catch {
    // individual project failures are silently skipped
  }

  return found;
}

async function scanGreenhouse(
  proj: CareerProject,
  matchers: TitleMatcher[],
  out: RawJob[],
): Promise<void> {
  const data = await fetchJSON<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${proj.atsId}/jobs`,
  );
  if (!data?.jobs) return;

  for (const job of data.jobs) {
    if (
      job.updated_at &&
      !isWithinCutoff(new Date(job.updated_at), CUTOFF_DAYS)
    )
      continue;

    if (!titleMatchesAny(job.title, matchers)) continue;

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
}

async function scanLever(
  proj: CareerProject,
  matchers: TitleMatcher[],
  out: RawJob[],
): Promise<void> {
  const data = await fetchJSON<LeverJob[]>(
    `https://api.lever.co/v0/postings/${proj.atsId}?mode=json`,
  );
  if (!Array.isArray(data)) return;

  for (const job of data) {
    if (
      job.createdAt &&
      !isWithinCutoff(new Date(job.createdAt), CUTOFF_DAYS)
    )
      continue;

    if (!titleMatchesAny(job.text, matchers)) continue;

    out.push({
      title: job.text,
      company: proj.name,
      location: job.categories?.location || "Remote",
      link: job.hostedUrl || job.applyUrl || "",
      source: `${proj.name} (Lever)`,
      postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
    });
  }
}

async function scanAshbyOrWorkable(
  proj: CareerProject,
  matchers: TitleMatcher[],
  out: RawJob[],
): Promise<void> {
  const baseUrl =
    proj.atsType === "ashby"
      ? `https://jobs.ashbyhq.com/${proj.atsId}`
      : `https://apply.workable.com/${proj.atsId}/`;

  const html = await fetchText(baseUrl);
  if (!html) return;

  const $ = cheerio.load(html);
  $("a[href*='/j/'], a[href]").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    if (!text || !href) return;

    if (!titleMatchesAny(text, matchers)) return;

    out.push({
      title: text,
      company: proj.name,
      location: "Remote",
      link: href.startsWith("http") ? href : new URL(href, baseUrl).href,
      source: `${proj.name} (${proj.atsType})`,
    });
  });
}

async function scanGenericCareerPage(
  proj: CareerProject,
  matchers: TitleMatcher[],
  out: RawJob[],
): Promise<void> {
  if (!proj.careerUrl) return;

  const html = await fetchText(proj.careerUrl);
  if (!html) return;

  const $ = cheerio.load(html);
  $("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    if (!text || !href) return;
    if (text.length <= 8 || text.length >= 100) return;

    if (!titleMatchesAny(text, matchers)) return;

    out.push({
      title: text,
      company: proj.name,
      location: "Remote",
      link: href.startsWith("http")
        ? href
        : new URL(href, proj.careerUrl!).href,
      source: `${proj.name} (Career Page)`,
    });
  });
}
