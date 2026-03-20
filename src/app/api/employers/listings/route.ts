import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { featuredListings, jobs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await db
      .select({
        id: featuredListings.id,
        jobId: featuredListings.jobId,
        startsAt: featuredListings.startsAt,
        endsAt: featuredListings.endsAt,
        amountPaid: featuredListings.amountPaid,
        stripePaymentId: featuredListings.stripePaymentId,
        createdAt: featuredListings.createdAt,
        jobTitle: jobs.title,
        jobCompany: jobs.company,
        jobServeCount: jobs.serveCount,
        jobIsFeatured: jobs.isFeatured,
        jobFeaturedUntil: jobs.featuredUntil,
      })
      .from(featuredListings)
      .innerJoin(jobs, eq(featuredListings.jobId, jobs.id))
      .where(eq(featuredListings.employerId, session.employerId))
      .orderBy(desc(featuredListings.createdAt));

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Listings GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { job_id, duration } = body as {
      job_id?: string;
      duration?: number;
    };

    if (!job_id || !duration || ![7, 30, 90].includes(duration)) {
      return NextResponse.json(
        { error: "job_id and duration (7, 30, or 90) are required" },
        { status: 400 },
      );
    }

    // Verify job exists
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, job_id),
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const pricing: Record<number, number> = { 7: 4900, 30: 14900, 90: 34900 };
    const amountCents = pricing[duration];

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + duration);

    // Create the featured listing
    const [listing] = await db
      .insert(featuredListings)
      .values({
        employerId: session.employerId,
        jobId: job_id,
        startsAt: now,
        endsAt,
        amountPaid: amountCents,
      })
      .returning();

    // Mark the job as featured
    await db
      .update(jobs)
      .set({
        isFeatured: true,
        featuredUntil: endsAt,
        employerId: session.employerId,
      })
      .where(eq(jobs.id, job_id));

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error("Listings POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
