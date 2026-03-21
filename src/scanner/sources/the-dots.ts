import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan the-dots.com/jobs for UK creative/design/marketing roles.
 *
 * The Dots is a UK creative industry professional network with a job board.
 * We search their listings page and filter for matching titles.
 */
export async function scanTheDots(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const SEARCH_QUERIES = [
    "creative director",
    "head of creative",
    "brand director",
    "head of brand",
    "marketing director",
    "head of design",
    "product designer",
    "UX designer",
    "design lead",
    "content director",
    "social media manager",
    "copywriter",
    "art director",
    "head of marketing",
    "head of content",
    "graphic designer",
    "marketing manager",
    "community manager",
    "product manager",
    "software engineer",
    "frontend developer",
  ];

  for (const query of SEARCH_QUERIES) {
    const url = `https://the-dots.com/jobs/search?q=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // The Dots job cards
    $(
      ".job-card, [class*='job-listing'], article, .card",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el
        .find("a[href*='/jobs/'], a[href*='/job/']")
        .first();
      const href = $link.attr("href") || $el.find("a").first().attr("href");
      const title =
        $link.text().trim() ||
        $el.find("h2, h3, h4, .title, [class*='title']").text().trim();
      const company = $el
        .find(
          ".company, .employer, [class*='company'], [class*='organisation']",
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
        : `https://the-dots.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "United Kingdom",
        link: fullLink,
        source: "The Dots",
      });
    });

    // Fallback: broad link scan
    $("a[href*='/jobs/'], a[href*='/job/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 10 || title.length > 120) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://the-dots.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "United Kingdom",
        link: fullLink,
        source: "The Dots",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
