import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { jobs, industries, roleTaxonomies } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Create job schema
// ---------------------------------------------------------------------------
const createJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  company: z.string().min(1, "Company name is required").max(300),
  location: z.string().max(300).optional(),
  link: z.string().url().optional(),
  description: z.string().optional(),
  salary: z.string().max(200).optional(),
  is_remote: z.boolean().default(false),
  region: z.string().max(20).optional(),
  industry: z.string().optional(), // industry slug
  role_type: z.string().optional(), // taxonomy slug
  featured: z.boolean().default(false),
  featured_days: z.number().int().min(1).max(365).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/employers/jobs — create a featured listing (auth required)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const data = parsed.data;

    // Resolve industry ID from slug
    let industryId: string | null = null;
    if (data.industry) {
      const ind = await db.query.industries.findFirst({
        where: eq(industries.slug, data.industry),
      });
      if (ind) industryId = ind.id;
    }

    // Resolve taxonomy ID from slug
    let taxonomyId: string | null = null;
    if (data.role_type) {
      const tax = await db.query.roleTaxonomies.findFirst({
        where: eq(roleTaxonomies.slug, data.role_type),
      });
      if (tax) taxonomyId = tax.id;
    }

    // Compute featured_until
    const now = new Date();
    let featuredUntil: Date | null = null;
    if (data.featured && data.featured_days) {
      featuredUntil = new Date(now);
      featuredUntil.setDate(featuredUntil.getDate() + data.featured_days);
    }

    // Generate dedup key from employer + title + company
    const dedupKey = createHash("sha256")
      .update(`employer:${auth.employerId}:${data.title}:${data.company}`)
      .digest("hex")
      .slice(0, 32);

    const [job] = await db
      .insert(jobs)
      .values({
        title: data.title,
        company: data.company,
        location: data.location ?? null,
        link: data.link ?? null,
        source: "employer",
        industryId,
        taxonomyId,
        description: data.description ?? null,
        salary: data.salary ?? null,
        isRemote: data.is_remote,
        region: data.region?.toUpperCase() ?? null,
        postedAt: now,
        scannedAt: now,
        lastSeenAt: now,
        isActive: true,
        isFeatured: data.featured,
        featuredUntil,
        employerId: auth.employerId,
        dedupKey,
      })
      .returning();

    return apiSuccess(
      {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        is_remote: job.isRemote,
        featured: job.isFeatured,
        featured_until: job.featuredUntil,
        posted_at: job.postedAt,
        created_at: job.scannedAt,
      },
      undefined,
      201
    );
  } catch (err: any) {
    // Handle unique constraint violation (duplicate dedup_key)
    if (err?.code === "23505") {
      return apiError("A job with this title and company already exists for your account", 409);
    }
    console.error("POST /api/employers/jobs error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/employers/jobs — list employer's jobs (auth required)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const employerJobs = await db.query.jobs.findMany({
      where: eq(jobs.employerId, auth.employerId),
      with: {
        industry: true,
        taxonomy: true,
      },
      orderBy: [desc(jobs.postedAt)],
    });

    const data = employerJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      link: job.link,
      description: job.description,
      salary: job.salary,
      is_remote: job.isRemote,
      region: job.region,
      featured: job.isFeatured,
      featured_until: job.featuredUntil,
      is_active: job.isActive,
      posted_at: job.postedAt,
      serve_count: job.serveCount,
      industry: job.industry
        ? { id: job.industry.id, slug: job.industry.slug, name: job.industry.name }
        : null,
      taxonomy: job.taxonomy
        ? { id: job.taxonomy.id, slug: job.taxonomy.slug, canonical_title: job.taxonomy.canonicalTitle }
        : null,
    }));

    return apiSuccess(data, { total: data.length });
  } catch (err) {
    console.error("GET /api/employers/jobs error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
