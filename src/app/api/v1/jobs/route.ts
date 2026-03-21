import { NextRequest } from "next/server";
import { z } from "zod";
import { searchJobs, incrementServeCount } from "@/db/queries";
import { getFreshnessScore } from "@/lib/freshness";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import {
  jsonOk,
  badRequest,
  zodValidationError,
  handleCorsOptions,
} from "@/lib/api-response";
import { withAuth, type ValidateResult } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// Query-param schema
// ---------------------------------------------------------------------------
const searchSchema = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  remote: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === "true" || v === "1";
    }),
  region: z.string().optional(),
  posted_after: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        return !isNaN(Date.parse(v));
      },
      { message: "posted_after must be a valid ISO date string" }
    ),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["posted", "freshness", "relevance"]).default("posted"),
});

// ---------------------------------------------------------------------------
// GET /api/v1/jobs
// ---------------------------------------------------------------------------
export const GET = withAuth(async function GET(request: NextRequest, _auth: ValidateResult) {
  const { searchParams } = request.nextUrl;

  // Parse all query params into a plain object
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) {
    return zodValidationError(parsed.error);
  }

  const {
    q,
    role,
    industry,
    remote,
    region,
    posted_after,
    page,
    per_page,
    sort,
  } = parsed.data;

  const offset = (page - 1) * per_page;

  const result = await searchJobs({
    query: q,
    taxonomySlug: role,
    industrySlug: industry,
    isRemote: remote,
    region,
    limit: per_page,
    offset,
  });

  // Enrich each job with a freshness score
  let enriched = result.jobs.map((job) => {
    const freshness = getFreshnessScore(job.lastSeenAt);
    return { ...job, freshness };
  });

  // Filter by posted_after if specified
  if (posted_after) {
    const cutoff = new Date(posted_after);
    enriched = enriched.filter(
      (job) => job.postedAt && new Date(job.postedAt) >= cutoff
    );
  }

  // Re-sort based on sort param
  if (sort === "freshness") {
    enriched.sort((a, b) => b.freshness.score - a.freshness.score);
  }
  // "posted" is already the default from the DB query (desc postedAt)
  // "relevance" is only meaningful when q is provided — the DB ilike ordering
  // approximates it, so we keep the default order.

  // Increment serve counts asynchronously (fire-and-forget)
  const jobIds = enriched.map((j) => j.id);
  if (jobIds.length > 0) {
    incrementServeCount(jobIds).catch(() => {});
  }

  const totalPages = Math.ceil(result.total / per_page);

  return jsonOk({
    jobs: enriched,
    pagination: {
      page,
      per_page,
      total: result.total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
    meta: {
      query_expanded_to: q ?? null,
      sort,
      filters: {
        role: role ?? null,
        industry: industry ?? null,
        remote: remote ?? null,
        region: region ?? null,
        posted_after: posted_after ?? null,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
