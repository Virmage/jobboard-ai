import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, or, ilike, desc, asc, sql, count, gte, lte } from "drizzle-orm";
import { db } from "@/db/index";
import { jobs, industries, roleTaxonomies } from "@/db/schema";
import { getFreshnessScore } from "@/lib/freshness";
import { incrementServeCount } from "@/db/queries";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// Query-param schema
// ---------------------------------------------------------------------------
const searchSchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  market: z.string().optional(),
  role_type: z.string().optional(),
  remote: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === "true" || v === "1";
    }),
  featured: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === "true" || v === "1";
    }),
  salary_min: z.coerce.number().int().optional(),
  salary_max: z.coerce.number().int().optional(),
  salary_currency: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["relevance", "date", "featured"]).default("date"),
});

// ---------------------------------------------------------------------------
// GET /api/jobs
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = value;
    }

    const parsed = searchSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const {
      q,
      industry,
      market,
      role_type,
      remote,
      featured,
      salary_min,
      salary_max,
      salary_currency,
      page,
      limit,
      sort,
    } = parsed.data;

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(jobs.isActive, true)];

    // Text search across title, company, description
    if (q) {
      conditions.push(
        or(
          ilike(jobs.title, `%${q}%`),
          ilike(jobs.company, `%${q}%`),
          ilike(jobs.description, `%${q}%`)
        )!
      );
    }

    // Industry filter by slug
    if (industry) {
      const ind = await db.query.industries.findFirst({
        where: eq(industries.slug, industry),
      });
      if (ind) {
        conditions.push(eq(jobs.industryId, ind.id));
      }
    }

    // Market/region filter
    if (market) {
      conditions.push(eq(jobs.region, market.toUpperCase()));
    }

    // Role type filter by taxonomy slug
    if (role_type) {
      const tax = await db.query.roleTaxonomies.findFirst({
        where: eq(roleTaxonomies.slug, role_type),
      });
      if (tax) {
        conditions.push(eq(jobs.taxonomyId, tax.id));
      }
    }

    // Remote filter
    if (remote !== undefined) {
      conditions.push(eq(jobs.isRemote, remote));
    }

    // Featured filter
    if (featured !== undefined) {
      conditions.push(eq(jobs.isFeatured, featured));
    }

    // Salary filters
    if (salary_currency) {
      conditions.push(eq(jobs.salaryCurrency, salary_currency.toUpperCase()));
    }
    if (salary_min !== undefined) {
      conditions.push(gte(jobs.salaryMin, salary_min));
    }
    if (salary_max !== undefined) {
      conditions.push(lte(jobs.salaryMax, salary_max));
    }

    const where = and(...conditions);

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "featured":
        orderBy = [desc(jobs.isFeatured), desc(jobs.postedAt)];
        break;
      case "relevance":
        // When q is provided, featured first then posted date
        orderBy = q
          ? [desc(jobs.isFeatured), desc(jobs.postedAt)]
          : [desc(jobs.postedAt)];
        break;
      case "date":
      default:
        orderBy = [desc(jobs.postedAt)];
        break;
    }

    const [results, totalResult] = await Promise.all([
      db.query.jobs.findMany({
        where,
        with: {
          industry: true,
          taxonomy: true,
        },
        orderBy,
        limit,
        offset,
      }),
      db.select({ total: count() }).from(jobs).where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Enrich with freshness and normalize shape
    const enriched = results.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      link: job.link,
      source: job.source,
      description: job.description,
      salary: job.salary,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      salary_currency: job.salaryCurrency,
      is_remote: job.isRemote,
      region: job.region,
      featured: job.isFeatured,
      featured_until: job.featuredUntil,
      posted_at: job.postedAt,
      freshness: getFreshnessScore(job.lastSeenAt),
      industry: job.industry
        ? { id: job.industry.id, slug: job.industry.slug, name: job.industry.name }
        : null,
      taxonomy: job.taxonomy
        ? {
            id: job.taxonomy.id,
            slug: job.taxonomy.slug,
            canonical_title: job.taxonomy.canonicalTitle,
          }
        : null,
    }));

    // Increment serve counts (fire-and-forget)
    const jobIds = enriched.map((j) => j.id);
    if (jobIds.length > 0) {
      incrementServeCount(jobIds).catch(() => {});
    }

    return apiSuccess(enriched, { total, page, limit });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return apiCorsOptions();
}
