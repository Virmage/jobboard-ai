import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { industries, roleTaxonomies } from "../src/db/schema";
import { industriesSeed } from "./industries";
import { taxonomiesSeed } from "./taxonomies";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required. Set it in .env or your environment.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  // -----------------------------------------------------------------------
  // Seed Industries
  // -----------------------------------------------------------------------
  console.log(`\nSeeding ${industriesSeed.length} industries...`);
  let industriesInserted = 0;
  for (const industry of industriesSeed) {
    const result = await db
      .insert(industries)
      .values({
        slug: industry.slug,
        name: industry.name,
        description: industry.description,
        displayOrder: industry.displayOrder,
      })
      .onConflictDoNothing({ target: industries.slug })
      .returning();

    if (result.length > 0) {
      industriesInserted++;
      console.log(`  + ${industry.name} (${industry.slug})`);
    } else {
      console.log(`  = ${industry.name} (${industry.slug}) — already exists`);
    }
  }
  console.log(
    `Industries done: ${industriesInserted} inserted, ${industriesSeed.length - industriesInserted} skipped.`
  );

  // -----------------------------------------------------------------------
  // Build slug -> id map for industries
  // -----------------------------------------------------------------------
  const industryRows = await db.select({ id: industries.id, slug: industries.slug }).from(industries);
  const industrySlugToId = new Map<string, string>();
  for (const row of industryRows) {
    industrySlugToId.set(row.slug, row.id);
  }
  console.log(`\nLoaded ${industrySlugToId.size} industry slug->id mappings.`);

  // -----------------------------------------------------------------------
  // Seed Role Taxonomies
  // -----------------------------------------------------------------------
  console.log(`\nSeeding ${taxonomiesSeed.length} role taxonomies...`);
  let taxonomiesInserted = 0;
  let taxonomiesUpdated = 0;
  for (const tax of taxonomiesSeed) {
    const industryId = industrySlugToId.get(tax.industrySlug) ?? null;

    if (!industryId) {
      console.warn(`  ! WARNING: No industry found for slug "${tax.industrySlug}" (taxonomy: ${tax.slug})`);
    }

    // Try insert first
    const result = await db
      .insert(roleTaxonomies)
      .values({
        slug: tax.slug,
        canonicalTitle: tax.canonicalTitle,
        relatedTitles: tax.relatedTitles,
        titlePatterns: tax.titlePatterns,
        industryId,
      })
      .onConflictDoNothing({ target: roleTaxonomies.slug })
      .returning();

    if (result.length > 0) {
      taxonomiesInserted++;
      console.log(
        `  + ${tax.canonicalTitle} (${tax.slug}) — ${tax.relatedTitles.length} related, ${tax.titlePatterns.length} patterns`
      );
    } else {
      // Already exists — update the patterns, related titles, and industry
      await db
        .update(roleTaxonomies)
        .set({
          canonicalTitle: tax.canonicalTitle,
          relatedTitles: tax.relatedTitles,
          titlePatterns: tax.titlePatterns,
          industryId,
        })
        .where(eq(roleTaxonomies.slug, tax.slug));
      taxonomiesUpdated++;
      console.log(`  ~ ${tax.canonicalTitle} (${tax.slug}) — updated`);
    }
  }
  console.log(
    `Taxonomies done: ${taxonomiesInserted} inserted, ${taxonomiesUpdated} updated, ${taxonomiesSeed.length - taxonomiesInserted - taxonomiesUpdated} unchanged.`
  );

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log("\n--- Seed Complete ---");
  console.log(`  Industries: ${industriesInserted} new`);
  console.log(`  Taxonomies: ${taxonomiesInserted} new, ${taxonomiesUpdated} updated`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
