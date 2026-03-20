import { jsonOk, handleCorsOptions } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// GET /api/openapi.json — OpenAPI 3.1 spec for ChatGPT Actions
// ---------------------------------------------------------------------------
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "JobBoard AI API",
      version: "1.0.0",
      description:
        "AI-friendly job search API with freshness scoring, role taxonomy, and industry filtering. Designed for consumption by ChatGPT Actions and other LLM tool-use frameworks.",
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobboard.ai",
        description: "Production",
      },
    ],
    security: [{ BearerAuth: [] }],
    paths: {
      "/api/v1/jobs": {
        get: {
          operationId: "searchJobs",
          summary: "Search for jobs",
          description:
            "Full-text search with filters by role, industry, region, and remote status. Returns freshness-scored results with pagination.",
          parameters: [
            {
              name: "q",
              in: "query",
              description: "Free-text search query (matches title, company, description)",
              schema: { type: "string" },
            },
            {
              name: "role",
              in: "query",
              description: "Role taxonomy slug to filter by (e.g. 'software-engineer')",
              schema: { type: "string" },
            },
            {
              name: "industry",
              in: "query",
              description: "Industry slug to filter by (e.g. 'fintech')",
              schema: { type: "string" },
            },
            {
              name: "remote",
              in: "query",
              description: "Filter for remote jobs only",
              schema: { type: "boolean" },
            },
            {
              name: "region",
              in: "query",
              description: "Region filter (US, EU, APAC, LATAM, Global)",
              schema: { type: "string" },
            },
            {
              name: "posted_after",
              in: "query",
              description: "ISO 8601 date; only return jobs posted after this date",
              schema: { type: "string", format: "date-time" },
            },
            {
              name: "page",
              in: "query",
              description: "Page number (1-indexed)",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "per_page",
              in: "query",
              description: "Results per page (max 100)",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
            {
              name: "sort",
              in: "query",
              description: "Sort order",
              schema: {
                type: "string",
                enum: ["posted", "freshness", "relevance"],
                default: "posted",
              },
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of matching jobs",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/JobSearchResponse" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Rate limit exceeded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/jobs/{id}": {
        get: {
          operationId: "getJobById",
          summary: "Get a job by ID",
          description: "Retrieve full details of a single job listing by UUID.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Job UUID",
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Job detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/JobDetailResponse" },
                },
              },
            },
            "400": { description: "Invalid ID format" },
            "404": { description: "Job not found" },
          },
        },
      },
      "/api/v1/industries": {
        get: {
          operationId: "listIndustries",
          summary: "List all industries",
          description: "Returns all industries with their active job counts.",
          responses: {
            "200": {
              description: "List of industries",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IndustriesResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/roles/suggest": {
        get: {
          operationId: "suggestRoles",
          summary: "Suggest role taxonomies",
          description:
            "Returns matching taxonomy clusters based on a free-text query. Useful for role auto-complete and query expansion.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              description: "Search text to match against role titles and patterns",
              schema: { type: "string", minLength: 1, maxLength: 200 },
            },
          ],
          responses: {
            "200": {
              description: "Role suggestions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RoleSuggestResponse" },
                },
              },
            },
            "400": { description: "Missing or invalid q parameter" },
          },
        },
      },
      "/api/v1/taxonomy": {
        get: {
          operationId: "listOrGetTaxonomy",
          summary: "List taxonomies or get one by slug",
          description:
            "Without slug param: returns all role taxonomies with job counts. With slug param: returns a single taxonomy.",
          parameters: [
            {
              name: "slug",
              in: "query",
              description: "Taxonomy slug for single lookup",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Taxonomy data",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TaxonomyResponse" },
                },
              },
            },
            "404": { description: "Taxonomy not found (when slug provided)" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "API key obtained from the JobBoard AI dashboard. Anonymous access is allowed with IP-based rate limiting (10 req/hr).",
        },
      },
      schemas: {
        Freshness: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Normalized freshness score from 0 (stale) to 1 (very fresh)",
            },
            label: {
              type: "string",
              description: "Human-readable label like 'verified 2 hours ago'",
            },
            tier: {
              type: "string",
              enum: ["very_fresh", "fresh", "recent", "aging", "stale", "expired"],
            },
          },
        },
        Job: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            company: { type: "string" },
            location: { type: "string", nullable: true },
            link: { type: "string", nullable: true },
            source: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            salary: { type: "string", nullable: true },
            is_remote: { type: "boolean" },
            region: { type: "string", nullable: true },
            posted_at: { type: "string", format: "date-time", nullable: true },
            last_seen_at: { type: "string", format: "date-time" },
            is_featured: { type: "boolean" },
            freshness: { $ref: "#/components/schemas/Freshness" },
            industry: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                slug: { type: "string" },
                name: { type: "string" },
              },
            },
            taxonomy: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                slug: { type: "string" },
                canonical_title: { type: "string" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            per_page: { type: "integer" },
            total: { type: "integer" },
            total_pages: { type: "integer" },
            has_next: { type: "boolean" },
            has_prev: { type: "boolean" },
          },
        },
        JobSearchResponse: {
          type: "object",
          properties: {
            jobs: { type: "array", items: { $ref: "#/components/schemas/Job" } },
            pagination: { $ref: "#/components/schemas/Pagination" },
            meta: {
              type: "object",
              properties: {
                query_expanded_to: { type: "string", nullable: true },
                sort: { type: "string" },
                filters: { type: "object" },
              },
            },
          },
        },
        JobDetailResponse: {
          type: "object",
          properties: {
            job: { $ref: "#/components/schemas/Job" },
          },
        },
        Industry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            display_order: { type: "integer" },
            job_count: { type: "integer" },
          },
        },
        IndustriesResponse: {
          type: "object",
          properties: {
            industries: {
              type: "array",
              items: { $ref: "#/components/schemas/Industry" },
            },
          },
        },
        RoleSuggestion: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            canonical_title: { type: "string" },
            related_titles: { type: "array", items: { type: "string" } },
            industry: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                slug: { type: "string" },
                name: { type: "string" },
              },
            },
            score: { type: "number" },
          },
        },
        RoleSuggestResponse: {
          type: "object",
          properties: {
            query: { type: "string" },
            suggestions: {
              type: "array",
              items: { $ref: "#/components/schemas/RoleSuggestion" },
            },
          },
        },
        Taxonomy: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            canonical_title: { type: "string" },
            related_titles: { type: "array", items: { type: "string" } },
            title_patterns: { type: "array", items: { type: "string" } },
            industry: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                slug: { type: "string" },
                name: { type: "string" },
              },
            },
            job_count: { type: "integer" },
          },
        },
        TaxonomyResponse: {
          type: "object",
          description:
            "Returns either { taxonomy: Taxonomy } for single lookup or { taxonomies: Taxonomy[] } for list",
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: {},
          },
          required: ["error"],
        },
      },
    },
  };

  return jsonOk(spec);
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
