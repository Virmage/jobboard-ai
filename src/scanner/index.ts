import { eq, lt, and, sql } from "drizzle-orm";
import type { Database } from "@/db";
import {
  jobs,
  roleTaxonomies,
  scanRuns,
  industries,
} from "@/db/schema";
import type {
  RawJob,
  TitleMatcher,
  CareerProject,
  ScanStats,
} from "./types";
import {
  titleMatchesAny,
  detectRegion,
  makeDedupKey,
  sleep,
} from "./utils";
import { parseSalary } from "@/lib/salary";

// Source scanners — existing
import { scanLinkedIn } from "./sources/linkedin";
import { scanWeb3Career } from "./sources/web3-career";
import { scanCryptoJobs } from "./sources/crypto-jobs";
import { scanRemote3 } from "./sources/remote3";
import { scanYCombinator } from "./sources/yc";
import { scanBuiltIn } from "./sources/builtin";
import { scanCareerCache } from "./sources/career-cache";

// Source scanners — Australia
import { scanSeek } from "./sources/seek";
import { scanArtsHub } from "./sources/artshub";
import { scanMumbrella } from "./sources/mumbrella";
import { scanTheLoopAU } from "./sources/the-loop-au";

// Source scanners — US
import { scanIndeed } from "./sources/indeed";
import { scanDribbble } from "./sources/dribbble";

// Source scanners — Europe
import { scanReed } from "./sources/reed";
import { scanTheDots } from "./sources/the-dots";
import { scanCampaignJobs } from "./sources/campaign-jobs";
import { scanArbeitnow } from "./sources/arbeitnow";
import { scanWelcomeJungle } from "./sources/welcome-jungle";

// Source scanners — Creative industry
import { scanTheDrum } from "./sources/thedrum";
import { scanMarketingWeek } from "./sources/marketing-week";
import { scanWorkingNotWorking } from "./sources/working-not-working";
import { scanCreativepool } from "./sources/creativepool";
import { scanCampaignBriefAU } from "./sources/campaign-brief-au";
import { scanKrop } from "./sources/krop";

// Source scanners — Crypto (additional)
import { scanGreenhouseCache } from "./sources/greenhouse-cache";
import { scanAgencyCache } from "./sources/agency-cache";

// Source scanners — Cross-market
import { scanAdzuna } from "./sources/adzuna";
import { scanJSearch } from "./sources/jsearch";

// Source scanners — Free global APIs
import { scanRemoteOK } from "./sources/remoteok";
import { scanCareerjet } from "./sources/careerjet";
import { scanJooble } from "./sources/jooble";
import { scanJobicy } from "./sources/jobicy";

// Source scanners — RSS feeds
import { scanWeWorkRemotely } from "./sources/weworkremotely";
import { scanRemotive } from "./sources/remotive";
import { scanHigherEdJobs } from "./sources/higheredjobs";
import { scanJobsAcUk } from "./sources/jobsacuk";

// Source scanners — US boards (additional)
import { scanUSAJobs } from "./sources/usajobs";
import { scanDice } from "./sources/dice";
import { scanGovernmentJobs } from "./sources/governmentjobs";
import { scanSnagajob } from "./sources/snagajob";
import { scanMonster } from "./sources/monster";
import { scanDiversityJobs } from "./sources/diversityjobs";

// Source scanners — UK/EU boards
import { scanTotaljobs } from "./sources/totaljobs";
import { scanNoFluffJobs } from "./sources/nofluffjobs";
import { scanBerlinStartupJobs } from "./sources/berlinstartupjobs";
import { scanEures } from "./sources/eures";

// Source scanners — APAC boards
import { scanMyCareersFuture } from "./sources/mycareersfuture";
import { scanJobStreet } from "./sources/jobstreet";
import { scanCareersGovSG } from "./sources/careers-gov-sg";
import { scanGaijinPot } from "./sources/gaijinpot";
import { scanJapanDev } from "./sources/japandev";

// Source scanners — Middle East + Africa + LATAM
import { scanBayt } from "./sources/bayt";
import { scanBrighterMonday } from "./sources/brightermonday";
import { scanComputrabajo } from "./sources/computrabajo";

// Source scanners — Niche boards
import { scanIdealist } from "./sources/idealist";
import { scanCharityJob } from "./sources/charityjob";
import { scanTechJobsForGood } from "./sources/techjobsforgood";
import { scanEthicalJobs } from "./sources/ethicaljobs";
import { scanAIJobs } from "./sources/aijobs";
import { scanHimalayas } from "./sources/himalayas";
import { scanNoDesk } from "./sources/nodesk";
import { scanEFinancialCareers } from "./sources/efinancialcareers";

// Source scanners — ATS platforms
import { scanSmartRecruiters } from "./sources/smartrecruiters";
import { scanHackerNews } from "./sources/hackernews";
import { scanWellfound } from "./sources/wellfound";

// Source scanners — Government AU/CA
import { scanWorkforceAU } from "./sources/workforce-au";
import { scanJobBankCA } from "./sources/jobbank-ca";

