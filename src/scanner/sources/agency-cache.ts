import * as fs from "fs/promises";
import * as path from "path";
import type { RawJob } from "../types";
import { fetchJSON, isWithinCutoff, sleep } from "../utils";

const CUTOFF_DAYS = 14;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

const CACHE_FILE = path.join(process.cwd(), "agency-cache.json");

// ---------------------------------------------------------------------------
// Creative role filter — only fetch roles relevant to creative leadership
// ---------------------------------------------------------------------------
const CREATIVE_ROLE_RE = /creative director|head of creative|executive creative|group creative|chief creative|ecd|gcd|cco|head of brand|brand director|vp creative|vp brand|head of design|design director|creative lead|art director|copywriter|copy director|head of copy|creative strategist|creative producer|creative manager/i;

// ---------------------------------------------------------------------------
// ATS shapes (reuse same interfaces as greenhouse-cache)
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

export interface AgencyProject {
  id: string;
  name: string;
  country: string;
  careerUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | null;
  atsId: string | null;
  /** If true, skip creative-only filter and ingest all role types (VC portfolio boards) */
  allRoles?: boolean;
}

// ---------------------------------------------------------------------------
// Load agency-cache.json
// ---------------------------------------------------------------------------
async function loadAgencyCache(): Promise<AgencyProject[]> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn(`  [agency-cache] No cache file at ${CACHE_FILE} — run scripts/build-agency-cache.ts first`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Per-ATS scanners (filter to creative roles only)
// ---------------------------------------------------------------------------
async function scanGreenhouse(ag: AgencyProject): Promise<RawJob[]> {
  const data = await fetchJSON<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${ag.atsId}/jobs`
  );
  if (!data?.jobs) return [];

  const out: RawJob[] = [];
  for (const job of data.jobs) {
    if (!ag.allRoles && !CREATIVE_ROLE_RE.test(job.title)) continue;
    if (job.updated_at && !isWithinCutoff(new Date(job.updated_at), CUTOFF_DAYS)) continue;

    out.push({
      title: job.title,
      company: ag.name,
      location: job.location?.name || "Unknown",
      link: job.absolute_url || `https://boards.greenhouse.io/${ag.atsId}/jobs/${job.id}`,
      source: `agency:${ag.name}`,
      postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
    });
  }
  return out;
}

async function scanLever(ag: AgencyProject): Promise<RawJob[]> {
  const data = await fetchJSON<LeverJob[]>(
    `https://api.lever.co/v0/postings/${ag.atsId}?mode=json`
  );
  if (!Array.isArray(data)) return [];

  const out: RawJob[] = [];
  for (const job of data) {
    if (!ag.allRoles && !CREATIVE_ROLE_RE.test(job.text)) continue;
    if (job.createdAt && !isWithinCutoff(new Date(job.createdAt), CUTOFF_DAYS)) continue;

    out.push({
      title: job.text,
      company: ag.name,
      location: job.categories?.location || "Unknown",
      link: job.hostedUrl || job.applyUrl || "",
      source: `agency:${ag.name}`,
      postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
    });
  }
  return out;
}

async function scanAshby(ag: AgencyProject): Promise<RawJob[]> {
  const data = await fetchJSON<AshbyResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${ag.atsId}`
  );
  if (!data?.jobs) return [];

  const out: RawJob[] = [];
  for (const job of data.jobs) {
    if (!ag.allRoles && !CREATIVE_ROLE_RE.test(job.title)) continue;
    if (job.publishedAt && !isWithinCutoff(new Date(job.publishedAt), CUTOFF_DAYS)) continue;

    out.push({
      title: job.title,
      company: ag.name,
      location: job.location || "Unknown",
      link: job.jobUrl || `https://jobs.ashbyhq.com/${ag.atsId}/${job.id}`,
      source: `agency:${ag.name}`,
      postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
    });
  }
  return out;
}

async function scanSingleAgency(ag: AgencyProject): Promise<RawJob[]> {
  if (!ag.atsType || !ag.atsId) return [];
  try {
    switch (ag.atsType) {
      case "greenhouse": return await scanGreenhouse(ag);
      case "lever": return await scanLever(ag);
      case "ashby": return await scanAshby(ag);
      default: return [];
    }
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function scanAgencyCache(): Promise<RawJob[]> {
  const agencies = await loadAgencyCache();
  const active = agencies.filter((a) => a.atsType && a.atsId);
  if (!active.length) return [];

  console.log(`  [agency-cache] Scanning ${active.length} agencies for creative roles...`);

  const jobs: RawJob[] = [];
  for (let i = 0; i < active.length; i += BATCH_SIZE) {
    const batch = active.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(scanSingleAgency));
    jobs.push(...results.flat());
    if (i + BATCH_SIZE < active.length) await sleep(BATCH_DELAY_MS);
  }

  return jobs;
}
