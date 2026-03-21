import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, roleTaxonomies } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateRSS } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agentjobs.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Look up the role taxonomy by slug
  const role = await db
    .select({ id: roleTaxonomies.id, canonicalTitle: roleTaxonomies.canonicalTitle })
    .from(roleTaxonomies)
    .where(eq(roleTaxonomies.slug, slug))
    .limit(1)
    .then((r) => r[0]);

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

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
    .where(and(eq(jobs.isActive, true), eq(jobs.taxonomyId, role.id)))
    .orderBy(desc(jobs.postedAt))
    .limit(50);

  const xml = generateRSS({
    title: `AgentJobs \u2014 ${role.canonicalTitle} Jobs`,
    description: `Latest ${role.canonicalTitle} jobs from AgentJobs.`,
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