// ---------------------------------------------------------------------------
// Staleness cutoff
// ---------------------------------------------------------------------------

const STALE_DAYS = 14;

// ---------------------------------------------------------------------------
// Taxonomy -> search params helpers
// ---------------------------------------------------------------------------

/**
 * Generate LinkedIn search keyword strings from a taxonomy's canonical
 * title and related titles. Returns 1-3 keyword phrases.
 */
function taxonomyToLinkedInKeywords(taxonomy: {
  canonicalTitle: string;
  relatedTitles: string[];
}): string[] {
  const keywords: string[] = [taxonomy.canonicalTitle];
  // Add up to 2 related titles as separate searches
  for (const t of taxonomy.relatedTitles.slice(0, 2)) {
    if (t.toLowerCase() !== taxonomy.canonicalTitle.toLowerCase()) {
      keywords.push(t);
    }
  }
  return keywords;
}

/**
 * Generate web3.career slugs from a taxonomy. Converts title strings
 * like "Creative Director" to slugs like "creative-director".
 */
function taxonomyToWeb3Slugs(taxonomy: {
  canonicalTitle: string;
  relatedTitles: string[];
}): string[] {
  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const slugs = new Set<string>();
  slugs.add(toSlug(taxonomy.canonicalTitle));
  for (const t of taxonomy.relatedTitles) {
    slugs.add(toSlug(t));
  }
  return [...slugs];
}

/**
 * Generate BuiltIn.com paths from a taxonomy. Maps canonical titles
 * to known BuiltIn category paths.
 */
function taxonomyToBuiltInPaths(taxonomy: {
  canonicalTitle: string;
  slug: string;
}): string[] {
  const title = taxonomy.canonicalTitle.toLowerCase();
  const paths: string[] = [];

  if (title.includes("creative") || title.includes("design") || title.includes("ux") || title.includes("ui")) {
    paths.push(`/jobs/design/${taxonomy.slug}`);
  }
  if (title.includes("marketing") || title.includes("brand") || title.includes("growth") || title.includes("seo")) {
    paths.push(`/jobs/marketing/${taxonomy.slug}`);
  }
  if (title.includes("content") || title.includes("social") || title.includes("editorial")) {
    paths.push(`/jobs/marketing/${taxonomy.slug}`);
  }
  if (title.includes("engineer") || title.includes("developer") || title.includes("devops") || title.includes("sre") || title.includes("platform") || title.includes("qa")) {
    paths.push(`/jobs/dev-engineering/${taxonomy.slug}`);
  }
  if (title.includes("product manager") || title.includes("product owner") || title.includes("product lead") || title.includes("head of product") || title.includes("cpo")) {
    paths.push(`/jobs/product/${taxonomy.slug}`);
  }
  if (title.includes("data") || title.includes("analytics") || title.includes("ml") || title.includes("machine learning") || title.includes("ai ") || title.includes("research scientist")) {
    paths.push(`/jobs/data-analytics/${taxonomy.slug}`);
  }
  if (title.includes("sales") || title.includes("account executive") || title.includes("sdr") || title.includes("bdr") || title.includes("revenue")) {
    paths.push(`/jobs/sales/${taxonomy.slug}`);
  }
  if (title.includes("operations") || title.includes("program manager") || title.includes("project manager") || title.includes("chief of staff")) {
    paths.push(`/jobs/operations/${taxonomy.slug}`);
  }
  if (title.includes("hr") || title.includes("people") || title.includes("recruiter") || title.includes("talent")) {
    paths.push(`/jobs/hr/${taxonomy.slug}`);
  }
  if (title.includes("finance") || title.includes("cfo") || title.includes("accountant") || title.includes("controller") || title.includes("fp&a")) {
    paths.push(`/jobs/finance/${taxonomy.slug}`);
  }
  if (title.includes("legal") || title.includes("counsel") || title.includes("compliance")) {
    paths.push(`/jobs/legal/${taxonomy.slug}`);
  }
  if (title.includes("customer success") || title.includes("customer support") || title.includes("support engineer")) {
    paths.push(`/jobs/customer-success/${taxonomy.slug}`);
  }

  // Fallback: always add a generic search path
  if (paths.length === 0) {
    paths.push(`/jobs/${taxonomy.slug}`);
  }

  return [...new Set(paths)];
}

/**
 * Generate cryptocurrencyjobs.co categories from a taxonomy.
 */
