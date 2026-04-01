import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/db/index.ts";
import { jobs, roleTaxonomies, industries } from "../src/db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { scanJSearch } from "../src/scanner/sources/jsearch.ts";
import { scanAgencyCache } from "../src/scanner/sources/agency-cache.ts";
import { scanRemotive } from "../src/scanner/sources/remotive.ts";
import { scanHimalayas } from "../src/scanner/sources/himalayas.ts";
import { titleMatchesAny, detectRegion, makeDedupKey } from "../src/scanner/utils.ts";
import { parseSalary } from "../src/lib/salary.ts";
import type { TitleMatcher } from "../src/scanner/types.ts";

async function main() {
  console.log("Quick scan: JSearch + Agency Cache + Remotive + Himalayas...\n");

  const taxonomyRows = await db.select().from(roleTaxonomies);
  const industryRows = await db.select().from(industries);
  const industryIdBySlug = new Map(industryRows.map(i => [i.slug, i.id]));

  const matchers: TitleMatcher[] = taxonomyRows.map(t => ({
    taxonomyId: t.id,
    slug: t.slug,
    patterns: ((t.titlePatterns ?? []) as string[]).map(p => new RegExp(p, "i")),
  }));

  const JSEARCH_QUERIES = [
    "Creative Director", "Head of Creative", "Executive Creative Director",
    "Group Creative Director", "Head of Brand", "Chief Creative Officer",
    "Head of Marketing", "Brand Director", "Head of Design",
    "Product Manager crypto web3", "Software Engineer web3 blockchain",
    "Community Manager crypto", "Developer Relations blockchain",
    "Marketing Director", "Content Director",
  ];

  const [jsearch, agency, remotive, himalayas] = await Promise.all([
    scanJSearch(JSEARCH_QUERIES).catch(e => { console.error("JSearch:", e.message); return []; }),
    scanAgencyCache().catch(e => { console.error("Agency:", e.message); return []; }),
    scanRemotive().catch(e => { console.error("Remotive:", e.message); return []; }),
    scanHimalayas().catch(e => { console.error("Himalayas:", e.message); return []; }),
  ]);

  const allRaw = [...jsearch, ...agency, ...remotive, ...himalayas];
  console.log(`Raw: JSearch=${jsearch.length} Agency=${agency.length} Remotive=${remotive.length} Himalayas=${himalayas.length} Total=${allRaw.length}`);

  // Dedup + match
  const dedupMap = new Map<string, any>();
  for (const raw of allRaw) {
    const matcher = titleMatchesAny(raw.title, matchers);
    const region = detectRegion(raw.location);
    const dedupKey = makeDedupKey(raw.title, raw.company, raw.location);
    if (!dedupMap.has(dedupKey)) {
      dedupMap.set(dedupKey, { ...raw, taxonomyId: matcher?.taxonomyId ?? null, region, dedupKey });
    }
  }

  const matched = [...dedupMap.values()];
  const now = new Date();
  let upserted = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < matched.length; i += BATCH_SIZE) {
    const batch = matched.slice(i, i + BATCH_SIZE);
    const values = batch.map((job: any) => {
      let industryId: string | null = null;
      if (job.taxonomyId) {
        const tax = taxonomyRows.find((t: any) => t.id === job.taxonomyId);
        industryId = (tax as any)?.industryId ?? null;
      }
      if (!industryId) {
        const src = (job.source ?? "").toLowerCase();
        if (src.includes("greenhouse") || src.includes("lever") || src.includes("ashby") ||
            src.includes("web3") || src.includes("crypto") || src.includes("remote3")) {
          industryId = industryIdBySlug.get("crypto") ?? null;
        }
      }
      const parsed = parseSalary(job.salary);
      return {
        title: job.title, company: job.company, location: job.location,
        link: job.link, source: job.source, description: job.description ?? null,
        salary: job.salary ?? null, salaryMin: parsed.min, salaryMax: parsed.max,
        salaryCurrency: parsed.currency, industryId, taxonomyId: job.taxonomyId,
        isRemote: job.region === "remote" || /remote/i.test(job.location),
        region: job.region, postedAt: job.postedAt ?? null,
        scannedAt: now, lastSeenAt: now, dedupKey: job.dedupKey, isActive: true,
      };
    });
    try {
      await db.insert(jobs).values(values).onConflictDoUpdate({
        target: jobs.dedupKey,
        set: { lastSeenAt: now, isActive: true,
          industryId: sql`CASE WHEN EXCLUDED.industry_id IS NOT NULL THEN EXCLUDED.industry_id ELSE ${jobs.industryId} END` },
      });
      upserted += values.length;
    } catch (err) {
      console.error(`Batch error:`, err);
    }
    process.stdout.write(`\r  ${upserted}/${matched.length} upserted...`);
  }

  console.log(`\nDone — ${upserted} jobs in DB`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
