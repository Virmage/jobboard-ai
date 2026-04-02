import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const GPT_URL = "https://chatgpt.com/g/g-69c0a8b41d008191a6ad244646f7619e-agentjobs";

export const metadata: Metadata = {
  title: "AgentJobs — Search Jobs at OpenAI, Anthropic, Stripe & 100+ Top Companies",
  description:
    "14,000+ jobs at the world's best tech, AI, and crypto companies. Search by asking ChatGPT or browse directly. Updated every 6 hours.",
  openGraph: {
    title: "AgentJobs — Search Jobs at OpenAI, Anthropic, Stripe & 100+ Top Companies",
    description:
      "14,000+ jobs at the world's best tech, AI, and crypto companies. Search by asking ChatGPT or browse directly.",
    type: "website",
  },
};

// ---------------------------------------------------------------------------
// OpenAI Logo SVG
// ---------------------------------------------------------------------------
function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative px-6 pt-28 pb-20">
      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#10a37f]/6 blur-[120px]" />
        <div className="absolute top-40 right-1/4 h-[300px] w-[400px] rounded-full bg-violet-600/4 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f] animate-pulse inline-block" />
          14,847 active jobs · updated 2 hours ago
        </div>

        <h1 className="text-5xl font-bold tracking-[-0.02em] text-white sm:text-6xl lg:text-[72px] leading-[1.08]">
          Find your next job
          <br />
          <span className="text-[#10a37f]">by asking ChatGPT</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50 leading-relaxed">
          Jobs at OpenAI, Anthropic, Stripe, Coinbase, Google DeepMind and 100+ top companies — search in plain English, get structured results with direct apply links.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={GPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-[#10a37f] px-7 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-[#10a37f]/20 transition-all hover:bg-[#0d9270] hover:shadow-[#10a37f]/30 hover:scale-[1.02] active:scale-[0.99]"
          >
            <OpenAILogo className="h-5 w-5" />
            Add to ChatGPT — Free
          </a>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-[15px] font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white hover:border-white/20"
          >
            Browse 14,000+ jobs
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-xs text-white/25">
          Free to use &nbsp;·&nbsp; No account needed &nbsp;·&nbsp; Direct jobs from company career pages
        </p>
      </div>

      {/* Chat demo */}
      <ChatDemo />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Chat Demo
// ---------------------------------------------------------------------------
function ChatDemo() {
  const jobs = [
    { title: "Executive Creative Director", company: "Ogilvy", location: "Sydney, AU", type: "Hybrid", color: "bg-amber-500/10 text-amber-400" },
    { title: "Creative Director", company: "Canva", location: "Sydney / Remote", type: "Remote", color: "bg-emerald-500/10 text-emerald-400" },
    { title: "Group Creative Director", company: "72andSunny", location: "Remote Global", type: "Remote", color: "bg-emerald-500/10 text-emerald-400" },
  ];

  return (
    <div className="mx-auto mt-14 max-w-[520px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl shadow-black/60">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <OpenAILogo className="h-3 w-3" />
            AgentJobs GPT
          </div>
          <div className="w-16" />
        </div>

        <div className="p-5 space-y-5">
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2a2a2a] px-4 py-3 text-sm text-white/85">
              Find me creative director jobs in Sydney or remote
            </div>
          </div>

          {/* Assistant response */}
          <div className="flex gap-3">
            <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center">
              <OpenAILogo className="h-3.5 w-3.5 text-[#10a37f]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/60 mb-3">
                Found <span className="text-white font-semibold">8 roles</span> matching creative director — Sydney or remote:
              </p>

              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.title} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{job.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{job.company} · {job.location}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${job.color}`}>
                      {job.type}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-white/25 mt-3">
                +5 more results · Apply links included · Last updated 1h ago
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.07] px-4 pb-4 pt-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#2a2a2a] border border-white/[0.07] px-4 py-3">
            <span className="flex-1 text-sm text-white/20 select-none">Ask about jobs...</span>
            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="h-3 w-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company Ticker
// ---------------------------------------------------------------------------
const COMPANIES = [
  "OpenAI", "Anthropic", "Google DeepMind", "Stripe", "Coinbase",
  "Vercel", "Figma", "Notion", "Linear", "Ramp", "Cursor",
  "Perplexity", "ElevenLabs", "Runway", "Harvey", "Uniswap",
  "Polygon", "a16z", "Paradigm", "Brex", "Discord",
  "Cloudflare", "Datadog", "MongoDB", "GitLab", "Atlassian",
  "Binance", "Kraken", "OKX", "Scale AI", "Mistral",
];

function CompanyTicker() {
  return (
    <section className="border-t border-white/[0.06] py-12 overflow-hidden">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-8">
        Jobs direct from company career pages
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <span key={i} className="inline-flex items-center mx-7 text-sm font-medium text-white/25 hover:text-white/50 transition-colors cursor-default shrink-0">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
function Stats() {
  const stats = [
    { value: "14,847", label: "Active jobs", sub: "updated every 6 hours" },
    { value: "103+", label: "Company boards", sub: "direct ATS feeds" },
    { value: "30+", label: "Industries", sub: "from AI to crypto to creative" },
    { value: "Free", label: "Always", sub: "no account required" },
  ];

  return (
    <section className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-px bg-white/[0.07] rounded-2xl overflow-hidden sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center bg-[#0a0a0a] px-5 py-8 text-center">
              <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{s.value}</div>
              <div className="mt-1.5 text-sm font-semibold text-white/70">{s.label}</div>
              <div className="mt-0.5 text-xs text-white/25 leading-snug">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Job Categories — looks like a real job board
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { emoji: "🤖", name: "AI & Machine Learning", slug: "AI engineer", count: "1,240", hot: true },
  { emoji: "💻", name: "Software Engineering", slug: "Software engineer", count: "3,420" },
  { emoji: "🎨", name: "Design & Creative", slug: "Designer", count: "810" },
  { emoji: "📦", name: "Product Management", slug: "Product manager", count: "650" },
  { emoji: "📈", name: "Growth & Marketing", slug: "Marketing manager", count: "730" },
  { emoji: "🌐", name: "Web3 & Crypto", slug: "Blockchain developer", count: "940", hot: true },
  { emoji: "💰", name: "Finance & Fintech", slug: "Finance manager", count: "590" },
  { emoji: "🤝", name: "Sales & Success", slug: "Account executive", count: "1,100" },
  { emoji: "📊", name: "Data & Analytics", slug: "Data scientist", count: "870" },
  { emoji: "🛡️", name: "Security & DevOps", slug: "DevOps engineer", count: "680" },
  { emoji: "⚖️", name: "Legal & Compliance", slug: "Compliance manager", count: "310" },
  { emoji: "👥", name: "People & Recruiting", slug: "HR manager", count: "420" },
];

function JobCategories() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#10a37f]">Browse by category</span>
        </div>
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Every role, every industry
          </h2>
          <Link href="/jobs" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            View all jobs
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/jobs?q=${encodeURIComponent(cat.slug)}`}
              className="group relative flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-px"
            >
              {cat.hot && (
                <span className="absolute top-3 right-3 rounded-full bg-[#10a37f]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10a37f]">
                  HOT
                </span>
              )}
              <span className="text-xl">{cat.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-snug">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-white/30">{cat.count} open roles</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works — clean 3-step with visual
// ---------------------------------------------------------------------------
function HowItWorks() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20 bg-white/[0.01]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#10a37f] mb-3">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Job search, finally done right
          </h2>
          <p className="mt-4 text-white/40 max-w-md mx-auto text-[15px] leading-relaxed">
            Stop scrolling through irrelevant listings. Just describe what you want and AgentJobs finds it.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              icon: (
                <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              ),
              title: "Ask in plain English",
              description: "Open ChatGPT with AgentJobs installed. Ask for exactly what you want — role, location, salary, company type.",
              pill: '"Find senior ML roles at AI startups, remote, $200k+"',
            },
            {
              step: "2",
              icon: (
                <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
              title: "Real-time search",
              description: "AgentJobs searches 14,000+ jobs from OpenAI, Anthropic, Stripe, Coinbase and 100+ company career pages — all updated every 6 hours.",
              pill: "Searching 103 company boards...",
            },
            {
              step: "3",
              icon: (
                <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              ),
              title: "Apply directly",
              description: "Get structured results with salary info, location, and direct apply links to the company's own careers page. No middleman.",
              pill: "Apply at careers.openai.com →",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/20">
                  {s.icon}
                </div>
                <span className="text-3xl font-bold text-white/[0.06]">0{s.step}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed mb-5">{s.description}</p>
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
                <p className="text-xs text-[#10a37f]/70 font-mono leading-snug">{s.pill}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Example Queries Grid — like a real job site showing popular searches
// ---------------------------------------------------------------------------
const EXAMPLE_QUERIES = [
  { q: "Creative director jobs in Sydney or remote", tag: "Creative" },
  { q: "Senior ML engineer at AI companies, $200k+", tag: "AI" },
  { q: "Product manager at crypto startups, remote", tag: "Web3" },
  { q: "Software engineer at OpenAI or Anthropic", tag: "AI" },
  { q: "Head of design at Series B startup", tag: "Design" },
  { q: "Data scientist in Singapore or Hong Kong", tag: "APAC" },
  { q: "DevOps engineer at fintech companies", tag: "Engineering" },
  { q: "Account executive SaaS, OTE $180k+", tag: "Sales" },
];

const TAG_COLORS: Record<string, string> = {
  Creative: "bg-purple-500/10 text-purple-400",
  AI: "bg-emerald-500/10 text-emerald-400",
  Web3: "bg-amber-500/10 text-amber-400",
  Design: "bg-pink-500/10 text-pink-400",
  APAC: "bg-blue-500/10 text-blue-400",
  Engineering: "bg-cyan-500/10 text-cyan-400",
  Sales: "bg-orange-500/10 text-orange-400",
};

function ExampleQueries() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#10a37f]">Popular searches</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-10 sm:text-4xl">
          Ask anything, naturally
        </h2>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {EXAMPLE_QUERIES.map((item) => (
            <Link
              key={item.q}
              href={`/jobs?q=${encodeURIComponent(item.q)}`}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-3.5 transition-all hover:border-white/15 hover:bg-white/[0.05]"
            >
              <svg className="h-4 w-4 shrink-0 text-white/20 group-hover:text-[#10a37f]/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 text-sm text-white/55 group-hover:text-white/80 transition-colors">{item.q}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TAG_COLORS[item.tag] ?? "bg-white/10 text-white/40"}`}>
                {item.tag}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------
function FinalCTA() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10a37f]/10 border border-[#10a37f]/20">
          <OpenAILogo className="h-7 w-7 text-[#10a37f]" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start finding better jobs today
        </h2>
        <p className="mt-4 text-white/45 leading-relaxed max-w-md mx-auto">
          Add AgentJobs to ChatGPT in one click. Free, no account required. Just open ChatGPT and start searching.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={GPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#10a37f] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#10a37f]/20 transition-all hover:bg-[#0d9270] hover:scale-[1.02] active:scale-[0.99]"
          >
            <OpenAILogo className="h-5 w-5" />
            Add to ChatGPT — Free
          </a>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-[15px] font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            Browse directly
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/20">
          Free forever &nbsp;·&nbsp; Jobs from 103+ company boards &nbsp;·&nbsp; Updated every 6 hours
        </p>
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
        <CompanyTicker />
        <Stats />
        <JobCategories />
        <HowItWorks />
        <ExampleQueries />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
