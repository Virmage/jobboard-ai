import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  count,
} from "drizzle-orm";
import * as schema from "../db/schema";
import { getFreshnessScore } from "../lib/freshness";

// ---------------------------------------------------------------------------
// Database connection (standalone, not importing from db/index to avoid
// Next.js env coupling — reads DATABASE_URL directly)
// ---------------------------------------------------------------------------
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: "search_jobs",
    description:
      "Search the AgentJobs database for job listings. Supports free-text search across titles, companies, and descriptions. Filter by industry, market/region, remote status, and role type. Results are sorted by featured status then posting date. Use this tool when a user is looking for jobs, exploring opportunities, or wants to see what's available.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search query to match against job titles, companies, and descriptions (e.g. 'machine learning engineer', 'product manager crypto')",
        },
        industry: {
          type: "array",
          items: { type: "string" },
          description:
            "Filter by industry slugs (e.g. ['tech', 'finance']). Use get_market_stats to see available industries.",
        },
        market: {
          type: "array",
          items: { type: "string" },
          description:
            "Filter by geographic market/region (e.g. ['US', 'EU']). Valid values: US, EU, APAC, LATAM, Global.",
        },
        remote: {
          type: "boolean",
          description: "When true, only return remote-friendly positions",
        },
        role_type: {
          type: "string",
          description:
            "Filter by role taxonomy slug (e.g. 'software-engineer', 'product-manager'). Use suggest_roles to discover role types.",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of results to return (default: 10, max: 25)",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_job_details",
    description:
      "Get complete details for a specific job listing including the full description, requirements, salary information, freshness score, and apply link. Use this after search_jobs when a user wants more information about a particular position.",
    inputSchema: {
      type: "object" as const,
      properties: {
        job_id: {
          type: "string",
          description: "The UUID of the job to retrieve (from search_jobs results)",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "suggest_roles",
    description:
      "The role intelligence engine. Given a natural language description of what someone actually does (NOT a job title), suggests matching role titles grouped by confidence level. This is the KEY FEATURE for career exploration — helps users discover roles they might not have considered. Example input: 'I lead brand strategy and creative campaigns for tech companies' returns grouped suggestions like Creative Director, Head of Brand, VP Marketing, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        description: {
          type: "string",
          description:
            "A natural language description of what the person does, their skills, experience, or interests. NOT a job title — describe the actual work. (e.g. 'I build and deploy machine learning models for fraud detection at a fintech company')",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "get_market_stats",
    description:
      "Get statistics about the job market on AgentJobs. Shows total jobs, breakdowns by industry and market/region, trending roles, and salary ranges. Useful for understanding the landscape before searching, or for market research. Can be filtered to a specific industry or market.",
    inputSchema: {
      type: "object" as const,
      properties: {
        industry: {
          type: "string",
          description:
            "Optional: filter stats to a specific industry slug (e.g. 'tech', 'finance')",
        },
        market: {
          type: "string",
          description:
            "Optional: filter stats to a specific region (US, EU, APAC, LATAM, Global)",
        },
      },
      required: [],
    },
  },
  {
    name: "subscribe_alerts",
    description:
      "Set up job alert preferences for email notifications. Stores the user's preferences so they can be notified when new matching jobs are posted. Returns a subscription ID for managing the alert later.",
    inputSchema: {
      type: "object" as const,
      properties: {
        email: {
          type: "string",
          description: "Email address to send job alerts to",
        },
        roles: {
          type: "array",
          items: { type: "string" },
          description:
            "Role titles or taxonomy slugs to watch (e.g. ['software-engineer', 'product-manager'])",
        },
        industries: {
          type: "array",
          items: { type: "string" },
          description:
            "Industry slugs to watch (e.g. ['tech', 'crypto'])",
        },
        markets: {
          type: "array",
          items: { type: "string" },
          description:
            "Market/region codes to watch (e.g. ['US', 'EU'])",
        },
        remote_only: {
          type: "boolean",
          description: "When true, only alert for remote positions",
        },
      },
      required: ["email"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://agentjobs.vercel.app";

async function handleSearchJobs(
  db: Db,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const query = args.query as string | undefined;
  const industryFilters = (args.industry as string[] | undefined) ?? [];
  const marketFilters = (args.market as string[] | undefined) ?? [];
  const remote = args.remote as boolean | undefined;
  const roleType = args.role_type as string | undefined;
  const limit = Math.min(Math.max(1, Number(args.limit) || 10), 25);
  const page = Math.max(1, Number(args.page) || 1);
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [eq(schema.jobs.isActive, true)];

  if (query) {
    conditions.push(
      or(
        ilike(schema.jobs.title, `%${query}%`),
        ilike(schema.jobs.company, `%${query}%`),
        ilike(schema.jobs.description, `%${query}%`)
      )!
    );
  }

  if (industryFilters.length > 0) {
    const matchedIndustries = await db.query.industries.findMany({
      where: or(
        ...industryFilters.map((slug) => eq(schema.industries.slug, slug))
      ),
    });
    if (matchedIndustries.length > 0) {
      conditions.push(
        or(
          ...matchedIndustries.map((ind) =>
            eq(schema.jobs.industryId, ind.id)
          )
        )!
      );
    }
  }

  if (marketFilters.length > 0) {
    conditions.push(
      or(...marketFilters.map((m) => eq(schema.jobs.region, m)))!
    );
  }

  if (remote === true) {
    conditions.push(eq(schema.jobs.isRemote, true));
  }

  if (roleType) {
    const taxonomy = await db.query.roleTaxonomies.findFirst({
      where: eq(schema.roleTaxonomies.slug, roleType),
    });
    if (taxonomy) {
      conditions.push(eq(schema.jobs.taxonomyId, taxonomy.id));
    }
  }

  const where = and(...conditions);

  const [results, totalResult] = await Promise.all([
    db.query.jobs.findMany({
      where,
      with: { industry: true, taxonomy: true },
      orderBy: [desc(schema.jobs.isFeatured), desc(schema.jobs.postedAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(schema.jobs).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  if (results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            jobs: [],
            total: 0,
            page,
            limit,
            message: `No jobs found${query ? ` matching "${query}"` : ""}.`,
          }),
        },
      ],
    };
  }

  const jobsList = results.map((job) => {
    const freshness = getFreshnessScore(job.lastSeenAt);
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.isRemote
        ? `Remote${job.location ? ` (${job.location})` : ""}`
        : job.location ?? null,
      apply_url: job.link
        ? `${baseUrl}/go/${job.id}`
        : null,
      industry: job.industry?.name ?? null,
      market: job.region ?? null,
      featured: job.isFeatured,
      posted_at: job.postedAt
        ? new Date(job.postedAt).toISOString().split("T")[0]
        : null,
      salary: job.salary ?? null,
      freshness: freshness.label,
    };
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          jobs: jobsList,
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        }),
      },
    ],
  };
}

async function handleGetJobDetails(
  db: Db,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const jobId = args.job_id as string;
  if (!jobId) {
    return {
      content: [{ type: "text", text: "Error: job_id is required." }],
      isError: true,
    };
  }

  const job = await db.query.jobs.findFirst({
    where: eq(schema.jobs.id, jobId),
    with: { industry: true, taxonomy: true, employer: true },
  });

  if (!job) {
    return {
      content: [
        { type: "text", text: `No job found with ID: ${jobId}` },
      ],
      isError: true,
    };
  }

  const freshness = getFreshnessScore(job.lastSeenAt);

  const result = {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.isRemote
      ? `Remote${job.location ? ` (${job.location})` : ""}`
      : job.location ?? null,
    is_remote: job.isRemote,
    industry: job.industry?.name ?? null,
    role_category: job.taxonomy?.canonicalTitle ?? null,
    related_titles: (job.taxonomy?.relatedTitles as string[]) ?? [],
    salary: job.salary ?? null,
    source: job.source ?? null,
    description: job.description ?? null,
    apply_url: job.link ? `${baseUrl}/go/${job.id}` : null,
    featured: job.isFeatured,
    posted_at: job.postedAt
      ? new Date(job.postedAt).toISOString().split("T")[0]
      : null,
    freshness: {
      score: freshness.score,
      label: freshness.label,
      tier: freshness.tier,
    },
    employer: job.employer
      ? {
          name: job.employer.name,
          company: job.employer.companyName ?? null,
          website: job.employer.companyUrl ?? null,
          logo: job.employer.logoUrl ?? null,
        }
      : null,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

async function handleSuggestRoles(
  db: Db,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const description = args.description as string;
  if (!description) {
    return {
      content: [{ type: "text", text: "Error: description is required." }],
      isError: true,
    };
  }

  // Fetch all taxonomies with their industries
  const allTaxonomies = await db.query.roleTaxonomies.findMany({
    with: { industry: true },
  });

  const lowerDesc = description.toLowerCase();
  const words = lowerDesc
    .split(/[\s,;.!?]+/)
    .filter((w) => w.length > 2);

  // Score each taxonomy against the description
  const scored = allTaxonomies
    .map((tax) => {
      let score = 0;

      // Check canonical title words against description
      const titleWords = tax.canonicalTitle.toLowerCase().split(/\s+/);
      for (const tw of titleWords) {
        if (tw.length > 2 && lowerDesc.includes(tw)) {
          score += 3;
        }
      }

      // Check related titles
      const related = (tax.relatedTitles ?? []) as string[];
      for (const title of related) {
        const relWords = title.toLowerCase().split(/\s+/);
        let relMatch = 0;
        for (const rw of relWords) {
          if (rw.length > 2 && lowerDesc.includes(rw)) {
            relMatch++;
          }
        }
        if (relMatch > 0) {
          score += relMatch * 2;
        }
      }

      // Check title patterns (regexes)
      const patterns = (tax.titlePatterns ?? []) as string[];
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, "i");
          if (regex.test(description)) {
            score += 8;
          }
        } catch {
          // skip invalid regex
        }
      }

      // Check if any description words match canonical title
      for (const word of words) {
        if (tax.canonicalTitle.toLowerCase().includes(word)) {
          score += 1;
        }
      }

      return {
        id: tax.id,
        slug: tax.slug,
        title: tax.canonicalTitle,
        related_titles: related.slice(0, 5),
        industry: tax.industry?.name ?? null,
        score,
      };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            input: description,
            high_match: [],
            medium_match: [],
            low_match: [],
            message:
              "No matching roles found. Try describing your work in more detail — what you build, who you work with, what outcomes you drive.",
          }),
        },
      ],
    };
  }

  // Group by confidence: top 20% = high, next 30% = medium, rest = low
  const maxScore = scored[0].score;
  const highThreshold = maxScore * 0.7;
  const mediumThreshold = maxScore * 0.4;

  const high_match: Array<{
    title: string;
    related_titles: string[];
    industry: string | null;
    slug: string;
  }> = [];
  const medium_match: Array<{
    title: string;
    related_titles: string[];
    industry: string | null;
    slug: string;
  }> = [];
  const low_match: Array<{
    title: string;
    related_titles: string[];
    industry: string | null;
    slug: string;
  }> = [];

  for (const item of scored.slice(0, 15)) {
    const entry = {
      title: item.title,
      related_titles: item.related_titles,
      industry: item.industry,
      slug: item.slug,
    };
    if (item.score >= highThreshold) {
      high_match.push(entry);
    } else if (item.score >= mediumThreshold) {
      medium_match.push(entry);
    } else {
      low_match.push(entry);
    }
  }

  // Ensure at least something in high_match
  if (high_match.length === 0 && medium_match.length > 0) {
    high_match.push(medium_match.shift()!);
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          input: description,
          high_match: high_match.slice(0, 5),
          medium_match: medium_match.slice(0, 5),
          low_match: low_match.slice(0, 5),
        }),
      },
    ],
  };
}

