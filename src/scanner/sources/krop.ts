import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

const BASE_URL = "https://www.krop.com/jobs/";

const SEARCH_TERMS = [
  "creative-director",
  "head-of-creative",
  "executive-creative-director",
  "head-of-brand",
  "brand-director",
  "head-of-design",
  "design-director",
];

/**
 * Scrape Krop.com — design and creative industry job board.
 * Strong source for creative director and senior design leadership roles globally.
 */
export async function scanKrop(): Promise<RawJob[]> {
  const seen = new Set<string>();
  const jobs: RawJob[] = [];

  for (const term of SEARCH_TERMS) {
    const url = `${BASE_URL}?category=${term}&remote=1`;
    const html = await fetchText(url);
    if (!html) continue;

    const $ = cheerio.load(html);

    // Krop job cards
    $(".job-result, .job-listing, [class*='job'], article").each((_, el) => {
      const $el = $(el);
      const title = $el.find("h2, h3, .job-title, [class*='title']").first().text().trim();
      if (!title) return;

      const href = $el.find("a[href*='/jobs/']").first().attr("href")
        ?? $el.find("a").first().attr("href") ?? "";
      const link = href.startsWith("http") ? href : `https://www.krop.com${href}`;
      if (!link || seen.has(link)) return;
      seen.add(link);

      const company = $el.find("[class*='company'], [class*='employer']").first().text().trim() || "Unknown";
      const location = $el.find("[class*='location'], [class*='city']").first().text().trim() || "Remote";

      jobs.push({
        title,
        company,
        location,
        link,
        source: "Krop",
      });
    });

    await sleep(500);
  }

  return jobs;
}
