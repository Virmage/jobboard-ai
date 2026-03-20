import { db } from "@/db";
import { buildCareerCache } from "@/scanner/cache-builder";
import { sql } from "drizzle-orm";

/**
 * Rebuilds the career project cache by scanning CoinGecko for top projects
 * and detecting their ATS / career pages. Results are stored in a
 * career_projects table.
 */
export async function handleCacheRebuild(): Promise<void> {
  console.log("[cache-rebuild] Starting career cache rebuild...");
  const startTime = Date.now();

  // Ensure the career_projects table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS career_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      rank INTEGER NOT NULL,
      homepage TEXT NOT NULL,
      career_url TEXT,
      ats_type TEXT,
      ats_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const projects = await buildCareerCache();
  console.log(`[cache-rebuild] Got ${projects.length} projects with career pages`);

  // Upsert all projects
  let upserted = 0;
  for (const proj of projects) {
    await db.execute(sql`
      INSERT INTO career_projects (id, name, symbol, rank, homepage, career_url, ats_type, ats_id, updated_at)
      VALUES (${proj.id}, ${proj.name}, ${proj.symbol}, ${proj.rank}, ${proj.homepage}, ${proj.careerUrl}, ${proj.atsType}, ${proj.atsId}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        rank = EXCLUDED.rank,
        homepage = EXCLUDED.homepage,
        career_url = EXCLUDED.career_url,
        ats_type = EXCLUDED.ats_type,
        ats_id = EXCLUDED.ats_id,
        updated_at = NOW()
    `);
    upserted++;
  }

  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(
    `[cache-rebuild] Completed in ${elapsed} min — ${upserted} projects upserted`,
  );
}
