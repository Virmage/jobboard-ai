import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const GPT_URL = "https://chatgpt.com/g/g-69c0a8b41d008191a6ad244646f7619e-agentjobs";

export const metadata: Metadata = {
  title: "AgentJobs — Your AI Recruiter for Jobs at OpenAI, Anthropic, Stripe & More",
  description:
    "AgentJobs is your AI recruiter. Searches 43,000+ jobs at OpenAI, Anthropic, Stripe, Coinbase and 100+ top companies — just tell ChatGPT what you want.",
  openGraph: {
    title: "AgentJobs — Your AI Recruiter for Jobs at OpenAI, Anthropic, Stripe & More",
    description:
      "Your AI recruiter. 43,000+ jobs at the world's best companies — just tell ChatGPT what you want.",
    type: "website",
  },
};

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}

function AddToGPTButton({ large = false }: { large?: boolean }) {
  return (
    <a
      href={GPT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 rounded-xl bg-[#10a37f] font-semibold text-white shadow-lg shadow-[#10a37f]/25 transition-all hover:bg-[#0d9270] hover:shadow-[#10a37f]/40 hover:scale-[1.02] active:scale-[0.99] ${large ? "px-7 py-4 text-base gap-3" : "px-6 py-3.5 text-[15px]"}`}
    >
      <OpenAILogo className={large ? "h-5 w-5" : "h-[18px] w-[18px]"} />
      Add to ChatGPT — Free
    </a>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-16">
      {/* Grid pattern */}
      <div className="bg-line-grid pointer-events-none absolute inset-0" />
      {/* Radial fade over grid */}
      <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_top] from-[#0a0a0a]/0 via-[#0a0a0a]/60 to-[#0a0a0a]" />
      {/* Green glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#10a37f]/8 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Label */}
        <div className="mb-7 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10a37f]/30 bg-[#10a37f]/8 px-4 py-1.5 text-xs font-mono font-medium text-[#10a37f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f] animate-pulse inline-block" />
            43,000+ active jobs across 100+ top companies
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl font-extrabold tracking-[-0.03em] text-white sm:text-6xl lg:text-[76px] leading-[1.05]">
          Your <span className="text-[#10a37f]">AI Recruiter.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-center text-lg text-white/80 leading-relaxed">
          AgentJobs searches 43,000+ live jobs at OpenAI, Anthropic, Stripe, Coinbase,
          and 100+ top companies — then acts like a recruiter who works for you.
          Just tell it what you want.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <AddToGPTButton large />
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-base font-medium text-white transition-all hover:bg-white/10 hover:border-white/25"
          >
            Browse 43,000+ jobs
            <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="mt-4 text-center text-xs font-mono text-white/30">
          Free forever &nbsp;·&nbsp; No account needed &nbsp;·&nbsp; Direct from company career pages
        </p>
      </div>

      <ChatDemo />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Chat Demo
// ---------------------------------------------------------------------------
function ChatDemo() {
  return (
    <div className="relative mx-auto mt-14 max-w-[540px]">
      {/* Subtle glow behind window */}
      <div className="absolute -inset-4 rounded-3xl bg-[#10a37f]/5 blur-xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#141414] shadow-2xl shadow-black/70">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/8 bg-[#111]/80 px-5 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/40">
            <OpenAILogo className="h-3 w-3 text-white/40" />
            AgentJobs · ChatGPT
          </div>
          <div className="w-16" />
        </div>

        <div className="p-5 space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#252525] px-4 py-3 text-sm text-white">
              I want a creative director role — Sydney or remote
            </div>
          </div>

          {/* Agent response */}
          <div className="flex gap-3">
            <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#10a37f]/15 border border-[#10a37f]/25 flex items-center justify-center">
              <OpenAILogo className="h-3.5 w-3.5 text-[#10a37f]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/85 mb-3">
                Found <span className="font-bold text-white">11 roles</span> — here are the strongest matches:
              </p>
              <div className="space-y-2 mb-3">
                {[
                  { title: "Executive Creative Director", company: "Ogilvy", location: "Sydney, AU", badge: "Hybrid", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
                  { title: "Creative Director", company: "Canva", location: "Sydney / Remote", badge: "Remote ✓", color: "text-[#10a37f] bg-[#10a37f]/10 border-[#10a37f]/20" },
                  { title: "Group Creative Director", company: "72andSunny", location: "Global Remote", badge: "Remote ✓", color: "text-[#10a37f] bg-[#10a37f]/10 border-[#10a37f]/20" },
                ].map((job) => (
                  <div key={job.title} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{job.title}</p>
                      <p className="text-xs text-white/55 mt-0.5">{job.company} · {job.location}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${job.color}`}>
                      {job.badge}
                    </span>
                  </div>
                ))}
              </div>
              {/* Recruiter follow-up */}
              <div className="rounded-xl border border-[#10a37f]/20 bg-[#10a37f]/6 px-4 py-3">
                <p className="text-[13px] text-white/85 leading-snug">
                  💡 Also open to <span className="font-semibold text-white">Head of Brand</span> or <span className="font-semibold text-white">ECD</span> titles? That unlocks 6 more strong matches.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-white/8 bg-[#111]/60 px-4 pb-4 pt-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#1e1e1e] border border-white/10 px-4 py-3">
            <span className="flex-1 text-sm text-white/30 select-none">Reply to your recruiter...</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10a37f]/20 border border-[#10a37f]/30">
              <svg className="h-3 w-3 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
    <section className="border-t border-white/8 py-10 overflow-hidden">
      <p className="text-center text-[11px] font-mono font-medium uppercase tracking-[0.15em] text-white/30 mb-7">
        Your recruiter has direct access to every open role at
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <span key={i} className="inline-flex items-center mx-8 text-sm font-semibold text-white hover:text-[#10a37f] transition-colors cursor-default shrink-0">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------
function Stats() {
  const stats = [
    { value: "43,000+", label: "Active jobs", sub: "updated every 6 hours" },
    { value: "103+", label: "Company boards", sub: "direct from career pages" },
    { value: "30+", label: "Industries", sub: "AI, crypto, creative & more" },
    { value: "Free", label: "Always", sub: "no account required" },
  ];

  return (
    <section className="border-t border-white/8 px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-px bg-white/8 rounded-2xl overflow-hidden sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center bg-[#0a0a0a] px-6 py-8 text-center">
              <div className="text-3xl font-extrabold tracking-tight text-white sm:text-[2.5rem]">{s.value}</div>
              <div className="mt-1.5 text-sm font-bold text-white/80">{s.label}</div>
              <div className="mt-1 text-xs font-mono text-white/35">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Recruiter vs Job Board
// ---------------------------------------------------------------------------
function RecruiterVsJobBoard() {
  return (
    <section className="border-t border-white/8 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[#10a37f]">
            Why AgentJobs
          </span>
        </div>
        <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          A recruiter, not a job board
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-base text-white/70 leading-relaxed">
          Job boards make you do the work. AgentJobs is the first AI recruiter
          that works for you — free, no sign-up, instant.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Old way */}
          <div className="rounded-2xl border border-white/8 bg-[#0f0f0f] p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-white/8 pb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">😩</span>
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-widest text-white/35">Old way</p>
                <p className="text-base font-bold text-white/60">Traditional job boards</p>
              </div>
            </div>
            <ul className="space-y-4">
              {[
                "Manually set filters, hoping you get the combo right",
                "Scroll through hundreds of irrelevant listings",
                "Apply to roles already closed or filled",
                "Miss jobs listed under different titles",
                "No context on the company or what they really want",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/60">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* New way */}
          <div className="glow-border rounded-2xl border border-[#10a37f]/25 bg-[#0d1a16] p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-[#10a37f]/15 pb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10a37f]/15 text-lg">✨</span>
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#10a37f]/70">New way</p>
                <p className="text-base font-bold text-white">AgentJobs — AI recruiter</p>
              </div>
            </div>
            <ul className="space-y-4">
              {[
                "Describe what you want in plain English — no forms",
                "Searches 43,000+ jobs and surfaces the best matches",
                "Asks smart follow-up questions like a real recruiter",
                "Suggests related titles you hadn't considered",
                "Groups results by location, adds context on each company",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
      n: "01",
      icon: (
        <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "Tell it what you want",
      body: "Open ChatGPT with AgentJobs. Describe the role, location, salary, company type — in plain English. No filters, no forms.",
      code: '"Senior ML engineer, AI startup, remote, $200k+"',
    },
    {
      n: "02",
      icon: (
        <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "It searches every open role",
      body: "AgentJobs hits 43,000+ live jobs across 103+ company career pages — OpenAI, Stripe, Coinbase, Vercel and more — updated every 6 hours.",
      code: "Scanning 103 boards · 43,247 positions indexed",
    },
    {
      n: "03",
      icon: (
        <svg className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Apply directly, no middleman",
      body: "Get curated results with salary info and direct apply links. Your recruiter suggests titles you hadn't considered and asks follow-up questions to refine.",
      code: "→ careers.openai.com/apply/senior-ml-engineer",
    },
  ];

  return (
    <section className="border-t border-white/8 bg-[#080808] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[#10a37f]">
            How it works
          </span>
        </div>
        <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Three steps. Zero friction.
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="group rounded-2xl border border-white/8 bg-[#0f0f0f] p-7 transition-all hover:border-white/15 hover:bg-[#111]">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#10a37f]/20 bg-[#10a37f]/8">
                  {s.icon}
                </div>
                <span className="font-mono text-4xl font-black text-white/5">{s.n}</span>
              </div>
              <h3 className="mb-2.5 text-base font-bold text-white">{s.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-white/65">{s.body}</p>
              <div className="rounded-lg border border-[#10a37f]/15 bg-[#10a37f]/5 px-3.5 py-2.5">
                <p className="font-mono text-xs text-[#10a37f]/80">{s.code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Job Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { emoji: "🤖", name: "AI & Machine Learning", slug: "AI engineer", count: "1,240+", hot: true },
  { emoji: "💻", name: "Software Engineering", slug: "Software engineer", count: "3,420+" },
  { emoji: "🎨", name: "Design & Creative", slug: "Designer", count: "810+" },
  { emoji: "📦", name: "Product Management", slug: "Product manager", count: "650+" },
  { emoji: "📈", name: "Growth & Marketing", slug: "Marketing manager", count: "730+" },
  { emoji: "🌐", name: "Web3 & Crypto", slug: "Blockchain developer", count: "940+", hot: true },
  { emoji: "💰", name: "Finance & Fintech", slug: "Finance manager", count: "590+" },
  { emoji: "🤝", name: "Sales & Success", slug: "Account executive", count: "1,100+" },
  { emoji: "📊", name: "Data & Analytics", slug: "Data scientist", count: "870+" },
  { emoji: "🛡️", name: "Security & DevOps", slug: "DevOps engineer", count: "680+" },
  { emoji: "⚖️", name: "Legal & Compliance", slug: "Compliance manager", count: "310+" },
  { emoji: "👥", name: "People & HR", slug: "HR manager", count: "420+" },
];

function JobCategories() {
  return (
    <section className="border-t border-white/8 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[#10a37f]">
            Browse by category
          </span>
        </div>
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Every role, every industry
          </h2>
          <Link href="/jobs" className="hidden items-center gap-1.5 text-sm font-medium text-white/50 transition-colors hover:text-white sm:inline-flex">
            View all jobs
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/jobs?q=${encodeURIComponent(cat.slug)}`}
              className="group relative flex flex-col gap-3 rounded-xl border border-white/8 bg-[#0f0f0f] p-4 transition-all hover:border-white/18 hover:bg-[#141414] hover:-translate-y-0.5"
            >
              {cat.hot && (
                <span className="absolute right-3 top-3 rounded-full border border-[#10a37f]/30 bg-[#10a37f]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#10a37f]">
                  HOT
                </span>
              )}
              <span className="text-xl">{cat.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white/85 leading-snug transition-colors group-hover:text-white">
                  {cat.name}
                </p>
                <p className="mt-1 font-mono text-xs text-white/35">{cat.count} open roles</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Example Queries
// ---------------------------------------------------------------------------
const EXAMPLE_QUERIES = [
  { q: "Creative director roles in Sydney or remote", tag: "Creative" },
  { q: "Senior ML engineer at AI companies, $200k+", tag: "AI" },
  { q: "Product manager at crypto startups, remote", tag: "Web3" },
  { q: "What's open at OpenAI or Anthropic right now?", tag: "AI" },
  { q: "Head of design at a Series B startup", tag: "Design" },
  { q: "Data scientist roles in Singapore or Hong Kong", tag: "APAC" },
  { q: "DevOps engineer at a fast-growing fintech", tag: "Engineering" },
  { q: "Account executive SaaS, OTE over $180k", tag: "Sales" },
];

const TAG_COLORS: Record<string, string> = {
  Creative: "border-purple-400/30 bg-purple-400/8 text-purple-300",
  AI: "border-[#10a37f]/30 bg-[#10a37f]/8 text-[#10a37f]",
  Web3: "border-amber-400/30 bg-amber-400/8 text-amber-300",
  Design: "border-pink-400/30 bg-pink-400/8 text-pink-300",
  APAC: "border-blue-400/30 bg-blue-400/8 text-blue-300",
  Engineering: "border-cyan-400/30 bg-cyan-400/8 text-cyan-300",
  Sales: "border-orange-400/30 bg-orange-400/8 text-orange-300",
};

function ExampleQueries() {
  return (
    <section className="border-t border-white/8 bg-[#080808] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[#10a37f]">
            Ask your recruiter
          </span>
        </div>
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Just describe what you want
        </h2>
        <p className="mb-10 text-base text-white/65">No filters. No forms. No noise.</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {EXAMPLE_QUERIES.map((item) => (
            <Link
              key={item.q}
              href={`/jobs?q=${encodeURIComponent(item.q)}`}
              className="group flex items-center gap-4 rounded-xl border border-white/8 bg-[#0f0f0f] px-5 py-3.5 transition-all hover:border-white/15 hover:bg-[#141414]"
            >
              <svg className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[#10a37f]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="flex-1 text-sm text-white/75 transition-colors group-hover:text-white">{item.q}</span>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${TAG_COLORS[item.tag] ?? "border-white/15 bg-white/5 text-white/50"}`}>
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
    <section className="relative border-t border-white/8 px-6 py-24 overflow-hidden">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-[#0a0a0a]/0 via-[#0a0a0a]/70 to-[#0a0a0a]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#10a37f]/6 blur-[100px]" />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#10a37f]/25 bg-[#10a37f]/10">
          <OpenAILogo className="h-7 w-7 text-[#10a37f]" />
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Get your AI recruiter for free
        </h2>
        <p className="mt-5 text-base text-white/70 leading-relaxed max-w-md mx-auto">
          Add AgentJobs to ChatGPT in one click. It searches 43,000+ jobs,
          asks the right questions, and finds roles you&apos;d never have found scrolling on your own.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <AddToGPTButton large />
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-6 py-4 text-base font-medium text-white/75 transition-all hover:bg-white/10 hover:text-white"
          >
            Browse directly
          </Link>
        </div>

        <p className="mt-6 font-mono text-xs text-white/25">
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
        <RecruiterVsJobBoard />
        <HowItWorks />
        <JobCategories />
        <ExampleQueries />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
