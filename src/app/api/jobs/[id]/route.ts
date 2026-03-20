import { NextRequest } from "next/server";
import { z } from "zod";
import { getJobById, incrementServeCount } from "@/db/queries";
import { getFreshnessScore } from "@/lib/freshness";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

const uuidSchema = z.string().uuid("id must be a valid UUID");

// ---------------------------------------------------------------------------
// GET /api/jobs/:id
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return apiError("Invalid job ID", 400, parsed.error.issues);
    }

    const job = await getJobById(id);
    if (!job) {
      return apiError("Job not found", 404);
    }

    const freshness = getFreshnessScore(job.lastSeenAt);

    // Increment serve count (fire-and-forget)
    incrementServeCount([job.id]).catch(() => {});

    return apiSuccess({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      link: job.link,
      source: job.source,
      description: job.description,
      salary: job.salary,
      is_remote: job.isRemote,
      region: job.region,
      featured: job.isFeatured,
      featured_until: job.featuredUntil,
      posted_at: job.postedAt,
      freshness,
      industry: job.industry
        ? { id: job.industry.id, slug: job.industry.slug, name: job.industry.name }
        : null,
      taxonomy: job.taxonomy
        ? {
            id: job.taxonomy.id,
            slug: job.taxonomy.slug,
            canonical_title: job.taxonomy.canonicalTitle,
            related_titles: job.taxonomy.relatedTitles ?? [],
          }
        : null,
      employer: job.employer
        ? {
            company_name: job.employer.companyName,
            company_url: job.employer.companyUrl,
            logo_url: job.employer.logoUrl,
          }
        : null,
    });
  } catch (err) {
    console.error("GET /api/jobs/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
