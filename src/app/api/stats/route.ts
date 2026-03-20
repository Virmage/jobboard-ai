import { db } from "@/db/index";
import { jobs, industries } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// GET /api/stats — public stats (total jobs, by industry, by market)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    // Total active jobs
    const [totalResult] = await db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.isActive, true));

    const totalJobs = totalResult?.total ?? 0;

    // Total featured jobs
    const [featuredResult] = await db
      .select({ total: count() })
      .from(jobs)
      .where(and(eq(jobs.isActive, true), eq(jobs.isFeatured, true)));

    const totalFeatured = featuredResult?.total ?? 0;

    // Total remote jobs
    const [remoteResult] = await db
      .select({ total: count() })
      .from(jobs)
      .where(and(eq(jobs.isActive, true), eq(jobs.isRemote, true)));

    const totalRemote = remoteResult?.total ?? 0;

    // Jobs by industry
    const byIndustry = await db
      .select({
        slug: industries.slug,
        name: industries.name,
        count: count(jobs.id),
      })
      .from(industries)
      .leftJoin(
        jobs,
        and(eq(jobs.industryId, industries.id), eq(jobs.isActive, true))
      )
      .groupBy(industries.id)
      .orderBy(sql`count(${jobs.id}) DESC`);

    // Jobs by market/region
    const byMarket = await db
      .select({
        region: jobs.region,
        count: count(),
      })
      .from(jobs)
      .where(eq(jobs.isActive, true))
      .groupBy(jobs.region)
      .orderBy(sql`count(*) DESC`);

    // Jobs by source
    const bySource = await db
      .select({
        source: jobs.source,
        count: count(),
      })
      .from(jobs)
      .where(eq(jobs.isActive, true))
      .groupBy(jobs.source)
      .orderBy(sql`count(*) DESC`);

    return apiSuccess({
      total_jobs: totalJobs,
      total_featured: totalFeatured,
      total_remote: totalRemote,
      by_industry: byIndustry.map((r) => ({
        slug: r.slug,
        name: r.name,
        count: Number(r.count),
      })),
      by_market: byMarket.map((r) => ({
        region: r.region ?? "unknown",
        count: Number(r.count),
      })),
      by_source: bySource.map((r) => ({
        source: r.source ?? "unknown",
        count: Number(r.count),
      })),
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
