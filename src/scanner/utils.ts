import type { TitleMatcher, Region } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/** Fetch a URL and return its text body, or null on any failure. */
export async function fetchText(
  url: string,
  timeout = 15_000,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Fetch a URL and return parsed JSON, or null on any failure. */
export async function fetchJSON<T = unknown>(
  url: string,
  timeout = 15_000,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Fetch JSON with retry + 429 back-off (for CoinGecko etc.). */
export async function fetchJSONRetry<T = unknown>(
  url: string,
  retries = 2,
): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 429) {
        console.log("  Rate limited, waiting 60 s...");
        await sleep(60_000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch {
      if (i < retries) {
        await sleep(3_000);
        continue;
      }
      return null;
    }
  }
  return null;
}

/** HEAD request to check if a URL is reachable. */
export async function headCheck(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Date / age helpers
// ---------------------------------------------------------------------------

/**
 * Parse relative age strings like "8d", "2mo", "1y", "3h", "5w".
 * Returns estimated number of days, or Infinity if unparseable.
 */
export function parseRelativeAge(text: string | null | undefined): number {
  if (!text) return Infinity;
  const t = text.trim().toLowerCase();
  const m = t.match(/^(\d+)\s*(h|d|w|mo|y)/);
  if (!m) return Infinity;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case "h":
      return n / 24;
    case "d":
      return n;
    case "w":
      return n * 7;
    case "mo":
      return n * 30;
    case "y":
      return n * 365;
    default:
      return Infinity;
  }
}

/** Return true if the given Date is within the last `cutoffDays` days. */
export function isWithinCutoff(
  date: Date | null | undefined,
  cutoffDays = 14,
): boolean {
  if (!date || isNaN(date.getTime())) return false;
  const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() <= cutoffMs;
}

// ---------------------------------------------------------------------------
// Title matching
// ---------------------------------------------------------------------------

/**
 * Match a job title against an array of TitleMatchers.
 * Returns the best matching TitleMatcher, or null if none match.
 */
export function titleMatchesAny(
  title: string | null | undefined,
  matchers: TitleMatcher[],
): TitleMatcher | null {
  if (!title) return null;
  for (const matcher of matchers) {
    if (matcher.patterns.some((p) => p.test(title))) {
      return matcher;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Region detection
// ---------------------------------------------------------------------------

const APAC_KEYWORDS = [
  "apac", "asia", "pacific", "australia", "sydney", "melbourne", "brisbane",
  "singapore", "tokyo", "japan", "korea", "seoul", "hong kong", "taipei",
  "india", "mumbai", "bangalore", "new zealand", "auckland", "southeast asia",
  "philippines", "vietnam", "thailand", "bangkok", "indonesia", "jakarta",
  "china", "shanghai", "beijing", "shenzhen", "oceania",
];

const EMEA_KEYWORDS = [
  "emea", "europe", "london", "berlin", "paris", "amsterdam", "dublin",
  "zurich", "geneva", "lisbon", "madrid", "barcelona", "stockholm",
  "copenhagen", "oslo", "helsinki", "vienna", "prague", "warsaw",
  "middle east", "dubai", "abu dhabi", "tel aviv", "africa", "lagos",
  "cape town", "nairobi", "cairo", "uk", "united kingdom", "germany",
  "france", "spain", "italy", "netherlands", "switzerland", "portugal",
  "ireland", "denmark", "sweden", "norway", "finland", "austria",
];

const AMERICAS_KEYWORDS = [
  "americas", "us", "usa", "united states", "new york", "san francisco",
  "los angeles", "chicago", "seattle", "boston", "austin", "denver",
  "miami", "atlanta", "dallas", "canada", "toronto", "vancouver",
  "montreal", "brazil", "sao paulo", "mexico", "buenos aires", "bogota",
  "california", "texas", "washington",
];

/** Detect region from location string. */
export function detectRegion(location: string | null | undefined): string {
  if (!location) return "Global";
  const loc = location.toLowerCase();
  if (APAC_KEYWORDS.some((k) => loc.includes(k))) return "APAC";
  if (EMEA_KEYWORDS.some((k) => loc.includes(k))) return "EU";
  if (AMERICAS_KEYWORDS.some((k) => loc.includes(k))) return "US";
  if (/\bremote\b/i.test(loc)) return "Global";
  return "Global";
}

// ---------------------------------------------------------------------------
// Creative leadership title patterns (kept for backward-compat)
// ---------------------------------------------------------------------------

export const CREATIVE_LEADERSHIP_PATTERNS: RegExp[] = [
  /creative\s*director/i,
  /head\s+of\s+(brand|social|creative|marketing|content|design|comms)/i,
  /brand\s*(director|lead|manager|head)/i,
  /creative\s*(lead|head|manager)/i,
  /social\s*(media\s*)?(director|lead|head|manager)/i,
  /marketing\s*(director|lead|head)/i,
  /vp\s*(of\s*)?(brand|creative|marketing|social)/i,
  /chief\s*(brand|creative|marketing)\s*officer/i,
  /director\s+of\s+(brand|creative|social|marketing|content|design)/i,
];

// ---------------------------------------------------------------------------
// ALL role title patterns — covers every major job category
// ---------------------------------------------------------------------------

export const ALL_ROLE_PATTERNS: RegExp[] = [
  // ── Creative & Brand ──
  /creative\s*director/i,
  /head\s+of\s+(brand|social|creative|marketing|content|design|comms)/i,
  /brand\s*(director|lead|manager|head)/i,
  /creative\s*(lead|head|manager)/i,
  /social\s*(media\s*)?(director|lead|head|manager)/i,
  /marketing\s*(director|lead|head)/i,
  /vp\s*(of\s*)?(brand|creative|marketing|social)/i,
  /chief\s*(brand|creative|marketing)\s*officer/i,
  /director\s+of\s+(brand|creative|social|marketing|content|design)/i,
  /content\s*(director|lead|head|strategist)/i,
  /editor[- ]?in[- ]?chief/i,
  /editorial\s*(director|lead|head)/i,
  /managing\s+editor/i,
  /copywriter/i,
  /art\s*director/i,

  // ── Engineering / Tech ──
  /software\s*(engineer|developer)/i,
  /\b(senior|sr\.?|staff|principal|lead|junior|jr\.?)\s+(software\s+)?(engineer|developer)/i,
  /\b(frontend|front[- ]end|backend|back[- ]end|fullstack|full[- ]stack)\s+(software\s+)?(engineer|developer)/i,
  /mobile\s*(engineer|developer)/i,
  /\b(ios|android|react\s*native|flutter)\s+(engineer|developer)/i,
  /devops\s*(engineer|lead|manager)/i,
  /\bsre\b/i,
  /site\s*reliability\s*(engineer|lead)/i,
  /platform\s*(engineer|lead|manager)/i,
  /infrastructure\s*(engineer|lead|manager)/i,
  /cloud\s*(engineer|architect)/i,
  /security\s*(engineer|architect|lead)/i,
  /qa\s*(engineer|lead|manager)/i,
  /quality\s*assurance\s*(engineer|lead|manager)/i,
  /test\s*(engineer|automation\s*engineer|lead)/i,
  /embedded\s*(engineer|developer|software)/i,
  /systems?\s*(engineer|architect)/i,
  /network\s*(engineer|architect)/i,
  /solutions?\s*(architect|engineer)/i,
  /engineering\s*(manager|director|lead|head)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?engineering/i,
  /\bcto\b/i,
  /chief\s*technology\s*officer/i,
  /technical\s*(lead|director|program\s*manager)/i,
  /(?:senior|staff|principal)\s+engineering\s+manager/i,

  // ── Product ──
  /product\s*manager/i,
  /\b(senior|sr\.?|associate|group|principal|lead|staff)\s+product\s*manager/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?product/i,
  /\bcpo\b/i,
  /chief\s*product\s*officer/i,
  /product\s*(lead|owner|director|head)/i,
  /technical\s*product\s*manager/i,
  /product\s*(?:ops|operations)\s*manager/i,

  // ── Design (broader) ──
  /\b(ux|ui|ux\/?ui|product|visual|interaction|graphic|motion)\s*designer/i,
  /\b(senior|sr\.?|staff|principal|lead|junior|jr\.?)\s+(?:ux|ui|product|visual|interaction)?\s*designer/i,
  /design\s*(director|lead|head|manager|systems)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?design/i,
  /ux\s*researcher/i,
  /design\s*(?:systems|ops)\s*(lead|manager|engineer)/i,
  /chief\s*design\s*officer/i,

  // ── Data & AI ──
  /data\s*scientist/i,
  /\b(senior|sr\.?|staff|principal|lead|junior|jr\.?)\s+data\s*scientist/i,
  /data\s*analyst/i,
  /\b(senior|sr\.?|lead)\s+data\s*analyst/i,
  /data\s*engineer/i,
  /\b(senior|sr\.?|staff|principal|lead)\s+data\s*engineer/i,
  /\bml\s*(engineer|scientist|researcher|lead)/i,
  /machine\s*learning\s*(engineer|scientist|researcher|lead)/i,
  /\bai\s*(engineer|scientist|researcher|lead)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?(?:data|analytics|ai|machine\s*learning)/i,
  /analytics\s*(manager|director|lead|engineer)/i,
  /\bbi\s*(analyst|engineer|developer|manager)/i,
  /business\s*intelligence\s*(analyst|engineer|developer|manager)/i,
  /research\s*scientist/i,
  /chief\s*(?:data|analytics|ai)\s*officer/i,
  /nlp\s*(engineer|scientist|researcher)/i,
  /computer\s*vision\s*(engineer|scientist|researcher)/i,

  // ── Marketing & Growth (broader) ──
  /growth\s*(manager|lead|head|director|hacker)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?growth/i,
  /\bseo\s*(manager|lead|specialist|director)/i,
  /performance\s*marketing\s*(manager|lead|director|specialist)/i,
  /demand\s*gen(?:eration)?\s*(manager|lead|director|specialist)/i,
  /marketing\s*manager/i,
  /\b(senior|sr\.?|lead)\s+marketing\s*manager/i,
  /email\s*marketing\s*(manager|lead|specialist)/i,
  /content\s*marketing\s*(manager|lead|director|specialist)/i,
  /product\s*marketing\s*(manager|lead|director)/i,
  /\bpmm\b/i,
  /digital\s*marketing\s*(manager|lead|director|specialist)/i,
  /brand\s*marketing\s*(manager|lead|director)/i,
  /social\s*media\s*(manager|specialist|coordinator)/i,
  /\bcmo\b/i,
  /chief\s*marketing\s*officer/i,
  /marketing\s*(?:analyst|coordinator|associate|specialist)/i,
  /communications?\s*(manager|director|lead|specialist)/i,
  /pr\s*(manager|director|lead|specialist)/i,
  /public\s*relations\s*(manager|director|lead|specialist)/i,

  // ── Sales & Business Development ──
  /account\s*executive/i,
  /\b(senior|sr\.?|enterprise|mid[- ]?market|strategic)\s+account\s*executive/i,
  /\bsdr\b/i,
  /sales\s*development\s*rep(?:resentative)?/i,
  /\bbdr\b/i,
  /business\s*development\s*rep(?:resentative)?/i,
  /sales\s*(manager|director|lead|head|engineer)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?sales/i,
  /enterprise\s*(?:sales\s*)?(?:account\s*)?(?:manager|director|lead)/i,
  /account\s*manager/i,
  /\b(senior|sr\.?|key|strategic)\s+account\s*manager/i,
  /revenue\s*(lead|director|head|manager)/i,
  /\bcro\b/i,
  /chief\s*revenue\s*officer/i,
  /sales\s*(?:ops|operations)\s*(manager|lead|director|analyst)/i,
  /customer\s*success\s*(manager|lead|director|head)/i,
  /solutions?\s*(?:consultant|engineer|specialist)/i,
  /pre[- ]?sales\s*(engineer|consultant|manager)/i,
  /business\s*development\s*(manager|director|lead|head)/i,
  /partnerships?\s*(manager|director|lead|head)/i,

  // ── Operations ──
  /operations?\s*(manager|director|lead|head|analyst|coordinator)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?(?:operations|ops)/i,
  /\bcoo\b/i,
  /chief\s*operating\s*officer/i,
  /chief\s*of\s*staff/i,
  /business\s*operations?\s*(manager|director|lead|analyst)/i,
  /(?:rev|sales|marketing)\s*ops\s*(manager|lead|director|analyst)/i,
  /program\s*(manager|director|lead)/i,
  /\b(senior|sr\.?|technical|engineering)\s+program\s*manager/i,
  /project\s*(manager|director|lead)/i,
  /\b(senior|sr\.?|technical)\s+project\s*manager/i,
  /(?:head|director)\s*(?:of\s+)?(?:strategy|strategy\s*&\s*operations)/i,
  /supply\s*chain\s*(manager|director|lead|analyst)/i,
  /logistics\s*(manager|director|lead|coordinator)/i,

  // ── Finance ──
  /\bcfo\b/i,
  /chief\s*financial\s*officer/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?finance/i,
  /financial\s*analyst/i,
  /\b(senior|sr\.?|lead)\s+financial\s*analyst/i,
  /controller/i,
  /\bfp&?a\s*(manager|analyst|director|lead)/i,
  /financial\s*planning\s*(?:&|and)\s*analysis/i,
  /accounting\s*(manager|director|lead)/i,
  /\b(senior|sr\.?|staff)\s+accountant/i,
  /tax\s*(manager|director|analyst|specialist)/i,
  /treasury\s*(manager|analyst|director)/i,
  /finance\s*(manager|director|lead|head)/i,

  // ── People & HR ──
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?(?:people|hr|human\s*resources|talent)/i,
  /people\s*(operations|ops)\s*(manager|lead|director)/i,
  /hr\s*(manager|director|lead|business\s*partner|generalist)/i,
  /human\s*resources\s*(manager|director|lead|business\s*partner|generalist)/i,
  /talent\s*acquisition\s*(manager|lead|director|specialist|recruiter)/i,
  /\b(senior|sr\.?|lead|technical|executive)\s*recruiter/i,
  /recruiter/i,
  /(?:head|director)\s*(?:of\s+)?talent/i,
  /people\s*(?:&|and)\s*culture\s*(manager|director|lead|head)/i,
  /chief\s*(?:people|human\s*resources)\s*officer/i,
  /\bchro\b/i,
  /compensation\s*(?:&|and)?\s*benefits?\s*(manager|analyst|director)/i,
  /learning\s*(?:&|and)?\s*development\s*(manager|lead|director|specialist)/i,

  // ── Legal & Compliance ──
  /general\s*counsel/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?legal/i,
  /legal\s*(counsel|director|head|lead|manager)/i,
  /chief\s*legal\s*officer/i,
  /\bclo\b/i,
  /compliance\s*(officer|manager|director|lead|analyst)/i,
  /(?:head|director)\s*(?:of\s+)?compliance/i,
  /privacy\s*(officer|manager|counsel|lead)/i,
  /regulatory\s*(manager|director|counsel|lead|analyst)/i,
  /corporate\s*counsel/i,
  /(?:associate|deputy|senior)\s*general\s*counsel/i,
  /contract\s*(manager|specialist|analyst)/i,
  /paralegal/i,

  // ── Community & DevRel ──
  /community\s*(manager|director|lead|head)/i,
  /(?:head|vp|vice\s*president|director)\s*(?:of\s+)?community/i,
  /developer\s*(relations|advocate|evangelist|experience)/i,
  /\bdevrel\s*(manager|lead|director|head|engineer)/i,
  /(?:head|vp|director)\s*(?:of\s+)?(?:developer\s*relations|devrel|developer\s*experience)/i,
  /(?:senior|staff|principal)\s+developer\s*advocate/i,
  /technical\s*(?:community|evangelist|writer)/i,

  // ── Executive / C-Suite ──
  /\bceo\b/i,
  /chief\s*executive\s*officer/i,
  /\bcoo\b/i,
  /\bcfo\b/i,
  /\bcto\b/i,
  /\bcmo\b/i,
  /\bcpo\b/i,
  /\bcdo\b/i,
  /\bciso\b/i,
  /chief\s*information\s*security\s*officer/i,
  /chief\s*information\s*officer/i,
  /\bcio\b/i,
  /general\s*manager/i,
  /managing\s*director/i,
  /(?:head|vp|vice\s*president|svp|evp)\s*(?:of\s+)?\w+/i,

  // ── Crypto / Web3 specific ──
  /blockchain\s*(engineer|developer|architect|lead)/i,
  /smart\s*contract\s*(engineer|developer|auditor)/i,
  /solidity\s*(engineer|developer)/i,
  /protocol\s*(engineer|developer|lead)/i,
  /defi\s*(engineer|developer|analyst|strategist|lead)/i,
  /web3\s*(engineer|developer|lead)/i,
  /tokenomics\s*(analyst|lead|designer)/i,
  /crypto\s*(analyst|trader|researcher|strategist)/i,

  // ── Customer Support / Success ──
  /customer\s*(?:support|service)\s*(manager|director|lead|head|specialist|engineer)/i,
  /(?:head|vp|director)\s*(?:of\s+)?(?:customer\s*(?:support|service|experience))/i,
  /support\s*(engineer|specialist|manager|lead)/i,
  /technical\s*support\s*(engineer|specialist|manager|lead)/i,
  /customer\s*experience\s*(manager|director|lead)/i,

  // ── Advertising / Agency ──
  /media\s*(planner|buyer|director|manager|strategist)/i,
  /account\s*(director|supervisor|planner)/i,
  /strategy\s*(director|lead|manager)/i,
  /(?:head|director)\s*(?:of\s+)?(?:media|strategy|creative\s*strategy)/i,
  /copywriter/i,
  /\b(senior|sr\.?|lead|junior|jr\.?)\s+copywriter/i,
  /campaign\s*(manager|director|lead|strategist)/i,
];

/** Check if a title matches any creative leadership pattern. */
export function titleMatchesCreativeLeadership(title: string): boolean {
  return ALL_ROLE_PATTERNS.some((p) => p.test(title));
}

/**
 * Comprehensive search queries covering all major job categories.
 * Used by source scanners that perform keyword-based search.
 */
export const ALL_SEARCH_QUERIES: string[] = [
  // Creative & Brand
  "Creative Director", "Head of Brand", "Brand Director",
  "Head of Creative", "Art Director",
  // Engineering
  "Software Engineer", "Senior Software Engineer", "Staff Engineer",
  "Principal Engineer", "Engineering Manager", "Head of Engineering",
  "DevOps Engineer", "SRE", "Platform Engineer",
  "Frontend Engineer", "Backend Engineer", "Fullstack Engineer",
  "Mobile Engineer", "QA Engineer", "Data Engineer",
  "CTO", "VP Engineering",
  // Product
  "Product Manager", "Senior Product Manager", "Head of Product",
  "VP Product", "Product Lead", "Product Owner", "Group Product Manager",
  // Design
  "UX Designer", "Product Designer", "UI Designer",
  "Design Lead", "Head of Design", "UX Researcher",
  // Data & AI
  "Data Scientist", "Data Analyst", "ML Engineer", "AI Engineer",
  "Head of Data", "Analytics Manager", "Research Scientist",
  // Marketing & Growth
  "Marketing Manager", "Head of Marketing", "Growth Manager",
  "Head of Growth", "SEO Manager", "Performance Marketing",
  "Demand Generation", "Content Marketing", "Product Marketing Manager",
  "Digital Marketing", "CMO",
  // Sales
  "Account Executive", "SDR", "BDR", "Sales Manager",
  "VP Sales", "Head of Sales", "Enterprise AE",
  "Account Manager", "Customer Success Manager",
  // Operations
  "Operations Manager", "Head of Operations", "COO",
  "Chief of Staff", "Program Manager", "Project Manager",
  "Business Operations",
  // Finance
  "CFO", "Financial Analyst", "Controller", "FP&A",
  "Accounting Manager", "Head of Finance",
  // People & HR
  "Head of People", "HR Manager", "People Operations",
  "Talent Acquisition", "Recruiter", "Head of Talent",
  // Legal
  "General Counsel", "Head of Legal", "Compliance Officer",
  "Legal Counsel", "Privacy Officer",
  // Community & DevRel
  "Community Manager", "Head of Community", "Developer Relations",
  "Developer Advocate", "Developer Experience",
  // Executive
  "CEO", "COO", "CFO", "CTO", "CMO", "General Manager",
  "Managing Director",
  // Crypto / Web3
  "Blockchain Engineer", "Solidity Developer", "Smart Contract Engineer",
  "Protocol Engineer", "DeFi", "Web3 Engineer",
  // Customer Support
  "Customer Support Manager", "Customer Success Manager",
  "Support Engineer", "Technical Support",
  // Social & Content
  "Social Media Manager", "Head of Social", "Head of Content",
  "Content Director", "Editor-in-Chief",
];

// ---------------------------------------------------------------------------
// Fetch with basic auth (for Reed API etc.)
// ---------------------------------------------------------------------------

export async function fetchJSONWithAuth<T = unknown>(
  url: string,
  username: string,
  password = "",
  timeout = 15_000,
): Promise<T | null> {
  try {
    const creds = Buffer.from(`${username}:${password}`).toString("base64");
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${creds}`,
        Accept: "application/json",
        "User-Agent": UA,
      },
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dedup key generation
// ---------------------------------------------------------------------------

/** Generate a deterministic dedup key for a raw job. */
export function makeDedupKey(title: string, company: string): string {
  return `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}`;
}
