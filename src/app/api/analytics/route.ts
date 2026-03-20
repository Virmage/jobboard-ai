import { NextRequest } from "next/server";
import { db } from "@/db/index";
import {
  jobs,
  apiServes,
  savedSearches,
  scanRuns,
  industries,
} from "@/db/schema";
import { eq, sql, desc, gte } from "drizzle-orm";
import { jsonOk, jsonError, handleCorsOptions } from "@/lib/api-response";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    // Run all queries in parallel
    const [
      activeJobsResult,
      totalServesResult,
      servesTodayResult,
      servesThisWeekResult,
      topJobsResult,
      servesByDayResult,
      jobsBySourceResult,
      jobsByIndustryResult,
      jobsByRegionResult,
      activeAlertsResult,
      lastScanResult,
    ] = await Promise.all([
      // Total active jobs
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(eq(jobs.isActive, true)),

      // Total serves
      db
        .select({
          total: sql<number>`coalesce(sum(${jobs.serveCount}), 0)::int`,
        })
        .from(jobs),

      // Serves today
      db
        .select({
          total: sql<number>`coalesce(sum(${apiServes.serveCount}), 0)::int`,
        })
        .from(apiServes)
        .where(eq(apiServes.date, todayStr)),

      // Serves this week
      db
        .select({
          total: sql<number>`coalesce(sum(${apiServes.serveCount}), 0)::int`,
        })
        .from(apiServes)
        .where(gte(apiServes.date, weekAgoStr)),

      // Top 10 most-served jobs
      db
        .select({
          title: jobs.title,
          company: jobs.company,
          serves: jobs.serveCount,
        })
        .from(jobs)
        .where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.serveCount))
        .limit(10),

      // Serves by day (last 30 days)
      db
        .select({
          date: apiServes.date,
          serves: sql<number>`coalesce(sum(${apiServes.serveCount}), 0)::int`,
        })
        .from(apiServes)
        .where(gte(apiServes.date, thirtyDaysAgoStr))
        .groupBy(apiServes.date)
        .orderBy(apiServes.date),

      // Jobs by source
      db
        .select({
          source: sql<string>`coalesce(${jobs.source}, 'unknown')`,
          count: sql<number>`count(*)::int`,
        })
        .from(jobs)
        .where(eq(jobs.isActive, true))
        .groupBy(jobs.source)
        .orderBy(desc(sql`count(*)`)),

      // Jobs by industry
      db
        .select({
          name: sql<string>`coalesce(${industries.name}, 'Uncategorized')`,
          count: sql<number>`count(*)::int`,
        })
        .from(jobs)
        .leftJoin(industries, eq(jobs.industryId, industries.id))
        .where(eq(jobs.isActive, true))
        .groupBy(industries.name)
        .orderBy(desc(sql`count(*)`)),

      // Jobs by region
      db
        .select({
          region: sql<string>`coalesce(${jobs.region}, 'Unspecified')`,
          count: sql<number>`count(*)::int`,
        })
        .from(jobs)
        .where(eq(jobs.isActive, true))
        .groupBy(jobs.region)
        .orderBy(desc(sql`count(*)`)),

      // Active saved searches count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(savedSearches)
        .where(eq(savedSearches.isActive, true)),

      // Last scan run
      db
        .select({
          started_at: scanRuns.startedAt,
          completed_at: scanRuns.completedAt,
          total_found: scanRuns.totalFound,
          new_jobs: scanRuns.newJobs,
          status: scanRuns.status,
        })
        .from(scanRuns)
        .orderBy(desc(scanRuns.startedAt))
        .limit(1),
    ]);

    const lastScan = lastScanResult[0] ?? null;

    return jsonOk({
      overview: {
        total_jobs: activeJobsResult[0].count,
        total_serves: totalServesResult[0].total,
        serves_today: servesTodayResult[0].total,
        serves_this_week: servesThisWeekResult[0].total,
        active_alerts: activeAlertsResult[0].count,
      },
      top_jobs: topJobsResult,
      serves_by_day: servesByDayResult,
      jobs_by_source: jobsBySourceResult,
      jobs_by_industry: jobsByIndustryResult,
      jobs_by_region: jobsByRegionResult,
      last_scan: lastScan,
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    return jsonError("Internal server error", 500);
  }
}
