import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "API Documentation — AgentJobs",
  description:
    "Complete API documentation for AgentJobs. REST endpoints, MCP server, ChatGPT Actions, and embeddable widget.",
};

// ---------------------------------------------------------------------------
// Code Block with language tabs
// ---------------------------------------------------------------------------
function CodeBlock({
  title,
  lang,
  children,
}: {
  title?: string;
  lang?: string;
  children: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs text-text-tertiary">{title}</span>
          {lang && (
            <span className="text-[10px] text-text-tertiary uppercase">
              {lang}
            </span>
          )}
        </div>
      )}
      <pre className="overflow-x-auto border-none p-4 text-sm leading-relaxed">
        <code className="text-text-secondary">{children}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-language code examples
// ---------------------------------------------------------------------------
function MultiLangExample({
  examples,
}: {
  examples: { lang: string; label: string; code: string }[];
}) {
  return (
    <div className="space-y-3">
      {examples.map((ex) => (
        <CodeBlock key={ex.lang} title={ex.label} lang={ex.lang}>
          {ex.code}
        </CodeBlock>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold tracking-tight text-text-primary border-b border-border pb-3 mb-6">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------
function Endpoint({
  method,
  path,
  description,
  params,
  examples,
  response,
}: {
  method: string;
  path: string;
  description: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  examples?: { lang: string; label: string; code: string }[];
  response?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="rounded bg-green/10 px-2 py-0.5 text-xs font-semibold text-green">
          {method}
        </span>
        <code className="text-sm font-medium text-text-primary">{path}</code>
      </div>
      <p className="mt-3 text-sm text-text-secondary">{description}</p>

      {params && params.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Parameters
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-[#0a0a0a]">
                  <th className="px-3 py-2 font-medium text-text-tertiary">
                    Name
                  </th>
                  <th className="px-3 py-2 font-medium text-text-tertiary">
                    Type
                  </th>
                  <th className="px-3 py-2 font-medium text-text-tertiary">
                    Required
                  </th>
                  <th className="px-3 py-2 font-medium text-text-tertiary">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {params.map((p) => (
                  <tr key={p.name}>
                    <td className="px-3 py-2 font-mono text-accent">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-text-tertiary">{p.type}</td>
                    <td className="px-3 py-2">
                      {p.required ? (
                        <span className="text-yellow">Yes</span>
                      ) : (
                        <span className="text-text-tertiary">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {p.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {examples && examples.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Examples
          </p>
          <MultiLangExample examples={examples} />
        </div>
      )}

      {response && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Response
          </p>
          <CodeBlock lang="json">{response}</CodeBlock>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Nav
// ---------------------------------------------------------------------------
function SideNav() {
  const sections = [
    { id: "authentication", label: "Authentication" },
    { id: "endpoints", label: "Endpoints" },
    { id: "search-jobs", label: "Search Jobs" },
    { id: "get-job", label: "Get Job by ID" },
    { id: "list-industries", label: "List Industries" },
    { id: "suggest-roles", label: "Suggest Roles" },
    { id: "taxonomy", label: "Taxonomy" },
    { id: "rate-limits", label: "Rate Limits & Pricing" },
    { id: "response-schema", label: "Response Schema" },
    { id: "mcp", label: "MCP Server" },
    { id: "chatgpt", label: "ChatGPT Actions" },
    { id: "openai-plugin", label: "OpenAI Plugin" },
    { id: "widget", label: "Embeddable Widget" },
    { id: "employers", label: "For Employers" },
  ];

  return (
    <nav className="hidden lg:block sticky top-20 h-fit w-48 shrink-0">
      <p className="mb-3 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
        On this page
      </p>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block rounded-md px-2.5 py-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary hover:bg-surface-hover"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DocsPage() {
  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-6xl gap-10 px-6 pt-24 pb-20">
        <SideNav />

        <main className="min-w-0 flex-1 space-y-16">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              API Documentation
            </h1>
            <p className="mt-2 text-text-secondary">
              Everything you need to integrate AgentJobs into your AI agent,
              app, or platform.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" />
              Base URL:{" "}
              <code className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-text-secondary">
                https://agentjobs.com
              </code>
            </div>
          </div>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p className="text-sm text-text-secondary leading-relaxed">
              All API requests require an API key passed via the{" "}
              <code className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-xs text-accent">
                X-API-Key
              </code>{" "}
              header.
            </p>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                API Key Tiers
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-[#0a0a0a]">
                      <th className="px-3 py-2 font-medium text-text-tertiary">
                        Tier
                      </th>
                      <th className="px-3 py-2 font-medium text-text-tertiary">
                        Rate Limit
                      </th>
                      <th className="px-3 py-2 font-medium text-text-tertiary">
                        Results / Query
                      </th>
                      <th className="px-3 py-2 font-medium text-text-tertiary">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-2 font-medium text-text-primary">
                        Free
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        100 req/day
                      </td>
                      <td className="px-3 py-2 text-text-secondary">20</td>
                      <td className="px-3 py-2 text-green">$0</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-text-primary">
                        Pro
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        10,000 req/day
                      </td>
                      <td className="px-3 py-2 text-text-secondary">100</td>
                      <td className="px-3 py-2 text-text-secondary">
                        $49/mo
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-text-primary">
                        Enterprise
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        Unlimited
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        Unlimited
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        $499/mo
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <MultiLangExample
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_api_key_here" \\
  https://agentjobs.com/api/v1/jobs?role=engineer`,
                },
                {
                  lang: "python",
                  label: "Python",
                  code: `import requests

response = requests.get(
    "https://agentjobs.com/api/v1/jobs",
    headers={"X-API-Key": "aj_your_api_key_here"},
    params={"role": "engineer"}
)
jobs = response.json()["jobs"]`,
                },
                {
                  lang: "javascript",
                  label: "JavaScript",
                  code: `const response = await fetch(
  "https://agentjobs.com/api/v1/jobs?role=engineer",
  { headers: { "X-API-Key": "aj_your_api_key_here" } }
);
const { jobs } = await response.json();`,
                },
              ]}
            />
          </Section>

          {/* Endpoints overview */}
          <Section id="endpoints" title="Endpoints">
            <p className="text-sm text-text-secondary leading-relaxed">
              The API provides five core endpoints. All return JSON with
              consistent response envelopes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  method: "GET",
                  path: "/api/v1/jobs",
                  desc: "Search and filter jobs",
                },
                {
                  method: "GET",
                  path: "/api/v1/jobs/:id",
                  desc: "Get a single job by ID",
                },
                {
                  method: "GET",
                  path: "/api/v1/industries",
                  desc: "List all industries",
                },
                {
                  method: "GET",
                  path: "/api/v1/roles/suggest",
                  desc: "Expand a role to related titles",
                },
                {
                  method: "GET",
                  path: "/api/v1/taxonomy",
                  desc: "Full taxonomy tree",
                },
              ].map((e) => (
                <div
                  key={e.path}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <span className="shrink-0 rounded bg-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-green">
                    {e.method}
                  </span>
                  <div>
                    <code className="text-xs text-text-primary">{e.path}</code>
                    <p className="mt-0.5 text-[11px] text-text-tertiary">
                      {e.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Search Jobs */}
          <Section id="search-jobs" title="Search Jobs">
            <Endpoint
              method="GET"
              path="/api/v1/jobs"
              description="Search for jobs with full-text search, industry/role filters, remote filtering, and pagination. Featured listings appear first."
              params={[
                {
                  name: "q",
                  type: "string",
                  required: false,
                  description:
                    "Free-text search across title, company, description",
                },
                {
                  name: "role",
                  type: "string",
                  required: false,
                  description: "Role taxonomy slug (e.g. creative-director)",
                },
                {
                  name: "industry",
                  type: "string",
                  required: false,
                  description: "Industry slug (e.g. crypto, ai-ml)",
                },
                {
                  name: "remote",
                  type: "boolean",
                  required: false,
                  description: "Filter to remote-only jobs",
                },
                {
                  name: "region",
                  type: "string",
                  required: false,
                  description: "Region filter (e.g. US, EU, APAC)",
                },
                {
                  name: "posted_after",
                  type: "ISO date",
                  required: false,
                  description: "Only jobs posted after this date",
                },
                {
                  name: "page",
                  type: "integer",
                  required: false,
                  description: "Page number (default: 1)",
                },
                {
                  name: "per_page",
                  type: "integer",
                  required: false,
                  description: "Results per page (default: 20, max: 100)",
                },
                {
                  name: "sort",
                  type: "string",
                  required: false,
                  description: "Sort by: posted, freshness, or relevance",
                },
              ]}
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_key" \\
  "https://agentjobs.com/api/v1/jobs?q=creative+director&industry=crypto&remote=true"`,
                },
                {
                  lang: "python",
                  label: "Python",
                  code: `response = requests.get(
    "https://agentjobs.com/api/v1/jobs",
    headers={"X-API-Key": "aj_your_key"},
    params={"q": "creative director", "industry": "crypto", "remote": True}
)`,
                },
                {
                  lang: "javascript",
                  label: "JavaScript",
                  code: `const params = new URLSearchParams({
  q: "creative director",
  industry: "crypto",
  remote: "true"
});

const res = await fetch(\`https://agentjobs.com/api/v1/jobs?\${params}\`, {
  headers: { "X-API-Key": "aj_your_key" }
});`,
                },
              ]}
              response={`{
  "jobs": [
    {
      "id": "a1b2c3d4-...",
      "title": "Senior Creative Director",
      "company": "Acme Protocol",
      "location": "Remote",
      "salary": "$180k-$220k",
      "isRemote": true,
      "isFeatured": true,
      "freshness": { "score": 0.92, "label": "verified 2h ago", "tier": "fresh" },
      "industry": { "name": "Crypto", "slug": "crypto" },
      "taxonomy": { "canonicalTitle": "Creative Director", "slug": "creative-director" }
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 23, "total_pages": 2, "has_next": true, "has_prev": false },
  "meta": { "query_expanded_to": "creative director", "sort": "posted", "filters": {} }
}`}
            />
          </Section>

          {/* Get Job */}
          <Section id="get-job" title="Get Job by ID">
            <Endpoint
              method="GET"
              path="/api/v1/jobs/:id"
              description="Retrieve a single job by its UUID. Returns full details including description and freshness score."
              params={[
                {
                  name: "id",
                  type: "UUID",
                  required: true,
                  description: "The job's unique identifier",
                },
              ]}
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_key" \\
  https://agentjobs.com/api/v1/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890`,
                },
              ]}
              response={`{
  "job": {
    "id": "a1b2c3d4-...",
    "title": "Senior Creative Director",
    "company": "Acme Protocol",
    "description": "We are looking for a Senior Creative Director to lead...",
    "salary": "$180k-$220k",
    "link": "https://acme.com/careers/creative-director",
    "freshness": { "score": 0.95, "label": "Fresh", "tier": "fresh" }
  }
}`}
            />
          </Section>

          {/* List Industries */}
          <Section id="list-industries" title="List Industries">
            <Endpoint
              method="GET"
              path="/api/v1/industries"
              description="List all available industries. Use industry slugs to filter job searches."
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_key" \\
  https://agentjobs.com/api/v1/industries`,
                },
              ]}
              response={`{
  "industries": [
    { "slug": "crypto", "name": "Crypto", "description": "Blockchain, DeFi, and Web3" },
    { "slug": "ai-ml", "name": "AI / ML", "description": "Artificial Intelligence and ML" },
    { "slug": "fintech", "name": "Fintech", "description": "Financial Technology" }
  ]
}`}
            />
          </Section>

          {/* Suggest Roles */}
          <Section id="suggest-roles" title="Suggest Roles">
            <Endpoint
              method="GET"
              path="/api/v1/roles/suggest"
              description="Given a role query, returns the matching taxonomy entry with all related titles. Powers the Role Explorer page."
              params={[
                {
                  name: "q",
                  type: "string",
                  required: true,
                  description: "Role name to look up",
                },
              ]}
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_key" \\
  "https://agentjobs.com/api/v1/roles/suggest?q=creative+director"`,
                },
              ]}
              response={`{
  "taxonomy": {
    "slug": "creative-director",
    "canonicalTitle": "Creative Director",
    "relatedTitles": [
      "Brand Director", "Head of Design", "Design Director",
      "VP of Creative", "Chief Creative Officer", "Associate Creative Director",
      "Group Creative Director", "Executive Creative Director", "Creative Lead",
      "Brand Creative Director", "Sr. Creative Director", "Digital Creative Director",
      "Art Director", "Design Lead"
    ]
  }
}`}
            />
          </Section>

          {/* Taxonomy */}
          <Section id="taxonomy" title="Taxonomy">
            <Endpoint
              method="GET"
              path="/api/v1/taxonomy"
              description="Returns the full role taxonomy tree grouped by industry. Useful for building search UIs."
              examples={[
                {
                  lang: "bash",
                  label: "cURL",
                  code: `curl -H "X-API-Key: aj_your_key" \\
  https://agentjobs.com/api/v1/taxonomy`,
                },
              ]}
            />
          </Section>

          {/* Rate Limits */}
          <Section id="rate-limits" title="Rate Limits & Pricing">
            <p className="text-sm text-text-secondary leading-relaxed">
              Rate limits are enforced per API key on a daily basis. When you
              exceed your limit, the API returns{" "}
              <code className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-xs text-red">
                429 Too Many Requests
              </code>
              .
            </p>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Rate Limit Headers
              </p>
              <CodeBlock lang="http">{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1711036800`}</CodeBlock>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              See the{" "}
              <Link href="/pricing" className="text-accent hover:underline">
                Pricing page
              </Link>{" "}
              for full tier comparison. Rate limits reset daily at midnight UTC.
            </p>
          </Section>

          {/* Response Schema */}
          <Section id="response-schema" title="Response Schema">
            <p className="text-sm text-text-secondary leading-relaxed">
              All API responses follow a consistent envelope. Successful
              responses return the data directly. Errors return a standard error
              object.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Success (200)
                </p>
                <CodeBlock lang="json">{`{
  "jobs": [...],
  "pagination": {...},
  "meta": {...}
}`}</CodeBlock>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Error (4xx)
                </p>
                <CodeBlock lang="json">{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameter",
    "details": [...]
  }
}`}</CodeBlock>
              </div>
            </div>
          </Section>

          {/* MCP Server */}
          <Section id="mcp" title="MCP Server (Claude)">
            <p className="text-sm text-text-secondary leading-relaxed">
              Install the AgentJobs MCP server to give Claude native access to
              job search. Claude can then search for jobs, filter by industry,
              and return structured results directly in conversation.
            </p>

            <div>
              <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Installation
              </p>
              <CodeBlock title="Terminal" lang="bash">
                {`npx agentjobs-mcp`}
              </CodeBlock>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Claude Desktop Config
              </p>
              <CodeBlock title="claude_desktop_config.json" lang="json">{`{
  "mcpServers": {
    "agentjobs": {
      "command": "npx",
      "args": ["agentjobs-mcp"],
      "env": {
        "AGENTJOBS_API_KEY": "aj_your_key_here"
      }
    }
  }
}`}</CodeBlock>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Available MCP Tools
              </h4>
              <div className="space-y-3">
                {[
                  {
                    name: "search_jobs",
                    desc: "Search for jobs with natural language queries and filters",
                  },
                  {
                    name: "get_job",
                    desc: "Get full details for a specific job by ID",
                  },
                  {
                    name: "list_industries",
                    desc: "List all available industries",
                  },
                  {
                    name: "suggest_roles",
                    desc: "Expand a role into related titles",
                  },
                ].map((tool) => (
                  <div key={tool.name} className="flex items-start gap-3">
                    <code className="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      {tool.name}
                    </code>
                    <span className="text-xs text-text-secondary">
                      {tool.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ChatGPT Actions */}
          <Section id="chatgpt" title="ChatGPT Actions">
            <p className="text-sm text-text-secondary leading-relaxed">
              Import our OpenAPI specification as a ChatGPT Action to enable job
              search in custom GPTs and ChatGPT conversations.
            </p>

            <div>
              <p className="mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Setup Steps
              </p>
              <ol className="space-y-3">
                {[
                  'Go to ChatGPT > Explore GPTs > Create a GPT',
                  'Under "Actions", click "Import from URL"',
                  "Paste the OpenAPI spec URL below",
                  'Set Authentication to "API Key" with header "X-API-Key"',
                  "Save and test with a job search query",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-text-secondary"
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <CodeBlock title="OpenAPI Spec URL" lang="text">
              {`https://agentjobs.com/api/openapi.json`}
            </CodeBlock>
          </Section>

          {/* OpenAI Plugin Guide */}
          <Section id="openai-plugin" title="OpenAI / ChatGPT Plugin Guide">
            <p className="text-sm text-text-secondary leading-relaxed">
              For custom GPT builders, our OpenAPI spec can be imported directly.
              This enables any custom GPT to search for jobs using natural
              language.
            </p>

            <CodeBlock title="Plugin manifest" lang="json">{`{
  "schema_version": "v1",
  "name_for_human": "AgentJobs",
  "name_for_model": "agentjobs",
  "description_for_human": "Search for AI-curated job listings across 400+ companies.",
  "description_for_model": "Search for job listings. Supports filtering by role, industry, region, and remote status.",
  "auth": {
    "type": "service_http",
    "authorization_type": "bearer",
    "verification_tokens": {}
  },
  "api": {
    "type": "openapi",
    "url": "https://agentjobs.com/api/openapi.json"
  }
}`}</CodeBlock>
          </Section>

          {/* Embeddable Widget */}
          <Section id="widget" title="Embeddable Widget">
            <p className="text-sm text-text-secondary leading-relaxed">
              Embed a live job feed on your website with a single script tag.
              See the{" "}
              <Link href="/widget" className="text-accent hover:underline">
                Widget page
              </Link>{" "}
              for a live preview and configuration tool.
            </p>

            <CodeBlock title="HTML" lang="html">{`<script
  src="https://agentjobs.com/api/widget?industry=crypto&role=creative-director&max=5&theme=dark"
  async>
</script>`}</CodeBlock>
          </Section>

          {/* For Employers */}
          <Section id="employers" title="For Employers">
            <p className="text-sm text-text-secondary leading-relaxed">
              Featured listings get priority placement when AI agents search for
              matching roles. Your job appears first across Claude, ChatGPT, and
              every platform using our API.
            </p>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
              <h4 className="text-base font-semibold text-text-primary">
                Featured Listing Benefits
              </h4>
              <ul className="mt-4 space-y-2">
                {[
                  "Priority placement in all API search results",
                  "Featured badge shown across all platforms and widgets",
                  "Real-time analytics dashboard with AI impression tracking",
                  "Schema.org structured data for maximum AI discoverability",
                  "Direct apply link served to candidates via AI",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-text-secondary"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              See{" "}
              <Link href="/pricing" className="text-accent hover:underline">
                Pricing
              </Link>{" "}
              for featured listing rates, or visit the{" "}
              <Link href="/dashboard" className="text-accent hover:underline">
                Employer Dashboard
              </Link>{" "}
              to manage your listings.
            </p>
          </Section>
        </main>
      </div>
      <Footer />
    </>
  );
}
