import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership } from "../utils";

/**
 * Search queries — creative, design, marketing, and arts roles.
 */
const SEARCH_QUERIES = [
  "creative director",
  "head of creative",
  "brand director",
  "marketing director",
  "head of design",
  "product designer",
  "UX designer",
  "graphic designer",
  "art director",
  "copywriter",
  "content director",
  "social media manager",
  "community manager",
  "marketing manager",
  "design lead",
  "head of marketing",
  "head of content",
  "visual designer",
  "communications manager",
];

/**
 * Scan artshub.com.au/jobs for creative leadership roles.
 *
 * ArtsHub is an Australian arts/creative industry job board.
 * We search their job listings and filter for leadership titles.
 */
export async function scanArtsHub(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    const url = `https://www.artshub.com.au/jobs/?q=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // ArtsHub job cards
    $(
      "article.job-listing, .job-card, .listing-item, [class*='job'], .search-result",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
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
      if (!titleMatchesCreativeLeadership(title)) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://www.artshub.com.au${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Australia",
        link: fullLink,
        source: "ArtsHub",
      });
    });

    // Fallback: any link with job-like hrefs
    if (jobs.length === 0) {
      $("a[href*='/job']").each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href");
        const title = $el.text().trim();

        if (!title || !href || title.length < 10 || title.length > 120) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.artshub.com.au${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: "See listing",
          location: "Australia",
          link: fullLink,
          source: "ArtsHub",
        });
      });
    }

    await sleep(2_000);
  }

  return jobs;
}
