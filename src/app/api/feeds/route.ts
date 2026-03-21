import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateRSS } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agentjobs.com";

export async function GET() {
  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      location: jobs.location,
      link: jobs.link,
      description: jobs.description,
      salary: jobs.salary,
      postedAt: jobs.postedAt,
      source: jobs.source,
    })
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .orderBy(desc(jobs.postedAt))
    .limit(50);

  const xml = generateRSS({
    title: "AgentJobs \u2014 Latest Jobs",
    description:
      "The latest 50 jobs from AgentJobs \u2014 structured, real-time job data for AI agents.",
    link: SITE_URL,
    jobs: rows,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
