import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.JOBBOARD_API_URL || "https://jobboard-ai-rllv.vercel.app";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
async function api(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const init: RequestInit = {
    method: options?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Tool definitions (same names/descriptions as the DB-backed server)
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: "search_jobs",
    description:
      "Search the JobBoard AI database for job listings. Supports free-text search across titles, companies, and descriptions. Filter by industry, market/region, remote status, and role type. Results are sorted by featured status then posting date. Use this tool when a user is looking for jobs, exploring opportunities, or wants to see what's available.",
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
          description:
            "The UUID of the job to retrieve (from search_jobs results)",
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
      "Get statistics about the job market on JobBoard AI. Shows total jobs, breakdowns by industry and market/region, trending roles, and salary ranges. Useful for understanding the landscape before searching, or for market research. Can be filtered to a specific industry or market.",
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
// Tool handlers — all go through the REST API
// ---------------------------------------------------------------------------

async function handleSearchJobs(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const params = new URLSearchParams();

  if (args.query) params.set("q", String(args.query));
  if (args.remote === true) params.set("remote", "true");
  if (args.role_type) params.set("role_type", String(args.role_type));
  if (args.limit) params.set("limit", String(args.limit));
  if (args.page) params.set("page", String(args.page));

  const industryArr = args.industry as string[] | undefined;
  if (industryArr?.length) {
    for (const ind of industryArr) params.append("industry", ind);
  }

  const marketArr = args.market as string[] | undefined;
  if (marketArr?.length) {
    for (const m of marketArr) params.append("market", m);
  }

  const qs = params.toString();
  const data = (await api(`/api/v1/jobs${qs ? `?${qs}` : ""}`)) as Record<
    string,
    unknown
  >;

  // Rewrite apply_url to use the redirect endpoint
  const jobs = (data.jobs as Array<Record<string, unknown>>) ?? [];
  for (const job of jobs) {
    if (job.id) {
      job.apply_url = `${BASE_URL}/go/${job.id}`;
    }
  }

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleGetJobDetails(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const jobId = args.job_id as string;
  if (!jobId) {
    return {
      content: [{ type: "text", text: "Error: job_id is required." }],
      isError: true,
    };
  }

  const data = (await api(`/api/v1/jobs/${jobId}`)) as Record<
    string,
    unknown
  >;

  // Ensure apply_url uses the redirect endpoint
  if (data.id) {
    data.apply_url = `${BASE_URL}/go/${data.id}`;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleSuggestRoles(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const description = args.description as string;
  if (!description) {
    return {
      content: [{ type: "text", text: "Error: description is required." }],
      isError: true,
    };
  }

  const data = await api(
    `/api/v1/roles/suggest?q=${encodeURIComponent(description)}`
  );

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleGetMarketStats(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  // Fetch industries list and construct stats from the response
  const params = new URLSearchParams();
  if (args.industry) params.set("industry", String(args.industry));
  if (args.market) params.set("market", String(args.market));

  const qs = params.toString();
  const data = await api(`/api/v1/industries${qs ? `?${qs}` : ""}`);

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleSubscribeAlerts(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const email = args.email as string;
  if (!email) {
    return {
      content: [{ type: "text", text: "Error: email is required." }],
      isError: true,
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      content: [{ type: "text", text: "Error: invalid email format." }],
      isError: true,
    };
  }

  const body: Record<string, unknown> = { email };
  if (args.roles) body.roles = args.roles;
  if (args.industries) body.industries = args.industries;
  if (args.markets) body.markets = args.markets;
  if (args.remote_only !== undefined) body.remote_only = args.remote_only;

  const data = await api("/api/alerts", { method: "POST", body });

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

// ---------------------------------------------------------------------------
// createMcpServer — factory
// ---------------------------------------------------------------------------
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "jobboard-ai",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case "search_jobs":
          return await handleSearchJobs(toolArgs);
        case "get_job_details":
          return await handleGetJobDetails(toolArgs);
        case "suggest_roles":
          return await handleSuggestRoles(toolArgs);
        case "get_market_stats":
          return await handleGetMarketStats(toolArgs);
        case "subscribe_alerts":
          return await handleSubscribeAlerts(toolArgs);
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
      console.error(`[jobboard-ai-mcp] Error in ${name}:`, error);
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