function taxonomyToCryptoJobsCategories(taxonomy: {
  canonicalTitle: string;
}): string[] {
  const title = taxonomy.canonicalTitle.toLowerCase();
  const cats = new Set<string>();

  if (
    title.includes("marketing") ||
    title.includes("brand") ||
    title.includes("social") ||
    title.includes("content") ||
    title.includes("growth") ||
    title.includes("seo") ||
    title.includes("communications")
  ) {
    cats.add("marketing");
  }
  if (title.includes("design") || title.includes("creative") || title.includes("ux") || title.includes("ui") || title.includes("art director")) {
    cats.add("design");
  }
  if (title.includes("engineer") || title.includes("developer") || title.includes("devops") || title.includes("sre") || title.includes("platform") || title.includes("cto") || title.includes("blockchain") || title.includes("solidity") || title.includes("protocol") || title.includes("smart contract") || title.includes("web3") || title.includes("defi")) {
    cats.add("engineering");
  }
  if (title.includes("product manager") || title.includes("product owner") || title.includes("product lead") || title.includes("head of product") || title.includes("cpo")) {
    cats.add("product");
  }
  if (title.includes("data") || title.includes("analytics") || title.includes("ml") || title.includes("machine learning") || title.includes("ai ") || title.includes("research scientist")) {
    cats.add("data-science");
  }
  if (title.includes("community") || title.includes("devrel") || title.includes("developer advocate") || title.includes("developer relations")) {
    cats.add("community");
  }
  if (title.includes("sales") || title.includes("business development") || title.includes("account executive") || title.includes("partnerships")) {
    cats.add("sales");
  }
  if (title.includes("operations") || title.includes("coo") || title.includes("chief of staff") || title.includes("program manager")) {
    cats.add("operations");
  }
  if (title.includes("legal") || title.includes("compliance") || title.includes("counsel")) {
    cats.add("legal");
  }
  if (title.includes("people") || title.includes("hr") || title.includes("recruiter") || title.includes("talent")) {
    cats.add("people");
  }
  if (title.includes("finance") || title.includes("cfo") || title.includes("accountant")) {
    cats.add("finance");
  }

  if (cats.size === 0) cats.add("engineering");

  return [...cats];
}

/**
 * Generate YC search queries from a taxonomy.
 */
function taxonomyToYCQueries(taxonomy: {
  canonicalTitle: string;
  relatedTitles: string[];
}): string[] {
  const queries = [taxonomy.canonicalTitle];
  for (const t of taxonomy.relatedTitles.slice(0, 2)) {
    if (t.toLowerCase() !== taxonomy.canonicalTitle.toLowerCase()) {
      queries.push(t);
    }
  }
  return queries;
}

// ---------------------------------------------------------------------------
// Build matchers from DB taxonomies
// ---------------------------------------------------------------------------

interface TaxonomyRow {
  id: string;
  slug: string;
  canonicalTitle: string;
  relatedTitles: string[];
  titlePatterns: string[];
  industryId: string | null;
}

function buildMatchers(taxonomyRows: TaxonomyRow[]): TitleMatcher[] {
  return taxonomyRows.map((t) => ({
    taxonomyId: t.id,
    slug: t.slug,
    patterns: t.titlePatterns.map((p) => new RegExp(p, "i")),
  }));
}

// ---------------------------------------------------------------------------
// Source runner with error capture
// ---------------------------------------------------------------------------

