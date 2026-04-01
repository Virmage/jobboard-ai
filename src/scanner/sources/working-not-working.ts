import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchJSON, fetchText, sleep } from "../utils";

/**
 * Scan workingnotworking.com for creative leadership roles.
 *
 * Working Not Working is a curated platform for senior creative talent.
 * It focuses on creative directors, art directors, copywriters, and
 * other senior creative roles at top agencies and brands.
 */

interface WNWJob {
  id: string;
  title?: string;
  role?: string;
  company?: { name?: string };
  location?: { city?: string; country?: string; remote?: boolean };
  url?: string;
  slug?: string;
}

export async function scanWorkingNotWorking(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Try JSON API first
  try {
    const data = await fetchJSON<{ results?: WNWJob[]; jobs?: WNWJob[] }>(
      "https://workingnotworking.com/api/jobs?per_page=100&sort=recent",
    );

    const items = data?.results || data?.jobs || [];
    for (const job of items) {
      const title = job.title || job.role || "";
      if (!title) continue;

      const company = job.company?.name || "See listing";
      const city = job.location?.city || "";
      const country = job.location?.country || "";
      const remote = job.location?.remote;
      const location = remote
        ? "Remote"
        : [city, country].filter(Boolean).join(", ") || "Global";

      const link = job.url
        ? job.url
        : job.slug
          ? `https://workingnotworking.com/jobs/${job.slug}`
          : `https://workingnotworking.com/jobs`;

      if (seenLinks.has(link)) continue;
      seenLinks.add(link);

      jobs.push({ title, company, location, link, source: "Working Not Working" });
    }

    if (jobs.length > 0) return jobs;
  } catch {
    // Fall through to HTML scraping
  }

  // HTML fallback — scrape public job listings
  const CREATIVE_SLUGS = [
    "creative-director",
    "executive-creative-director",
    "group-creative-director",
    "art-director",
    "head-of-brand",
    "brand-director",
    "chief-creative-officer",
  ];

  for (const slug of CREATIVE_SLUGS) {
    const url = `https://workingnotworking.com/jobs?q=${encodeURIComponent(slug.replace(/-/g, " "))}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(1_500);
      continue;
    }

    const $ = cheerio.load(html);

    $("a[href*='/jobs/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.find("[class*='title'], h2, h3, strong").first().text().trim()
        || $el.text().trim();

      if (!title || !href || title.length < 5 || title.length > 120) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://workingnotworking.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "Global",
        link: fullLink,
        source: "Working Not Working",
      });
    });

    await sleep(1_500);
  }

  return jobs;
}
