import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  count,
  inArray,
  isNull,
  gt,
} from "drizzle-orm";
import { db } from "./index";
import {
  jobs,
  industries,
  roleTaxonomies,
  apiServes,
  scanRuns,
} from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SearchJobsParams {
  query?: string;
  industrySlug?: string;
  taxonomySlug?: string;
  region?: string;
  isRemote?: boolean;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface UpsertJobData {
  title: string;
  company: string;
  location?: string | null;
  link?: string | null;
  source?: string | null;
  industryId?: string | null;
  taxonomyId?: string | null;
  description?: string | null;
  salary?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  isRemote?: boolean;
  region?: string | null;
  postedAt?: Date | null;
  scannedAt?: Date;
  lastSeenAt?: Date;
  expiresAt?: Date | null;
  isActive?: boolean;
  isFeatured?: boolean;
  featuredUntil?: Date | null;
  employerId?: string | null;
  dedupKey: string;
}

export interface ScanRunData {
  totalFound: number;
  newJobs: number;
  sourceBreakdown?: Record<string, number>;
  errors?: Array<{ source: string; message: string }>;
  status: string;
  completedAt?: Date;
}

// ---------------------------------------------------------------------------
// searchJobs — full-text search with filters, featured first, pagination
// ---------------------------------------------------------------------------
export async function searchJobs(params: SearchJobsParams) {
  const {
    query,
    industrySlug,
    taxonomySlug,
    region,
    isRemote,
    source,
    limit = 20,
    offset = 0,
  } = params;

  const conditions = [eq(jobs.isActive, true)];

  if (query) {
    conditions.push(
      or(
        ilike(jobs.title, `%${query}%`),
        ilike(jobs.company, `%${query}%`),
        ilike(jobs.description, `%${query}%`)
      )!
    );
  }

  if (industrySlug) {
    const industry = await db.query.industries.findFirst({
      where: eq(industries.slug, industrySlug),
    });
    if (industry) {
      conditions.push(eq(jobs.industryId, industry.id));
    }
  }

  if (taxonomySlug) {
    const taxonomy = await db.query.roleTaxonomies.findFirst({
      where: eq(roleTaxonomies.slug, taxonomySlug),
    });
    if (taxonomy) {
      conditions.push(eq(jobs.taxonomyId, taxonomy.id));
    }
  }

  if (region) {
    conditions.push(eq(jobs.region, region));
  }

  if (isRemote !== undefined) {
    conditions.push(eq(jobs.isRemote, isRemote));
  }

  if (source) {
    conditions.push(eq(jobs.source, source));
  }

  const where = and(...conditions);

  const [results, totalResult] = await Promise.all([
    db.query.jobs.findMany({
      where,
      with: {
        industry: true,
        taxonomy: true,
      },
      orderBy: [desc(jobs.isFeatured), desc(jobs.postedAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(jobs).where(where),
  ]);

  return {
    jobs: results,
    total: totalResult[0]?.total ?? 0,
    limit,
    offset,
  };
}

// ---------------------------------------------------------------------------
// upsertJob — ON CONFLICT dedup_key DO UPDATE
// ---------------------------------------------------------------------------
export async function upsertJob(job: UpsertJobData) {
  const now = new Date();
  const result = await db
    .insert(jobs)
    .values({
      title: job.title,
      company: job.company,
      location: job.location ?? null,
      link: job.link ?? null,
      source: job.source ?? null,
      industryId: job.industryId ?? null,
      taxonomyId: job.taxonomyId ?? null,
      description: job.description ?? null,
      salary: job.salary ?? null,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      salaryCurrency: job.salaryCurrency ?? null,
      isRemote: job.isRemote ?? false,
      region: job.region ?? null,
      postedAt: job.postedAt ?? null,
      scannedAt: job.scannedAt ?? now,
      lastSeenAt: job.lastSeenAt ?? now,
      expiresAt: job.expiresAt ?? null,
      isActive: job.isActive ?? true,
      isFeatured: job.isFeatured ?? false,
      featuredUntil: job.featuredUntil ?? null,
      employerId: job.employerId ?? null,
      dedupKey: job.dedupKey,
    })
    .onConflictDoUpdate({
      target: jobs.dedupKey,
      set: {
        title: sql`EXCLUDED.title`,
        company: sql`EXCLUDED.company`,
        location: sql`EXCLUDED.location`,
        link: sql`EXCLUDED.link`,
        source: sql`EXCLUDED.source`,
        industryId: sql`EXCLUDED.industry_id`,
        taxonomyId: sql`EXCLUDED.taxonomy_id`,
        description: sql`EXCLUDED.description`,
        salary: sql`EXCLUDED.salary`,
        salaryMin: sql`EXCLUDED.salary_min`,
        salaryMax: sql`EXCLUDED.salary_max`,
        salaryCurrency: sql`EXCLUDED.salary_currency`,
        isRemote: sql`EXCLUDED.is_remote`,
        region: sql`EXCLUDED.region`,
        lastSeenAt: sql`NOW()`,
        isActive: sql`EXCLUDED.is_active`,
      },
    })
    .returning();

  return result[0];
}

// ---------------------------------------------------------------------------
// getJobById
// ---------------------------------------------------------------------------
export async function getJobById(id: string) {
  return db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      industry: true,
      taxonomy: true,
      employer: true,
    },
  });
}

// ---------------------------------------------------------------------------
// suggestRoles — match query against taxonomy title patterns
// ---------------------------------------------------------------------------
export async function suggestRoles(query: string) {
  const allTaxonomies = await db.query.roleTaxonomies.findMany({
    with: { industry: true },
  });

  const lowerQuery = query.toLowerCase();
  const scored = allTaxonomies
    .map((tax) => {
      let score = 0;

      // Check canonical title
      if (tax.canonicalTitle.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }

      // Check related titles
      const related = (tax.relatedTitles ?? []) as string[];
      for (const title of related) {
        if (title.toLowerCase().includes(lowerQuery)) {
          score += 5;
          break;
        }
      }

      // Check title patterns (regexes)
      const patterns = (tax.titlePatterns ?? []) as string[];
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, "i");
          if (regex.test(query)) {
            score += 8;
            break;
          }
        } catch {
          // skip invalid regex
        }
      }

      return { ...tax, score };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 10);
}