async function runSource(
  name: string,
  fn: () => Promise<RawJob[]>,
  errors: Array<{ source: string; message: string }>,
  timeoutMs = 30_000,
): Promise<RawJob[]> {
  try {
    console.log(`  [${name}] scanning...`);
    const result = await Promise.race([
      fn(),
      new Promise<RawJob[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs),
      ),
    ]);
    console.log(`  [${name}] found ${result.length} jobs`);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [${name}] error: ${msg}`);
    errors.push({ source: name, message: msg });
    return [];
  }
}

/**
 * Record results from a batch of sources into the breakdown + allRawJobs.
 */
function recordBatch(
  results: Array<{ name: string; jobs: RawJob[] }>,
  allRawJobs: RawJob[],
  sourceBreakdown: Record<string, number>,
) {
  for (const r of results) {
    sourceBreakdown[r.name] = r.jobs.length;
    allRawJobs.push(...r.jobs);
  }
}

// ---------------------------------------------------------------------------
// Stale job marking
// ---------------------------------------------------------------------------

/**
 * Mark jobs as stale (inactive) if they haven't been seen in `staleDays` days.
 */
async function markStaleJobs(
  db: Database,
  staleDays: number,
): Promise<number> {
  const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const result = await db
    .update(jobs)
    .set({ isActive: false })
    .where(and(eq(jobs.isActive, true), lt(jobs.lastSeenAt, cutoff)));

  // Drizzle returns the updated rows count via the result
  // For postgres-js driver, result is an array of updated rows
  return Array.isArray(result) ? result.length : 0;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Run a full scan across all sources for all taxonomies in the database.
 *
 * 1. Loads all role taxonomies from DB
 * 2. Generates source-specific search parameters from each taxonomy
 * 3. Runs all sources in parallel batches (grouped to avoid hammering)
 * 4. Matches found jobs against taxonomies, detects regions, computes dedup keys
 * 5. Upserts new/updated jobs into the DB
 * 6. Marks jobs as stale if not seen in 14 days
 * 7. Records scan run stats
 *
 * Returns scan statistics.
 */
export async function runFullScan(
  db: Database,
  careerProjects: CareerProject[],
): Promise<ScanStats> {
  const startTime = new Date();
  const errors: Array<{ source: string; message: string }> = [];

  // --- Create scan run record ---
  const [scanRun] = await db
    .insert(scanRuns)
    .values({ startedAt: startTime, status: "running" })
    .returning({ id: scanRuns.id });

  console.log(`Scan started: ${startTime.toISOString()}`);

  // --- Load taxonomies ---
  const taxonomyRows = (await db
    .select()
    .from(roleTaxonomies)) as TaxonomyRow[];

  // --- Load industry ID map ---
  const industryRows = await db.select().from(industries);
  const industryIdBySlug = new Map(industryRows.map((i) => [i.slug, i.id]));

  if (!taxonomyRows.length) {
    console.warn("No role taxonomies found in DB — nothing to scan.");
    await db
      .update(scanRuns)
      .set({
        completedAt: new Date(),
        status: "completed",
        totalFound: 0,
        newJobs: 0,
      })
      .where(eq(scanRuns.id, scanRun.id));
    return { totalFound: 0, newJobs: 0, sourceBreakdown: {}, errors };
  }

  const matchers = buildMatchers(taxonomyRows);
  console.log(
    `Loaded ${taxonomyRows.length} taxonomies, ${matchers.length} matchers`,
  );

  // --- Build search params from ALL taxonomies ---
  const allLinkedInKeywords = new Set<string>();
  const allWeb3Slugs = new Set<string>();
  const allCryptoJobsCats = new Set<string>();
  const allYCQueries = new Set<string>();
  const allBuiltInPaths = new Set<string>();

  for (const t of taxonomyRows) {
    for (const kw of taxonomyToLinkedInKeywords(t)) {
      allLinkedInKeywords.add(kw);
    }
    for (const slug of taxonomyToWeb3Slugs(t)) {
      allWeb3Slugs.add(slug);
    }
    for (const cat of taxonomyToCryptoJobsCategories(t)) {
      allCryptoJobsCats.add(cat);
    }
    for (const q of taxonomyToYCQueries(t)) {
      allYCQueries.add(q);
    }
    for (const p of taxonomyToBuiltInPaths(t)) {
      allBuiltInPaths.add(p);
    }
  }

  // --- Run sources in parallel batches ---
  const allRawJobs: RawJob[] = [];
  const sourceBreakdown: Record<string, number> = {};

  // ===== Batch 1: Crypto board sites (different hosts, safe to parallelize) =====
  console.log("\n--- Batch 1: Crypto boards ---");
  // Prioritize creative/brand/marketing slugs for web3.career (known working slugs)
  const PRIORITY_WEB3_SLUGS = [
    "creative-director", "marketing-manager", "content-marketing", "head-of-marketing",
    "brand-manager", "social-media-manager", "product-manager", "product-designer",
    "engineering-manager", "software-engineer", "developer-advocate", "community-manager",
    "head-of-growth", "growth-marketing",
  ];
  const web3SlugsDeduped = [...new Set([...PRIORITY_WEB3_SLUGS, ...allWeb3Slugs])].slice(0, 15);
  const [web3Jobs, cryptoJobs, remote3Jobs] = await Promise.all([
    runSource("web3.career", () => scanWeb3Career(web3SlugsDeduped), errors, 60_000),
    runSource("cryptocurrencyjobs.co", () => scanCryptoJobs([...allCryptoJobsCats]), errors),
    runSource("remote3.co", () => scanRemote3(), errors),
  ]);
  recordBatch(
    [
      { name: "web3.career", jobs: web3Jobs },
      { name: "cryptocurrencyjobs.co", jobs: cryptoJobs },
      { name: "remote3.co", jobs: remote3Jobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 2: US + YC boards (different hosts) =====
  console.log("\n--- Batch 2: US boards ---");
  const [ycJobs, builtInJobs, indeedJobs, dribbbleJobs] = await Promise.all([
    runSource("YC", () => scanYCombinator([...allYCQueries]), errors),
    runSource("BuiltIn", () => scanBuiltIn([...allBuiltInPaths]), errors),
    runSource("Indeed", () => scanIndeed(), errors),
    runSource("Dribbble", () => scanDribbble(), errors),
  ]);
  recordBatch(
    [
      { name: "YC", jobs: ycJobs },
      { name: "BuiltIn", jobs: builtInJobs },
      { name: "Indeed", jobs: indeedJobs },
      { name: "Dribbble", jobs: dribbbleJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 3: Australia boards (different hosts) =====
  console.log("\n--- Batch 3: Australia boards ---");
  const [seekJobs, artsHubJobs, mumbrellaJobs, theLoopJobs] = await Promise.all([
    runSource("Seek", () => scanSeek(), errors),
    runSource("ArtsHub", () => scanArtsHub(), errors),
    runSource("Mumbrella", () => scanMumbrella(), errors),
    runSource("The Loop AU", () => scanTheLoopAU(), errors, 45_000),
  ]);
  recordBatch(
    [
      { name: "Seek", jobs: seekJobs },
      { name: "ArtsHub", jobs: artsHubJobs },
      { name: "Mumbrella", jobs: mumbrellaJobs },
      { name: "The Loop AU", jobs: theLoopJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 3b: Creative industry boards =====
  console.log("\n--- Batch 3b: Creative industry boards ---");
  const [theDrumJobs, marketingWeekJobs, wnwJobs, creativepoolJobs, campaignBriefJobs, kropJobs] = await Promise.all([
    runSource("The Drum", () => scanTheDrum(), errors, 60_000),
    runSource("Marketing Week", () => scanMarketingWeek(), errors, 60_000),
    runSource("Working Not Working", () => scanWorkingNotWorking(), errors, 45_000),
    runSource("Creativepool", () => scanCreativepool(), errors, 60_000),
    runSource("Campaign Brief AU", () => scanCampaignBriefAU(), errors, 30_000),
    runSource("Krop", () => scanKrop(), errors, 60_000),
  ]);
  recordBatch(
    [
      { name: "The Drum", jobs: theDrumJobs },
      { name: "Marketing Week", jobs: marketingWeekJobs },
      { name: "Working Not Working", jobs: wnwJobs },
      { name: "Creativepool", jobs: creativepoolJobs },
      { name: "Campaign Brief AU", jobs: campaignBriefJobs },
      { name: "Krop", jobs: kropJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 4: Europe boards (different hosts) =====
  console.log("\n--- Batch 4: Europe boards ---");
  const [reedJobs, theDotsJobs, campaignJobs, arbeitnowJobs, wttjJobs] =
    await Promise.all([
      runSource("Reed", () => scanReed(), errors),
      runSource("The Dots", () => scanTheDots(), errors),
      runSource("Campaign", () => scanCampaignJobs(), errors),
      runSource("Arbeitnow", () => scanArbeitnow(), errors),
      runSource("Welcome to the Jungle", () => scanWelcomeJungle(), errors),
    ]);
  recordBatch(
    [
      { name: "Reed", jobs: reedJobs },
      { name: "The Dots", jobs: theDotsJobs },
      { name: "Campaign", jobs: campaignJobs },
      { name: "Arbeitnow", jobs: arbeitnowJobs },
      { name: "Welcome to the Jungle", jobs: wttjJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 5: Cross-market APIs =====
  console.log("\n--- Batch 5: Cross-market APIs ---");
  // Build JSearch queries from top taxonomy titles
  const JSEARCH_QUERIES = [
    "Creative Director",
    "Head of Creative",
    "Executive Creative Director",
    "Group Creative Director",
    "Head of Brand",
    "Chief Creative Officer",
    "Head of Marketing",
    "Marketing Director",
    "Brand Director",
    "Head of Design",
    "UX Designer",
    "Product Manager crypto",
    "Software Engineer web3",
    "Community Manager crypto",
    "Developer Relations",
  ];
  const [adzunaJobs, jsearchJobs] = await Promise.all([
    runSource("Adzuna", () => scanAdzuna(), errors),
    runSource("JSearch", () => scanJSearch(JSEARCH_QUERIES), errors, 120_000),
  ]);
  recordBatch(
    [
      { name: "Adzuna", jobs: adzunaJobs },
      { name: "JSearch", jobs: jsearchJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 6: Career caches (moved before LinkedIn so they always run) =====
  console.log("\n--- Batch 6: Career caches ---");
  const [legacyCacheJobs, greenhouseCacheJobs, agencyCacheJobs] = await Promise.all([
    runSource(
      "Career Cache (legacy)",
      () => scanCareerCache(careerProjects, matchers),
      errors,
    ),
    runSource(
      "Greenhouse Cache",
      () => scanGreenhouseCache(matchers),
      errors,
    ),
    runSource(
      "Agency Cache",
      () => scanAgencyCache(),
      errors,
      60_000,
    ),
  ]);
  recordBatch(
    [
      { name: "Career Cache", jobs: legacyCacheJobs },
      { name: "Greenhouse Cache", jobs: greenhouseCacheJobs },
      { name: "Agency Cache", jobs: agencyCacheJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 8: Free global APIs (different hosts, safe to parallelize) =====
  console.log("\n--- Batch 8: Free global APIs ---");
  const [remoteOKJobs, careerjetJobs, joobleJobs, jobicyJobs] =
    await Promise.all([
      runSource("RemoteOK", () => scanRemoteOK(), errors),
      runSource("Careerjet", () => scanCareerjet(), errors),
      runSource("Jooble", () => scanJooble(), errors),
      runSource("Jobicy", () => scanJobicy(), errors),
    ]);
  recordBatch(
    [
      { name: "RemoteOK", jobs: remoteOKJobs },
      { name: "Careerjet", jobs: careerjetJobs },
      { name: "Jooble", jobs: joobleJobs },
      { name: "Jobicy", jobs: jobicyJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 9: RSS feeds (different hosts) =====
  console.log("\n--- Batch 9: RSS feeds ---");
  const [wwrJobs, remotiveJobs, higherEdJobs, jobsAcUkJobs] =
    await Promise.all([
      runSource("WeWorkRemotely", () => scanWeWorkRemotely(), errors),
      runSource("Remotive", () => scanRemotive(), errors),
      runSource("HigherEdJobs", () => scanHigherEdJobs(), errors),
      runSource("jobs.ac.uk", () => scanJobsAcUk(), errors),
    ]);
  recordBatch(
    [
      { name: "WeWorkRemotely", jobs: wwrJobs },
      { name: "Remotive", jobs: remotiveJobs },
      { name: "HigherEdJobs", jobs: higherEdJobs },
      { name: "jobs.ac.uk", jobs: jobsAcUkJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 10: US boards (different hosts) =====
  console.log("\n--- Batch 10: US boards ---");
  const [usaJobs, diceJobs, govJobs, snagajobJobs, monsterJobs, diversityJobs] =
    await Promise.all([
      runSource("USAJobs", () => scanUSAJobs(), errors),
      runSource("Dice", () => scanDice(), errors),
      runSource("GovernmentJobs", () => scanGovernmentJobs(), errors),
      runSource("Snagajob", () => scanSnagajob(), errors),
      runSource("Monster", () => scanMonster(), errors),
      runSource("DiversityJobs", () => scanDiversityJobs(), errors),
    ]);
  recordBatch(
    [
      { name: "USAJobs", jobs: usaJobs },
      { name: "Dice", jobs: diceJobs },
      { name: "GovernmentJobs", jobs: govJobs },
      { name: "Snagajob", jobs: snagajobJobs },
      { name: "Monster", jobs: monsterJobs },
      { name: "DiversityJobs", jobs: diversityJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 11: UK/EU boards (different hosts) =====
  console.log("\n--- Batch 11: UK/EU boards ---");
  const [totaljobsJobs, noFluffJobs, berlinJobs, euresJobs] =
    await Promise.all([
      runSource("Totaljobs", () => scanTotaljobs(), errors),
      runSource("NoFluffJobs", () => scanNoFluffJobs(), errors),
      runSource("BerlinStartupJobs", () => scanBerlinStartupJobs(), errors),
      runSource("EURES", () => scanEures(), errors),
    ]);
  recordBatch(
    [
      { name: "Totaljobs", jobs: totaljobsJobs },
      { name: "NoFluffJobs", jobs: noFluffJobs },
      { name: "BerlinStartupJobs", jobs: berlinJobs },
      { name: "EURES", jobs: euresJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 12: APAC boards (different hosts) =====
  console.log("\n--- Batch 12: APAC boards ---");
  const [mcfJobs, jobStreetJobs, careersGovSGJobs, gaijinPotJobs, japanDevJobs] =
    await Promise.all([
      runSource("MyCareersFuture", () => scanMyCareersFuture(), errors),
      runSource("JobStreet", () => scanJobStreet(), errors),
      runSource("CareersGovSG", () => scanCareersGovSG(), errors),
      runSource("GaijinPot", () => scanGaijinPot(), errors),
      runSource("JapanDev", () => scanJapanDev(), errors),
    ]);
  recordBatch(
    [
      { name: "MyCareersFuture", jobs: mcfJobs },
      { name: "JobStreet", jobs: jobStreetJobs },
      { name: "CareersGovSG", jobs: careersGovSGJobs },
      { name: "GaijinPot", jobs: gaijinPotJobs },
      { name: "JapanDev", jobs: japanDevJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 13: Middle East + Africa + LATAM (different hosts) =====
  console.log("\n--- Batch 13: Middle East + Africa + LATAM ---");
  const [baytJobs, brighterMondayJobs, computrabajoJobs] = await Promise.all([
    runSource("Bayt", () => scanBayt(), errors),
    runSource("BrighterMonday", () => scanBrighterMonday(), errors),
    runSource("Computrabajo", () => scanComputrabajo(), errors),
  ]);
  recordBatch(
    [
      { name: "Bayt", jobs: baytJobs },
      { name: "BrighterMonday", jobs: brighterMondayJobs },
      { name: "Computrabajo", jobs: computrabajoJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 14: Niche boards (different hosts) =====
  console.log("\n--- Batch 14: Niche boards ---");
  const [
    idealistJobs,
    charityJobJobs,
    techForGoodJobs,
    ethicalJobs,
    aiJobsJobs,
    himalayasJobs,
    noDeskJobs,
    eFinanceJobs,
  ] = await Promise.all([
    runSource("Idealist", () => scanIdealist(), errors),
    runSource("CharityJob", () => scanCharityJob(), errors),
    runSource("TechJobsForGood", () => scanTechJobsForGood(), errors),
    runSource("EthicalJobs", () => scanEthicalJobs(), errors),
    runSource("AIJobs", () => scanAIJobs(), errors),
    runSource("Himalayas", () => scanHimalayas(), errors),
    runSource("NoDesk", () => scanNoDesk(), errors),
    runSource("eFinancialCareers", () => scanEFinancialCareers(), errors),
  ]);
  recordBatch(
    [
      { name: "Idealist", jobs: idealistJobs },
      { name: "CharityJob", jobs: charityJobJobs },
      { name: "TechJobsForGood", jobs: techForGoodJobs },
      { name: "EthicalJobs", jobs: ethicalJobs },
      { name: "AIJobs", jobs: aiJobsJobs },
      { name: "Himalayas", jobs: himalayasJobs },
      { name: "NoDesk", jobs: noDeskJobs },
      { name: "eFinancialCareers", jobs: eFinanceJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 15: ATS platforms (different hosts) =====
  console.log("\n--- Batch 15: ATS platforms ---");
  const [smartRecruitersJobs, hackerNewsJobs, wellfoundJobs] =
    await Promise.all([
      runSource("SmartRecruiters", () => scanSmartRecruiters(), errors),
      runSource("HackerNews", () => scanHackerNews(), errors),
      runSource("Wellfound", () => scanWellfound(), errors),
    ]);
  recordBatch(
    [
      { name: "SmartRecruiters", jobs: smartRecruitersJobs },
      { name: "HackerNews", jobs: hackerNewsJobs },
      { name: "Wellfound", jobs: wellfoundJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 16: Government AU/CA (different hosts) =====
  console.log("\n--- Batch 16: Government AU/CA ---");
  const [workforceAUJobs, jobBankCAJobs] = await Promise.all([
    runSource("WorkforceAU", () => scanWorkforceAU(), errors),
    runSource("JobBankCA", () => scanJobBankCA(), errors),
  ]);
  recordBatch(
    [
      { name: "WorkforceAU", jobs: workforceAUJobs },
      { name: "JobBankCA", jobs: jobBankCAJobs },
    ],
    allRawJobs,
    sourceBreakdown,
  );

  // ===== Batch 17: LinkedIn (parallel batches of 5, 1s gap between batches) =====
  console.log("\n--- Batch 17: LinkedIn ---");
  const linkedInKeywords = [...allLinkedInKeywords];
  let linkedInTotal = 0;
  const LI_CONCURRENCY = 5;
  for (let i = 0; i < linkedInKeywords.length; i += LI_CONCURRENCY) {
    const batch = linkedInKeywords.slice(i, i + LI_CONCURRENCY);
    const results = await Promise.all(
      batch.map((kw) => runSource(`LinkedIn:"${kw}"`, () => scanLinkedIn(kw), errors)),
    );
    for (const r of results) {
      allRawJobs.push(...r);
      linkedInTotal += r.length;
    }
    await sleep(1_000);
  }
  sourceBreakdown["LinkedIn"] = linkedInTotal;

  // ===== Batch 17b: LinkedIn APAC — location-specific searches =====
  // Kept small to avoid exceeding Vercel's 5-min cron timeout.
  // 3 locations × 8 keywords = 24 queries → ~5 batches → ~30s total
  console.log("\n--- Batch 17b: LinkedIn APAC ---");
  const apacLocations = ["Australia", "Singapore", "Hong Kong"];
  const apacKeywords = [
    "Creative Director", "Head of Creative", "Head of Brand",
    "Executive Creative Director", "Head of Marketing",
    "Product Manager", "Engineering Manager", "UX Designer",
  ];
  let linkedInApacTotal = 0;
  const apacQueries = apacLocations.flatMap((loc) => apacKeywords.map((kw) => ({ kw, loc })));
  for (let i = 0; i < apacQueries.length; i += LI_CONCURRENCY) {
    const batch = apacQueries.slice(i, i + LI_CONCURRENCY);
    const results = await Promise.all(
      batch.map(({ kw, loc }) =>
        runSource(`LinkedIn:"${kw}" in ${loc}`, () => scanLinkedIn(kw, loc, false), errors),
      ),
    );
    for (const r of results) {
      allRawJobs.push(...r);
      linkedInApacTotal += r.length;
    }
    await sleep(1_000);
  }
  sourceBreakdown["LinkedIn APAC"] = linkedInApacTotal;

  console.log(`\nTotal raw jobs found: ${allRawJobs.length}`);

  // --- Match, deduplicate, and prepare for DB ---
  const dedupMap = new Map<
    string,
    RawJob & { taxonomyId: string | null; region: string; dedupKey: string }
  >();

  for (const raw of allRawJobs) {
    const matcher = titleMatchesAny(raw.title, matchers);
    const region = detectRegion(raw.location);
    const dedupKey = makeDedupKey(raw.title, raw.company, raw.location);

    if (!dedupMap.has(dedupKey)) {
      dedupMap.set(dedupKey, {
        ...raw,
        taxonomyId: matcher?.taxonomyId ?? null,
        region,
        dedupKey,
      });
    }
  }

  const matched = [...dedupMap.values()];
  console.log(`After dedup + matching: ${matched.length} jobs`);

  // --- Upsert into DB (batched for performance) ---
  let newCount = 0;
  const now = new Date();
  const BATCH_SIZE = 50;

  for (let i = 0; i < matched.length; i += BATCH_SIZE) {
    const batch = matched.slice(i, i + BATCH_SIZE);
    const values = batch.map((job) => {
      let industryId: string | null = null;
      if (job.taxonomyId) {
        const tax = taxonomyRows.find((t) => t.id === job.taxonomyId);
        industryId = tax?.industryId ?? null;
      }
      // Source-based industry override: crypto sources → crypto industry
      if (!industryId) {
        const src = (job.source ?? "").toLowerCase();
        if (
          src.includes("greenhouse") ||
          src.includes("lever") ||
          src.includes("ashby") ||
          src.includes("web3.career") ||
          src.includes("cryptocurrencyjobs") ||
          src.includes("remote3") ||
          src.includes("career cache")
        ) {
          industryId = industryIdBySlug.get("crypto") ?? null;
        }
      }
      const parsed = parseSalary(job.salary);
      return {
        title: job.title,
        company: job.company,
        location: job.location,
        link: job.link,
        source: job.source,
        description: job.description ?? null,
        salary: job.salary ?? null,
        salaryMin: parsed.min,
        salaryMax: parsed.max,
        salaryCurrency: parsed.currency,
        industryId,
        taxonomyId: job.taxonomyId,
        isRemote: job.region === "remote" || /remote/i.test(job.location),
        region: job.region,
        postedAt: job.postedAt ?? null,
        scannedAt: now,
        lastSeenAt: now,
        dedupKey: job.dedupKey,
        isActive: true,
      };
    });

    try {
      const result = await db
        .insert(jobs)
        .values(values)
        .onConflictDoUpdate({
          target: jobs.dedupKey,
          set: {
            lastSeenAt: now,
            isActive: true,
            // Update industryId on re-scan so tagging fixes propagate
            industryId: sql`CASE WHEN EXCLUDED.industry_id IS NOT NULL THEN EXCLUDED.industry_id ELSE ${jobs.industryId} END`,
          },
        });
      // Count new inserts (approximate — all non-conflict rows)
      newCount += batch.length;
    } catch (err) {
      // Fall back to one-by-one if batch fails
      console.error(`  Batch ${i / BATCH_SIZE + 1} error, falling back to sequential...`);
      for (const v of values) {
        try {
          await db.insert(jobs).values(v).onConflictDoUpdate({
            target: jobs.dedupKey,
            set: { lastSeenAt: now, isActive: true },
          });
          newCount++;
        } catch {
          // skip individual failures
        }
      }
    }

    if (i % 500 === 0 && i > 0) {
      console.log(`  Upserted ${i}/${matched.length} jobs...`);
    }
  }

  // --- Mark stale jobs ---
  console.log("\nMarking stale jobs...");
  const staleCount = await markStaleJobs(db, STALE_DAYS);
  console.log(`Marked ${staleCount} jobs as stale (not seen in ${STALE_DAYS} days)`);

  // --- Update scan run record ---
  const stats: ScanStats = {
    totalFound: matched.length,
    newJobs: newCount,
    sourceBreakdown,
    errors,
  };

  await db
    .update(scanRuns)
    .set({
      completedAt: new Date(),
      status: errors.length > 0 ? "completed_with_errors" : "completed",
      totalFound: stats.totalFound,
      newJobs: stats.newJobs,
      sourceBreakdown: stats.sourceBreakdown,
      errors: stats.errors,
    })
    .where(eq(scanRuns.id, scanRun.id));

  console.log(
    `\nScan complete: ${stats.totalFound} total, ${stats.newJobs} new, ${staleCount} stale, ${errors.length} errors`,
  );

  return stats;
}

// ---------------------------------------------------------------------------
// CLI entry point — run with: npx tsx src/scanner/index.ts
// ---------------------------------------------------------------------------
import { fileURLToPath } from "node:url";

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/.*\//, ""));

if (isMain) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  config({ path: ".env" });

  const { db } = await import("@/db/index");
  const { careerProjects: cpTable } = await import("@/db/schema");

  // Load career projects from DB
  let careerProjects: CareerProject[] = [];
  try {
    const rows = await db.select().from(cpTable);
    careerProjects = rows
      .filter((r: any) => r.careerUrl)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        symbol: r.symbol,
        rank: r.rank,
        homepage: r.homepage,
        careerUrl: r.careerUrl,
        atsType: r.atsType as CareerProject["atsType"],
        atsId: r.atsId,
      }));
  } catch (err) {
    console.warn("Could not load career_projects:", (err as Error).message);
  }

  console.log(`Starting full scan with ${careerProjects.length} career projects...\n`);
  runFullScan(db, careerProjects)
    .then((stats) => {
      console.log("\nDone!", JSON.stringify(stats, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Scan failed:", err);
      process.exit(1);
    });
}
