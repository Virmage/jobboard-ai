import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Search queries for Dribbble — design, product, UX, and creative roles.
 */
const SEARCH_QUERIES = [
  "creative director",
  "head of design",
  "design director",
  "brand director",
  "creative lead",
  "head of brand",
  "VP design",
  "product designer",
  "senior product designer",
  "UX designer",
  "UI designer",
  "UX researcher",
  "visual designer",
  "interaction designer",
  "motion designer",
  "design systems",
  "art director",
  "graphic designer",
  "design lead",
  "design manager",
  "frontend engineer",
  "frontend developer",
];

/**
 * Scan dribbble.com/jobs for design/creative leadership roles.
 *
 * Dribbble renders SSR HTML job listings. We search by keyword
 * and filter for creative leadership titles.
 */
export async function scanDribbble(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    const url = `https://dribbble.com/jobs?keyword=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Dribbble job cards
    $(
      ".job-listing, [class*='job-card'], .jobs-list-item, article",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el.find("a[href*='/jobs/']").first();
      const href = $link.attr("href") || $el.find("a").first().attr("href");
      const title =
        $link.text().trim() ||
        $el.find("h2, h3, .title, [class*='title']").text().trim();
      const company = $el
        .find(
          ".company, .employer, [class*='company'], [class*='employer']",
        )
        .text()
        .trim();
      const loc = $el
        .find(".location, [class*='location']")
        .text()
        .trim();

      if (!title || !href) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://dribbble.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Remote",
        link: fullLink,
        source: "Dribbble",
      });
    });

    // Fallback: any anchor with /jobs/ path
    $("a[href*='/jobs/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 10 || title.length > 120) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://dribbble.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "Remote",
        link: fullLink,
        source: "Dribbble",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
