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
  process.env.AGENTJOBS_API_URL || "https://agentjobs.vercel.app";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
async function api(path: string): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: "search_jobs",
    description:
      "Search the AgentJobs database for job listings. Supports free-text search across titles, companies, and descriptions. Filter by industry, role type, region, remote status, and salary range. Results are sorted by featured status then posting date.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search query to match against job titles, companies, and descriptions (e.g. 'machine learning engineer', 'product manager crypto')",
        },
        industry: {
          type: "string",
          description:
            "Filter by industry slug (e.g. 'tech', 'finance'). Use list_industries to see available options.",
        },
        role: {
          type: "string",
          description:
            "Filter by role taxonomy slug (e.g. 'software-engineer', 'product-manager'). Use list_roles to discover role types.",
        },
        region: {
          type: "string",
          description:
            "Filter by geographic region (e.g. 'US', 'EU', 'APAC', 'LATAM', 'Global').",
        },
        remote: {
          type: "boolean",
          description: "When true, only return remote-friendly positions.",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1).",
        },
        per_page: {
          type: "number",
          description:
            "Results per page (default: 10, max: 25).",
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
            "The UUID of the job to retrieve (from search_jobs results).",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "list_industries",
    description:
      "List all available industries with their slugs, names, and job counts. Use this to discover valid industry filter values for search_jobs.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_roles",
    description:
      "List all role taxonomies (canonical role titles) with their slugs, related titles, and job counts. Use this to discover valid role filter values for search_jobs, or to explore what kinds of roles exist.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_market_overview",
    description:
      "Get a summary overview of the job market: total jobs, breakdowns by industry, region, and source. Useful for understanding the landscape before searching.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
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
  if (args.industry) params.set("industry", String(args.industry));
  if (args.role) params.set("role", String(args.role));
  if (args.region) params.set("region", String(args.region));
  if (args.remote === true) params.set("remote", "true");
  if (args.page) params.set("page", String(args.page));
  if (args.per_page) params.set("per_page", String(args.per_page));

  const qs = params.toString();
  const data = (await api(`/api/v1/jobs${qs ? `?${qs}` : ""}`)) as Record<
    string,
    unknown
  >;

  // Ensure apply_url uses the redirect endpoint
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
  const job = data.job as Record<string, unknown> | undefined;
  if (job?.id) {
    job.apply_url = `${BASE_URL}/go/${job.id}`;
  }

  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleListIndustries(): Promise<CallToolResult> {
  const data = await api("/api/v1/industries");
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleListRoles(): Promise<CallToolResult> {
  const data = await api("/api/v1/taxonomy");
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

async function handleGetMarketOverview(): Promise<CallToolResult> {
  const data = await api("/api/stats");
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
      name: "agentjobs",
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
        case "list_industries":
          return await handleListIndustries();
        case "list_roles":
          return await handleListRoles();
        case "get_market_overview":
          return await handleGetMarketOverview();
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