// ---------------------------------------------------------------------------
// listIndustries — with job counts
// ---------------------------------------------------------------------------
export async function listIndustries() {
  const results = await db
    .select({
      id: industries.id,
      slug: industries.slug,
      name: industries.name,
      description: industries.description,
      displayOrder: industries.displayOrder,
      jobCount: count(jobs.id),
    })
    .from(industries)
    .leftJoin(
      jobs,
      and(eq(jobs.industryId, industries.id), eq(jobs.isActive, true))
    )
    .groupBy(industries.id)
    .orderBy(asc(industries.displayOrder));

  return results;
}

// ---------------------------------------------------------------------------
// getTaxonomy
// ---------------------------------------------------------------------------
export async function getTaxonomy(slug: string) {
  return db.query.roleTaxonomies.findFirst({
    where: eq(roleTaxonomies.slug, slug),
    with: { industry: true },
  });
}

// ---------------------------------------------------------------------------
// listTaxonomies
// ---------------------------------------------------------------------------
export async function listTaxonomies() {
  return db.query.roleTaxonomies.findMany({
    with: { industry: true },
    orderBy: asc(roleTaxonomies.canonicalTitle),
  });
}

// ---------------------------------------------------------------------------
// incrementServeCount — bump serve_count on a batch of jobs
// ---------------------------------------------------------------------------
export async function incrementServeCount(jobIds: string[]) {
  if (jobIds.length === 0) return;

  await db
    .update(jobs)
    .set({
      serveCount: sql`${jobs.serveCount} + 1`,
    })
    .where(inArray(jobs.id, jobIds));

  // Also upsert daily analytics
  const today = new Date().toISOString().split("T")[0];
  for (const jobId of jobIds) {
    await db
      .insert(apiServes)
      .values({
        jobId,
        date: today,
        serveCount: 1,
        uniqueConsumers: 1,
      })
      .onConflictDoUpdate({
        target: [apiServes.jobId, apiServes.date],
        set: {
          serveCount: sql`${apiServes.serveCount} + 1`,
        },
      });
  }
}

// ---------------------------------------------------------------------------
// recordScanRun
// ---------------------------------------------------------------------------
export async function recordScanRun(data: ScanRunData) {
  const result = await db
    .insert(scanRuns)
    .values({
      totalFound: data.totalFound,
      newJobs: data.newJobs,
      sourceBreakdown: data.sourceBreakdown ?? {},
      errors: data.errors ?? [],
      status: data.status,
      completedAt: data.completedAt ?? null,
    })
    .returning();

  return result[0];
}
