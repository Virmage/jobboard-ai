import { db } from "@/db";
import { runFullScan } from "@/scanner/index";
import type { CareerProject } from "@/scanner/types";

/**
 * Loads career projects from the career_projects table (if populated)
 * and runs a full scan across all sources.
 */
export async function handleScanJob(): Promise<void> {
  console.log("[scan-job] Starting full scan...");
  const startTime = Date.now();

  // Load career projects from DB if we have a career_projects table,
  // otherwise use an empty array (sources will still be scanned)
  let careerProjects: CareerProject[] = [];
  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      symbol: string;
      rank: number;
      homepage: string;
      career_url: string | null;
      ats_type: string | null;
      ats_id: string | null;
    }>(
      // Raw SQL since career_projects may not be in the Drizzle schema yet
      { sql: "SELECT id, name, symbol, rank, homepage, career_url, ats_type, ats_id FROM career_projects WHERE career_url IS NOT NULL", params: [] } as any,
    );

    if (Array.isArray(rows)) {
      careerProjects = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        symbol: r.symbol,
        rank: r.rank,
        homepage: r.homepage,
        careerUrl: r.career_url,
        atsType: r.ats_type as CareerProject["atsType"],
        atsId: r.ats_id,
      }));
    }
  } catch (err) {
    console.warn(
      "[scan-job] Could not load career_projects table (may not exist yet):",
      (err as Error).message,
    );
  }

  console.log(
    `[scan-job] Loaded ${careerProjects.length} career projects for cache source`,
  );

  const stats = await runFullScan(db, careerProjects);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `[scan-job] Completed in ${elapsed}s — ${stats.totalFound} total, ${stats.newJobs} new, ${stats.errors.length} errors`,
  );
}
