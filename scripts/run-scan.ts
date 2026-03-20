#!/usr/bin/env npx tsx
/**
 * Standalone scanner runner — resolves path aliases and runs a full scan.
 * Usage: DATABASE_URL=... npx tsx scripts/run-scan.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql as rawSql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

// -- bootstrap DB --
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// -- import scanners (relative, not aliased) --
async function main() {
  console.log("JobBoard AI Scanner\n");

  // Load taxonomies
  const taxonomies = await db.select().from(schema.roleTaxonomies);
  console.log(`Loaded ${taxonomies.length} role taxonomies`);

  if (taxonomies.length === 0) {
    console.error("No taxonomies found — run seed first");
    process.exit(1);
  }

  // Build title matchers
  const matchers = taxonomies.map((t) => ({
    taxonomyId: t.id,
    slug: t.slug,
    patterns: (t.titlePatterns as string[]).map((p) => new RegExp(p, "i")),
  }));

  // Load industries for assignment
  const industryRows = await db.select().from(schema.industries);
  const industryMap = new Map(industryRows.map((i) => [i.slug, i.id]));

  // Generate search keywords from taxonomies
  const allKeywords = taxonomies.flatMap((t) => {
    const titles = [t.canonicalTitle, ...(t.relatedTitles as string[]).slice(0, 3)];
    return titles;
  });

  // De-dupe keywords
  const uniqueKeywords = [...new Set(allKeywords)];
  console.log(`Generated ${uniqueKeywords.length} search keywords\n`);

  // Record scan start
  const [scanRun] = await db
    .insert(schema.scanRuns)
    .values({
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  // -- Import scanners dynamically --
  const { scanLinkedIn } = await import("../src/scanner/sources/linkedin.js");
  const { scanWeb3Career } = await import("../src/scanner/sources/web3-career.js");
  const { scanCryptoJobs } = await import("../src/scanner/sources/crypto-jobs.js");
  const { scanRemote3 } = await import("../src/scanner/sources/remote3.js");
  const { scanYCombinator } = await import("../src/scanner/sources/yc.js");
  const { scanBuiltIn } = await import("../src/scanner/sources/builtin.js");
  const { titleMatchesAny, detectRegion, makeDedupKey } = await import("../src/scanner/utils.js");

  const allJobs: any[] = [];
  const sourceBreakdown: Record<string, number> = {};
  const errors: { source: string; error: string }[] = [];

  // Helper to run a source safely
  async function runSource(name: string, fn: () => Promise<any[]>) {
    try {
      console.log(`Scanning: ${name}...`);
      const jobs = await fn();
      console.log(`  Found ${jobs.length} raw jobs`);
      sourceBreakdown[name] = jobs.length;
      allJobs.push(...jobs.map((j: any) => ({ ...j, _source: name })));
    } catch (e: any) {
      console.error(`  Error in ${name}: ${e.message}`);
      errors.push({ source: name, error: e.message });
    }
  }

  // Run board scrapers
  await runSource("web3.career", () =>
    scanWeb3Career(["creative-director", "head-of-brand", "head-of-social", "brand-director", "head-of-marketing", "head-of-design", "head-of-product", "engineering-manager"])
  );

  await runSource("cryptocurrencyjobs.co", () =>
    scanCryptoJobs(["marketing", "design", "product", "engineering"])
  );

  await runSource("remote3.co", () => scanRemote3());

  await runSource("YC (workatastartup)", () =>
    scanYCombinator(["creative director", "head of brand", "head of marketing", "head of product", "head of engineering", "head of design"])
  );

  await runSource("BuiltIn", () =>
    scanBuiltIn(["/jobs/design/creative-director", "/jobs/marketing/marketing-director", "/jobs/product/product-manager"])
  );

  // LinkedIn searches — a subset of keywords to avoid rate limiting
  const linkedInQueries = [
    "creative director remote",
    "head of brand remote",
    "head of marketing remote",
    "head of product remote",
    "head of engineering remote",
    "VP design remote",
    "head of social media remote",
    "creative director crypto web3",
    "head of brand AI startup",
    "engineering manager remote",
  ];

  for (const q of linkedInQueries) {
    await runSource(`LinkedIn: "${q}"`, () => scanLinkedIn(q));
    // Small delay between LinkedIn queries
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nTotal raw jobs: ${allJobs.length}`);

  // Match, deduplicate, and upsert
  let matched = 0;
  let inserted = 0;
  let updated = 0;
  const seenKeys = new Set<string>();

  for (const rawJob of allJobs) {
    const match = titleMatchesAny(rawJob.title, matchers);
    if (!match) continue;
    matched++;

    const dedupKey = makeDedupKey(rawJob.title, rawJob.company);
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    const region = detectRegion(rawJob.location || "");

    // Determine industry from source
    let industryId: string | null = null;
    const src = (rawJob._source || "").toLowerCase();
    if (src.includes("web3") || src.includes("crypto") || src.includes("career cache")) {
      industryId = industryMap.get("crypto") || null;
    } else if (src.includes("yc") || src.includes("builtin")) {
      industryId = industryMap.get("ai-startups") || null;
    }

    try {
      const result = await db
        .insert(schema.jobs)
        .values({
          title: rawJob.title,
          company: rawJob.company,
          location: rawJob.location || "Remote",
          link: rawJob.link,
          source: rawJob.source || rawJob._source || "Unknown",
          industryId,
          taxonomyId: match.taxonomyId,
          description: rawJob.description || null,
          salary: rawJob.salary || null,
          isRemote: region === "Global" || (rawJob.location || "").toLowerCase().includes("remote"),
          region,
          postedAt: rawJob.postedAt ? new Date(rawJob.postedAt) : null,
          scannedAt: new Date(),
          lastSeenAt: new Date(),
          dedupKey,
        })
        .onConflictDoUpdate({
          target: schema.jobs.dedupKey,
          set: {
            lastSeenAt: new Date(),
            scannedAt: new Date(),
          },
        })
        .returning();

      if (result.length > 0) inserted++;
    } catch (e: any) {
      // Silently skip constraint errors
      if (!e.message?.includes("unique")) {
        console.error(`  DB error for "${rawJob.title}": ${e.message}`);
      }
    }
  }

  // Update scan run
  await db
    .update(schema.scanRuns)
    .set({
      completedAt: new Date(),
      totalFound: allJobs.length,
      newJobs: inserted,
      sourceBreakdown,
      errors: errors.length > 0 ? errors.map(e => ({ source: e.source, message: e.error })) : null,
      status: "completed",
    })
    .where(eq(schema.scanRuns.id, scanRun.id));

  console.log(`\n--- Scan Complete ---`);
  console.log(`  Raw jobs found: ${allJobs.length}`);
  console.log(`  Matched taxonomies: ${matched}`);
  console.log(`  Unique after dedup: ${seenKeys.size}`);
  console.log(`  Inserted/updated in DB: ${inserted}`);
  console.log(`  Errors: ${errors.length}`);

  await client.end();
}

main().catch((e) => {
  console.error("Scanner failed:", e);
  client.end();
  process.exit(1);
});
