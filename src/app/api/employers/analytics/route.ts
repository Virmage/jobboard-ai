import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiServes, featuredListings, jobs } from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all job IDs owned by this employer (through featured listings)
    const employerListings = await db
      .select({
        jobId: featuredListings.jobId,
        jobTitle: jobs.title,
        jobCompany: jobs.company,
      })
      .from(featuredListings)
      .innerJoin(jobs, eq(featuredListings.jobId, jobs.id))
      .where(eq(featuredListings.employerId, session.employerId));

    const jobIds = employerListings.map((l) => l.jobId);
    if (jobIds.length === 0) {
      return NextResponse.json({
        daily: [],
        perListing: [],
        totalServesThisWeek: 0,
      });
    }

    // Get daily serves for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const dailyServes = await db
      .select({
        date: apiServes.date,
        totalServes: sql<number>`SUM(${apiServes.serveCount})::int`,
      })
      .from(apiServes)
      .where(
        and(
          sql`${apiServes.jobId} = ANY(${jobIds})`,
          gte(apiServes.date, dateStr),
        ),
      )
      .groupBy(apiServes.date)
      .orderBy(apiServes.date);

    // Per-listing breakdown
    const perListing = await db
      .select({
        jobId: apiServes.jobId,
        totalServes: sql<number>`SUM(${apiServes.serveCount})::int`,
      })
      .from(apiServes)
      .where(
        and(
          sql`${apiServes.jobId} = ANY(${jobIds})`,
          gte(apiServes.date, dateStr),
        ),
      )
      .groupBy(apiServes.jobId);

    // Merge job titles into per-listing data
    const perListingWithTitles = perListing.map((row) => {
      const listing = employerListings.find((l) => l.jobId === row.jobId);
      return {
        jobId: row.jobId,
        jobTitle: listing?.jobTitle ?? "Unknown",
        jobCompany: listing?.jobCompany ?? "Unknown",
        totalServes: row.totalServes,
      };
    });

    // Total serves this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split("T")[0];

    const [weekResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${apiServes.serveCount}), 0)::int`,
      })
      .from(apiServes)
      .where(
        and(
          sql`${apiServes.jobId} = ANY(${jobIds})`,
          gte(apiServes.date, weekStr),
        ),
      );

    return NextResponse.json({
      daily: dailyServes,
      perListing: perListingWithTitles,
      totalServesThisWeek: weekResult?.total ?? 0,
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
