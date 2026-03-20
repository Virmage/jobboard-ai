// ---------------------------------------------------------------------------
// Scanner type definitions
// ---------------------------------------------------------------------------

/** Raw job scraped from any source before DB normalization. */
export interface RawJob {
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  description?: string;
  salary?: string;
  postedAt?: Date;
}

/** A compiled regex matcher for a single role taxonomy. */
export interface TitleMatcher {
  patterns: RegExp[];
  taxonomyId: string;
  slug: string;
}

/** Result returned by each individual source scanner. */
export interface ScanResult {
  jobs: RawJob[];
  source: string;
  errors?: string[];
}

/** A career project (crypto project with known ATS). */
export interface CareerProject {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  homepage: string;
  careerUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | "workable" | "generic" | null;
  atsId: string | null;
}

/** Stats returned by a full scan run. */
export interface ScanStats {
  totalFound: number;
  newJobs: number;
  sourceBreakdown: Record<string, number>;
  errors: Array<{ source: string; message: string }>;
}

/** Region detection result. */
export type Region =
  | "apac"
  | "emea"
  | "americas"
  | "remote"
  | "unknown";
