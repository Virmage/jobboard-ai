// ---------------------------------------------------------------------------
// Region detection keywords
// ---------------------------------------------------------------------------

export const APAC_KEYWORDS = [
  // Countries
  "singapore",
  "hong kong",
  "japan",
  "tokyo",
  "south korea",
  "seoul",
  "taiwan",
  "taipei",
  "australia",
  "sydney",
  "melbourne",
  "brisbane",
  "new zealand",
  "auckland",
  "india",
  "mumbai",
  "bangalore",
  "bengaluru",
  "delhi",
  "hyderabad",
  "chennai",
  "pune",
  "china",
  "beijing",
  "shanghai",
  "shenzhen",
  "guangzhou",
  "thailand",
  "bangkok",
  "vietnam",
  "ho chi minh",
  "hanoi",
  "indonesia",
  "jakarta",
  "philippines",
  "manila",
  "malaysia",
  "kuala lumpur",
  // Region labels
  "apac",
  "asia pacific",
  "asia-pacific",
  "southeast asia",
  "sea region",
];

export const US_KEYWORDS = [
  // Cities
  "new york",
  "nyc",
  "san francisco",
  "sf",
  "los angeles",
  "la",
  "chicago",
  "boston",
  "seattle",
  "austin",
  "denver",
  "miami",
  "atlanta",
  "dallas",
  "houston",
  "phoenix",
  "philadelphia",
  "san diego",
  "portland",
  "washington dc",
  "dc",
  // States (abbreviated)
  "ca",
  "ny",
  "tx",
  "wa",
  "co",
  "ma",
  "fl",
  "il",
  "ga",
  "pa",
  "oh",
  "nc",
  "va",
  "az",
  "or",
  "mn",
  "ut",
  "ct",
  "nj",
  "md",
  // States (full)
  "california",
  "new york",
  "texas",
  "washington",
  "colorado",
  "massachusetts",
  "florida",
  "illinois",
  "georgia",
  "pennsylvania",
  "ohio",
  "north carolina",
  "virginia",
  "arizona",
  "oregon",
  "minnesota",
  "utah",
  "connecticut",
  "new jersey",
  "maryland",
  // Region labels
  "united states",
  "usa",
  "u.s.",
  "u.s.a.",
];

export const EU_KEYWORDS = [
  // Countries
  "united kingdom",
  "uk",
  "england",
  "london",
  "manchester",
  "bristol",
  "edinburgh",
  "germany",
  "berlin",
  "munich",
  "hamburg",
  "frankfurt",
  "france",
  "paris",
  "lyon",
  "netherlands",
  "amsterdam",
  "rotterdam",
  "spain",
  "madrid",
  "barcelona",
  "italy",
  "milan",
  "rome",
  "ireland",
  "dublin",
  "portugal",
  "lisbon",
  "sweden",
  "stockholm",
  "denmark",
  "copenhagen",
  "finland",
  "helsinki",
  "norway",
  "oslo",
  "poland",
  "warsaw",
  "czech",
  "prague",
  "austria",
  "vienna",
  "belgium",
  "brussels",
  "switzerland",
  "zurich",
  "geneva",
  // Region labels
  "europe",
  "eu",
  "emea",
  "eea",
];

export const LATAM_KEYWORDS = [
  "brazil",
  "sao paulo",
  "rio de janeiro",
  "mexico",
  "mexico city",
  "argentina",
  "buenos aires",
  "colombia",
  "bogota",
  "chile",
  "santiago",
  "peru",
  "lima",
  "latin america",
  "latam",
];

// ---------------------------------------------------------------------------
// API tiers
// ---------------------------------------------------------------------------
export const API_TIERS = {
  free: { rateLimit: 100, label: "Free" },
  starter: { rateLimit: 1000, label: "Starter" },
  pro: { rateLimit: 10000, label: "Pro" },
  enterprise: { rateLimit: 100000, label: "Enterprise" },
} as const;

export type ApiTier = keyof typeof API_TIERS;

// ---------------------------------------------------------------------------
// Freshness thresholds (hours)
// ---------------------------------------------------------------------------
export const FRESHNESS_THRESHOLDS = {
  VERY_FRESH: 6, // < 6 hours
  FRESH: 24, // < 24 hours
  RECENT: 72, // < 3 days
  AGING: 168, // < 7 days
  STALE: 336, // < 14 days
} as const;

// ---------------------------------------------------------------------------
// Scanner sources
// ---------------------------------------------------------------------------
export const SCANNER_SOURCES = [
  "linkedin",
  "greenhouse",
  "lever",
  "ashby",
  "workable",
  "wellfound",
  "web3-career",
  "crypto-jobs",
] as const;

export type ScannerSource = (typeof SCANNER_SOURCES)[number];

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
