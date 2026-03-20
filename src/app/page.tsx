import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

// ---------------------------------------------------------------------------
// Terminal Demo (client component for typing animation)
// ---------------------------------------------------------------------------
function TerminalDemo() {
  return (
    <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-xl border border-border bg-surface">
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
            https://jobboard-ai.com/api/v1/jobs \
          </span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-H </span>
          <span className="text-yellow">
            &quot;X-API-Key: jbai_your_key&quot;
          </span>{" "}
          <span className="text-text-secondary">\</span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-G -d </span>
          <span className="text-yellow">
            &quot;role=creative-director&quot;
          </span>{" "}
          <span className="text-text-secondary">\</span>
          {"\n"}
          <span className="text-text-secondary">{"  "}-d </span>
          <span className="text-yellow">&quot;industry=crypto&quot;</span>
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
            &quot;Senior Creative Director&quot;
          </span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;company&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">&quot;Acme Protocol&quot;</span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;salary&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-green">&quot;$180k-$220k&quot;</span>
          <span className="text-text-tertiary">,</span>
          {"\n"}
          <span className="text-text-tertiary">{"      "}</span>
          <span className="text-accent">&quot;isRemote&quot;</span>
          <span className="text-text-tertiary">: </span>
          <span className="text-yellow">true</span>
          {"\n"}
          <span className="text-text-tertiary">{"    }"}</span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}],</span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}</span>
          <span className="text-accent">&quot;pagination&quot;</span>
          <span className="text-text-tertiary">
            : {"{"} &quot;total&quot;: 23 {"}"}
          </span>
          {"\n"}
          <span className="text-text-tertiary">{"  "}// Expanded to 15 related role titles</span>
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
          Scanning 400+ career pages every 6 hours
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
          The Job Board for{" "}
          <span className="bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">
            AI Agents
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Your AI assistant&apos;s favorite place to find jobs. Structured,
          real-time job data for Claude, ChatGPT, and every AI agent &mdash;
          accessible via REST API, MCP, or ChatGPT Actions.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/docs#authentication"
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

        <TerminalDemo />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// For Job Seekers / Employers / Developers
// ---------------------------------------------------------------------------
function ValueProps() {
  const cards = [
    {
      tag: "For Job Seekers",
      title: "Your AI finds jobs for you",
      description:
        "Connect your favorite AI assistant to JobBoard AI. Describe what you're looking for in natural language and get matched to fresh, relevant opportunities across 400+ companies.",
      features: [
        "Natural language job search",
        "15+ related titles per query",
        "Real-time freshness scoring",
        "Remote and location filtering",
      ],
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
      cta: { label: "Try Role Explorer", href: "/roles" },
    },
    {
      tag: "For Employers",
      title: "Reach candidates through every AI",
      description:
        "When an AI agent searches for matching roles, your featured listing appears first. Get discovered across Claude, ChatGPT, and 50+ agent platforms with a single listing.",
      features: [
        "Priority AI search placement",
        "Cross-platform distribution",
        "Real-time impression analytics",
        "Schema.org structured data",
      ],
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
          />
        </svg>
      ),
      cta: { label: "Feature a Listing", href: "/pricing#employers" },
    },
    {
      tag: "For Developers",
      title: "API + MCP integration in minutes",
      description:
        "REST API with structured JSON responses. Native MCP server for Claude. OpenAPI spec for ChatGPT Actions. Build job search into any AI agent or application.",
      features: [
        "REST API with full documentation",
        "MCP server (npx install)",
        "ChatGPT Actions via OpenAPI",
        "Embeddable job widget",
      ],
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
          />
        </svg>
      ),
      cta: { label: "Read the Docs", href: "/docs" },
    },
  ];

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">Built for everyone</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            One platform, three audiences
          </h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.tag}
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-hover"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {card.icon}
              </div>
              <p className="text-xs font-medium text-accent">{card.tag}</p>
              <h3 className="mt-1 text-lg font-semibold text-text-primary">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                {card.description}
              </p>
              <ul className="mt-4 space-y-2">
                {card.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-green"
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
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={card.cta.href}
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                {card.cta.label}
                <svg
                  className="h-3.5 w-3.5"
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
      title: "AI searches our API",
      description:
        "Your AI agent sends a natural language query or structured request to our REST API, MCP server, or ChatGPT Action.",
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
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      ),
    },
    {
      step: "02",
      title: "We expand to 15+ related titles",
      description:
        'A search for "Creative Director" automatically includes Brand Director, Head of Design, Design Lead, and 12 more related roles.',
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
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      step: "03",
      title: "Fresh results from 400+ companies",
      description:
        "We scan company career pages directly every 6 hours. No stale aggregator data. Real jobs, real freshness scores.",
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
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
            Three steps to better job data
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
// Platforms
// ---------------------------------------------------------------------------
function ForAIPlatforms() {
  const platforms = [
    {
      name: "Claude (MCP)",
      description:
        "Install our Model Context Protocol server. Claude gets native access to job search.",
      code: "npx jobboard-ai-mcp",
      badge: "MCP",
      badgeColor: "bg-purple/10 text-purple",
    },
    {
      name: "ChatGPT (Actions)",
      description:
        "Import our OpenAPI spec as a ChatGPT Action. Works with GPT-4 and custom GPTs.",
      code: "https://jobboard-ai.com/api/openapi.json",
      badge: "Actions",
      badgeColor: "bg-green/10 text-green",
    },
    {
      name: "Any AI Agent (REST)",
      description:
        "Standard REST API with JSON responses. Works with any LLM, agent framework, or tool.",
      code: "GET /api/v1/jobs?role=engineer",
      badge: "REST",
      badgeColor: "bg-accent/10 text-accent",
    },
  ];

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">For AI platforms</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Works with every AI platform
          </h2>
          <p className="mt-4 text-text-secondary">
            Native integrations for the platforms your users already use.
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
// Stats Bar
// ---------------------------------------------------------------------------
function Stats() {
  const stats = [
    { value: "10,000+", label: "Active jobs" },
    { value: "400+", label: "Companies scanned" },
    { value: "6", label: "Markets covered" },
    { value: "16", label: "Industry verticals" },
    { value: "6h", label: "Refresh cycle" },
  ];

  return (
    <section className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
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
          with full access to role intelligence and freshness scoring.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/docs#authentication"
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
        <HowItWorks />
        <ValueProps />
        <ForAIPlatforms />
        <Stats />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
