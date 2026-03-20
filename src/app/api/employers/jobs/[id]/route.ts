import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { jobs, industries, roleTaxonomies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// Update job schema — all fields optional
// ---------------------------------------------------------------------------
const updateJobSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  company: z.string().min(1).max(300).optional(),
  location: z.string().max(300).nullable().optional(),
  link: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  salary: z.string().max(200).nullable().optional(),
  is_remote: z.boolean().optional(),
  region: z.string().max(20).nullable().optional(),
  industry: z.string().nullable().optional(), // slug
  role_type: z.string().nullable().optional(), // slug
  featured: z.boolean().optional(),
  featured_days: z.number().int().min(1).max(365).optional(),
  is_active: z.boolean().optional(),
});

const uuidSchema = z.string().uuid("id must be a valid UUID");

// ---------------------------------------------------------------------------
// PATCH /api/employers/jobs/:id — update listing (auth required)
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const idParsed = uuidSchema.safeParse(id);
    if (!idParsed.success) {
      return apiError("Invalid job ID", 400);
    }

    // Verify the job belongs to this employer
    const existingJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, id), eq(jobs.employerId, auth.employerId)),
    });

    if (!existingJob) {
      return apiError("Job not found or not owned by you", 404);
    }

    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const data = parsed.data;

    // Build update set
    const updateSet: Record<string, unknown> = {};

    if (data.title !== undefined) updateSet.title = data.title;
    if (data.company !== undefined) updateSet.company = data.company;
    if (data.location !== undefined) updateSet.location = data.location;
    if (data.link !== undefined) updateSet.link = data.link;
    if (data.description !== undefined) updateSet.description = data.description;
    if (data.salary !== undefined) updateSet.salary = data.salary;
    if (data.is_remote !== undefined) updateSet.isRemote = data.is_remote;
    if (data.region !== undefined) {
      updateSet.region = data.region ? data.region.toUpperCase() : null;
    }
    if (data.is_active !== undefined) updateSet.isActive = data.is_active;

    // Resolve industry
    if (data.industry !== undefined) {
      if (data.industry === null) {
        updateSet.industryId = null;
      } else {
        const ind = await db.query.industries.findFirst({
          where: eq(industries.slug, data.industry),
        });
        if (ind) updateSet.industryId = ind.id;
      }
    }

    // Resolve taxonomy
    if (data.role_type !== undefined) {
      if (data.role_type === null) {
        updateSet.taxonomyId = null;
      } else {
        const tax = await db.query.roleTaxonomies.findFirst({
          where: eq(roleTaxonomies.slug, data.role_type),
        });
        if (tax) updateSet.taxonomyId = tax.id;
      }
    }

    // Handle featured toggle
    if (data.featured !== undefined) {
      updateSet.isFeatured = data.featured;
      if (data.featured && data.featured_days) {
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + data.featured_days);
        updateSet.featuredUntil = featuredUntil;
      } else if (!data.featured) {
        updateSet.featuredUntil = null;
      }
    }

    // Update last_seen_at
    updateSet.lastSeenAt = new Date();

    if (Object.keys(updateSet).length === 0) {
      return apiError("No fields to update", 400);
    }

    const [updated] = await db
      .update(jobs)
      .set(updateSet)
      .where(eq(jobs.id, id))
      .returning();

    return apiSuccess({
      id: updated.id,
      title: updated.title,
      company: updated.company,
      location: updated.location,
      link: updated.link,
      description: updated.description,
      salary: updated.salary,
      is_remote: updated.isRemote,
      region: updated.region,
      featured: updated.isFeatured,
      featured_until: updated.featuredUntil,
      is_active: updated.isActive,
      posted_at: updated.postedAt,
      serve_count: updated.serveCount,
    });
  } catch (err) {
    console.error("PATCH /api/employers/jobs/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