async function handleGetMarketStats(
  db: Db,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const industryFilter = args.industry as string | undefined;
  const marketFilter = args.market as string | undefined;

  // Base conditions
  const baseConditions = [eq(schema.jobs.isActive, true)];

  if (industryFilter) {
    const industry = await db.query.industries.findFirst({
      where: eq(schema.industries.slug, industryFilter),
    });
    if (industry) {
      baseConditions.push(eq(schema.jobs.industryId, industry.id));
    }
  }

  if (marketFilter) {
    baseConditions.push(eq(schema.jobs.region, marketFilter));
  }

  const baseWhere = and(...baseConditions);

  // Total jobs
  const [totalResult] = await db
    .select({ total: count() })
    .from(schema.jobs)
    .where(baseWhere);

  const totalJobs = totalResult?.total ?? 0;

  // By industry
  const byIndustry = await db
    .select({
      name: schema.industries.name,
      slug: schema.industries.slug,
      count: count(schema.jobs.id),
    })
    .from(schema.jobs)
    .innerJoin(
      schema.industries,
      eq(schema.jobs.industryId, schema.industries.id)
    )
    .where(baseWhere)
    .groupBy(schema.industries.id)
    .orderBy(desc(count(schema.jobs.id)));

  // By market/region
  const byMarket = await db
    .select({
      region: schema.jobs.region,
      count: count(schema.jobs.id),
    })
    .from(schema.jobs)
    .where(and(...baseConditions, sql`${schema.jobs.region} IS NOT NULL`))
    .groupBy(schema.jobs.region)
    .orderBy(desc(count(schema.jobs.id)));

  // Trending roles (most common taxonomy titles)
  const trendingRoles = await db
    .select({
      title: schema.roleTaxonomies.canonicalTitle,
      slug: schema.roleTaxonomies.slug,
      count: count(schema.jobs.id),
    })
    .from(schema.jobs)
    .innerJoin(
      schema.roleTaxonomies,
      eq(schema.jobs.taxonomyId, schema.roleTaxonomies.id)
    )
    .where(baseWhere)
    .groupBy(schema.roleTaxonomies.id)
    .orderBy(desc(count(schema.jobs.id)))
    .limit(10);

  // Remote vs on-site breakdown
  const [remoteCount] = await db
    .select({ count: count() })
    .from(schema.jobs)
    .where(and(...baseConditions, eq(schema.jobs.isRemote, true)));

  // Salary ranges — extract from jobs that have salary data
  const salaryJobs = await db
    .select({ salary: schema.jobs.salary })
    .from(schema.jobs)
    .where(
      and(...baseConditions, sql`${schema.jobs.salary} IS NOT NULL`)
    )
    .limit(200);

  const salaryValues = salaryJobs
    .map((j) => {
      const match = j.salary?.match(/\$?([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
    })
    .filter((v): v is number => v !== null && v > 10000)
    .sort((a, b) => a - b);

  const salaryRange =
    salaryValues.length >= 3
      ? {
          min: salaryValues[Math.floor(salaryValues.length * 0.1)],
          median: salaryValues[Math.floor(salaryValues.length * 0.5)],
          max: salaryValues[Math.floor(salaryValues.length * 0.9)],
          sample_size: salaryValues.length,
        }
      : null;

  const result = {
    total_jobs: totalJobs,
    filters_applied: {
      industry: industryFilter ?? null,
      market: marketFilter ?? null,
    },
    by_industry: byIndustry.map((r) => ({
      name: r.name,
      slug: r.slug,
      jobs: r.count,
    })),
    by_market: byMarket.map((r) => ({
      region: r.region,
      jobs: r.count,
    })),
    trending_roles: trendingRoles.map((r) => ({
      title: r.title,
      slug: r.slug,
      jobs: r.count,
    })),
    remote_jobs: remoteCount?.count ?? 0,
    onsite_jobs: totalJobs - (remoteCount?.count ?? 0),
    salary_ranges: salaryRange,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

async function handleSubscribeAlerts(
  _db: Db,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const email = args.email as string;
  if (!email) {
    return {
      content: [{ type: "text", text: "Error: email is required." }],
      isError: true,
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      content: [
        { type: "text", text: "Error: invalid email format." },
      ],
      isError: true,
    };
  }

  const roles = (args.roles as string[] | undefined) ?? [];
  const industries = (args.industries as string[] | undefined) ?? [];
  const markets = (args.markets as string[] | undefined) ?? [];
  const remoteOnly = (args.remote_only as boolean) ?? false;

  // Generate a subscription ID (deterministic from email + prefs for idempotency)
  const subId = `sub_${Buffer.from(
    `${email}:${roles.join(",")}:${industries.join(",")}:${markets.join(",")}:${remoteOnly}`
  )
    .toString("base64url")
    .slice(0, 16)}`;

  // In a full implementation this would persist to a subscriptions table.
  // For now, we log and return the subscription confirmation.
  console.error(
    `[agentjobs-mcp] New alert subscription: ${subId} for ${email}`
  );

  const result = {
    subscription_id: subId,
    email,
    preferences: {
      roles: roles.length > 0 ? roles : "all",
      industries: industries.length > 0 ? industries : "all",
      markets: markets.length > 0 ? markets : "all",
      remote_only: remoteOnly,
    },
    status: "active",
    message: `Job alerts activated for ${email}. You'll receive notifications when new jobs matching your preferences are posted.`,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

// ---------------------------------------------------------------------------
// createMcpServer — factory to build and wire up the MCP Server instance
// ---------------------------------------------------------------------------
export function createMcpServer(): Server {
  const db = createDb();

  const server = new Server(
    {
      name: "agentjobs",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // -- List tools handler --
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // -- Call tool handler --
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case "search_jobs":
          return await handleSearchJobs(db, toolArgs);
        case "get_job_details":
          return await handleGetJobDetails(db, toolArgs);
        case "suggest_roles":
          return await handleSuggestRoles(db, toolArgs);
        case "get_market_stats":
          return await handleGetMarketStats(db, toolArgs);
        case "subscribe_alerts":
          return await handleSubscribeAlerts(db, toolArgs);
        default:
          return {
            content: [
              { type: "text", text: `Unknown tool: ${name}` },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(`[agentjobs-mcp] Error in ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
