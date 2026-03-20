import { NextRequest } from "next/server";
import { z } from "zod";
import { getTaxonomy, listTaxonomies } from "@/db/queries";
import { db } from "@/db/index";
import { jobs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import {
  jsonOk,
  notFound,
  zodValidationError,
  handleCorsOptions,
} from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Query-param schema
// ---------------------------------------------------------------------------
const querySchema = z.object({
  slug: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/taxonomy?slug=...
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return zodValidationError(parsed.error);
  }

  const { slug } = parsed.data;

  // Single taxonomy lookup
  if (slug) {
    const taxonomy = await getTaxonomy(slug);
    if (!taxonomy) {
      return notFound("Taxonomy not found");
    }

    // Get job count for this taxonomy
    const [jobCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(
        and(eq(jobs.taxonomyId, taxonomy.id), eq(jobs.isActive, true))
      );

    return jsonOk({
      taxonomy: {
        id: taxonomy.id,
        slug: taxonomy.slug,
        canonical_title: taxonomy.canonicalTitle,
        related_titles: taxonomy.relatedTitles ?? [],
        title_patterns: taxonomy.titlePatterns ?? [],
        industry: taxonomy.industry
          ? {
              id: taxonomy.industry.id,
              slug: taxonomy.industry.slug,
              name: taxonomy.industry.name,
            }
          : null,
        job_count: Number(jobCount?.count ?? 0),
      },
    });
  }

  // List all taxonomies
  const allTaxonomies = await listTaxonomies();

  // Batch-fetch job counts per taxonomy
  const jobCounts = await db
    .select({
      taxonomyId: jobs.taxonomyId,
      count: count(),
    })
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .groupBy(jobs.taxonomyId);

  const countMap = new Map(
    jobCounts.map((jc) => [jc.taxonomyId, Number(jc.count)])
  );

  return jsonOk({
    taxonomies: allTaxonomies.map((tax) => ({
      id: tax.id,
      slug: tax.slug,
      canonical_title: tax.canonicalTitle,
      related_titles: tax.relatedTitles ?? [],
      title_patterns: tax.titlePatterns ?? [],
      industry: tax.industry
        ? {
            id: tax.industry.id,
            slug: tax.industry.slug,
            name: tax.industry.name,
          }
        : null,
      job_count: countMap.get(tax.id) ?? 0,
    })),
  });
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
