import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Terminal Demo (API Preview)
// ---------------------------------------------------------------------------
function TerminalDemo() {
  return (
    <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red/60" />
        <div className="h-3 w-3 rounded-full bg-yellow/60" />
        <div className="h-3 w-3 rounded-full bg-green/60" />
        <span className="ml-2 text-xs text-text-tertiary font-mono">
          terminal
        </span>
      </div>
      <pre className="overflow-x-auto border-none p-5 text-left text-sm leading-relaxed">
        <code>
          <span className="text-text-tertiary">$</span>{" "}
          <span className="text-green">curl</span>{" "}
          <span className="text-text-secondary">
            https://agentjobs.dev/api/v1/jobs \
          </span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-H </span>
          <span className="text-yellow">
            &quot;X-API-Key: aj_live_your_key&quot;
          </span>{" "}
          <span className="text-text-secondary">\</span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-G -d </span>
          <span className="text-yellow">
            &quot;role=python-developer&quot;
          </span>{" "}
          <span className="text-text-secondary">\</span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-d </span>
          <span className="text-yellow">&quot;remote=true&quot;</span>
          <span className="text-text-secondary"> \</span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-d </span>
          <span className="text-yellow">&quot;min_salary=120000&quot;</span>
          {"\n\n"}
          <span className="text-text-tertiary">{"{"}</span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}</span>
          <span className="text-accent">&quot;jobs&quot;</span>
          <span className="text-text-tertiary">: [</span>
          {"\n"}
          <span className="text-text-tertiary">{"    {"}</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;title&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">
            &quot;Senior Python Engineer&quot;
          </span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;company&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">&quot;Acme AI Labs&quot;</span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;salary&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">&quot;$145k-$185k&quot;</span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;remote&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-yellow">true</span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;apply_url&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">&quot;https://acme.ai/careers/senior-python&quot;</span>
          {"\n"}
          <span className="text-text-tertiary">{"    }"}</span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}],</span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}</span>
          <span className="text-accent">&quot;pagination&quot;</span>
          <span className="text-text-tertiary">
            : {"{"} &quot;total&quot;: 47 {"}"}
          </span>
          {"\n"}
          <span className="text-text-tertiary">{"}"}</span>
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-32 pb-20 text-center">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/5 blur-3xl" />

      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
          14,000+ jobs indexed from 58 sources
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">
            AgentJobs
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-xl font-medium text-text-primary">
          The job search tool for AI agents
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Search 14,000+ jobs across every industry. Works with Claude,
          ChatGPT, and any AI assistant.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/api/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Get API Key
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-surface-hover"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------
function Stats() {
  const stats = [
    { value: "14,000+", label: "Jobs" },
    { value: "25+", label: "Industries" },
    { value: "100+", label: "Role Types" },
    { value: "58", label: "Sources" },
  ];

  return (
    <section className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Install",
      description:
        "Add AgentJobs to Claude Desktop or ChatGPT. One command or a single config change.",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      ),
    },
    {
      step: "02",
      title: "Ask",
      description:
        '"Find me remote Python jobs paying over $120k" \u2014 search in natural language, get structured results.',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Apply",
      description:
        "Get structured results with salary data, company info, and direct apply links. No middleman.",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Three steps to your next role
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="group relative rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-hover hover:bg-surface-hover"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {s.icon}
              </div>
              <div className="mb-1 text-xs font-mono text-text-tertiary">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Integration Section
// ---------------------------------------------------------------------------
function Integrations() {
  const platforms = [
    {
      name: "Works with Claude",
      description:
        "Native MCP server integration. Add AgentJobs to Claude Desktop with a single command.",
      code: "npx agentjobs-mcp",
      badge: "MCP",
      badgeColor: "bg-purple/10 text-purple",
    },
    {
      name: "Works with ChatGPT",
      description:
        "Available in the GPT Store as a Custom GPT with Actions. Import the OpenAPI spec into any custom GPT.",
      code: "GPT Store / Custom GPT Actions",
      badge: "GPT",
      badgeColor: "bg-green/10 text-green",
    },
    {
      name: "Works with any AI",
      description:
        "Standard REST API with full OpenAPI spec. Connect any LLM, agent framework, or automation tool.",
      code: "GET /api/v1/jobs + OpenAPI spec",
      badge: "REST",
      badgeColor: "bg-accent/10 text-accent",
    },
  ];

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">Integrations</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Works with every AI platform
          </h2>
          <p className="mt-4 text-text-secondary">
            Native integrations for the tools you already use.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-hover"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${p.badgeColor}`}
                >
                  {p.badge}
                </span>
                <h3 className="text-base font-semibold text-text-primary">
                  {p.name}
                </h3>
              </div>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-text-secondary">
                {p.description}
              </p>
              <div className="rounded-lg bg-[#0a0a0a] border border-border px-3 py-2">
                <code className="text-xs text-text-secondary">{p.code}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// API Preview
// ---------------------------------------------------------------------------
function APIPreview() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">API Preview</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Clean JSON. Zero boilerplate.
          </h2>
          <p className="mt-4 text-text-secondary">
            One request. Structured results with salary, location, and direct
            apply links.
          </p>
        </div>

        <TerminalDemo />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
function FinalCTA() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Get your API key in seconds. Free tier includes 100 queries per day
          with full access to job search, filtering, and direct apply links.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/api/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Get API Key &mdash; Free
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:border-border-hover hover:bg-surface-hover"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Integrations />
        <APIPreview />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
