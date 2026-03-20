import type { CareerProject } from "./types";
import { fetchJSONRetry, fetchText, headCheck, sleep } from "./utils";

// ---------------------------------------------------------------------------
// ATS detection patterns
// ---------------------------------------------------------------------------

const CAREER_PATHS = [
  "/careers",
  "/jobs",
  "/join",
  "/join-us",
  "/work-with-us",
  "/open-roles",
];

const ATS_PATTERNS: Array<{
  type: CareerProject["atsType"];
  re: RegExp;
}> = [
  { type: "greenhouse", re: /boards\.greenhouse\.io\/(\w+)/i },
  {
    type: "greenhouse",
    re: /greenhouse\.io\/(?:embed\/)?job_board\/(\w+)/i,
  },
  { type: "lever", re: /jobs\.lever\.co\/(\w+)/i },
  { type: "ashby", re: /jobs\.ashbyhq\.com\/(\w[\w-]*)/i },
  { type: "workable", re: /apply\.workable\.com\/(\w[\w-]*)/i },
];

// ---------------------------------------------------------------------------
// CoinGecko types
// ---------------------------------------------------------------------------

interface CoinMarket {
  id: string;
  name: string;
  symbol: string;
}

interface CoinDetail {
  links?: {
    homepage?: string[];
  };
}

// ---------------------------------------------------------------------------
// Step 1: Fetch top 400 coins by market cap
// ---------------------------------------------------------------------------

async function getTopCoins(): Promise<CoinMarket[]> {
  console.log("Fetching top 400 coins from CoinGecko...");
  const coins: CoinMarket[] = [];

  for (let page = 1; page <= 2; page++) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`;
    console.log(`  Page ${page}/2...`);
    const data = await fetchJSONRetry<CoinMarket[]>(url);
    if (data) coins.push(...data);
    await sleep(2_500);
  }

  const trimmed = coins.slice(0, 400);
  console.log(`  Got ${trimmed.length} coins`);
  return trimmed;
}

// ---------------------------------------------------------------------------
// Step 2: Resolve homepage URLs
// ---------------------------------------------------------------------------

interface ProjectSeed {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  homepage: string;
}

async function getHomepages(coins: CoinMarket[]): Promise<ProjectSeed[]> {
  console.log("Fetching homepages for each coin...");
  const results: ProjectSeed[] = [];

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (i % 50 === 0) console.log(`  ${i}/${coins.length}...`);

    const data = await fetchJSONRetry<CoinDetail>(
      `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
    );

    if (data?.links?.homepage?.[0]) {
      results.push({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase(),
        rank: i + 1,
        homepage: data.links.homepage[0].replace(/\/$/, ""),
      });
    }

    await sleep(2_500); // ~24 req/min, under free tier limit
  }

  console.log(`  Got ${results.length} homepages`);
  return results;
}

// ---------------------------------------------------------------------------
// Step 3: Detect career pages + ATS
// ---------------------------------------------------------------------------

async function findCareerPages(
  projects: ProjectSeed[],
): Promise<CareerProject[]> {
  console.log("Scanning for career pages...");
  const cache: CareerProject[] = [];
  const BATCH = 10;

  for (let i = 0; i < projects.length; i += BATCH) {
    const batch = projects.slice(i, i + BATCH);
    if (i % 100 === 0) console.log(`  ${i}/${projects.length}...`);

    const results = await Promise.all(
      batch.map(async (proj): Promise<CareerProject> => {
        const entry: CareerProject = {
          ...proj,
          careerUrl: null,
          atsType: null,
          atsId: null,
        };

        // Try common career paths
        for (const path of CAREER_PATHS) {
          const url = `${proj.homepage}${path}`;
          const exists = await headCheck(url);
          if (exists) {
            const html = await fetchText(url, 8_000);
            if (html) {
              for (const pat of ATS_PATTERNS) {
                const m = html.match(pat.re);
                if (m) {
                  entry.atsType = pat.type;
                  entry.atsId = m[1];
                  entry.careerUrl = url;
                  return entry;
                }
              }
              // Generic career page (no recognized ATS)
              entry.atsType = "generic";
              entry.careerUrl = url;
              return entry;
            }
          }
        }

        // Also check the homepage itself for ATS links
        const homeHtml = await fetchText(proj.homepage, 8_000);
        if (homeHtml) {
          for (const pat of ATS_PATTERNS) {
            const m = homeHtml.match(pat.re);
            if (m) {
              entry.atsType = pat.type;
              entry.atsId = m[1];
              entry.careerUrl = proj.homepage;
              return entry;
            }
          }
        }

        return entry;
      }),
    );

    cache.push(...results);
    await sleep(500);
  }

  const withCareers = cache.filter((c) => c.careerUrl);
  console.log(`  Found ${withCareers.length} projects with career pages`);
  return cache;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the career cache by fetching top crypto projects from CoinGecko
 * and detecting their ATS / career page URLs.
 *
 * Returns only projects that have a detected career page.
 * Takes ~40-50 min due to CoinGecko rate limits.
 */
export async function buildCareerCache(): Promise<CareerProject[]> {
  const startTime = Date.now();
  const coins = await getTopCoins();
  const projects = await getHomepages(coins);
  const cache = await findCareerPages(projects);

  const withCareers = cache.filter((c) => c.careerUrl);
  const elapsed = ((Date.now() - startTime) / 60_000).toFixed(1);
  console.log(
    `Career cache built in ${elapsed} min. ${withCareers.length} projects with career pages.`,
  );

  return withCareers;
}
