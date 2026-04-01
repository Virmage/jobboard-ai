import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan thedrum.com/jobs for advertising, creative, and marketing leadership roles.
 *
 * The Drum is a global advertising/marketing trade publication with a
 * substantial jobs board covering creative director, head of brand,
 * art director, and similar senior creative/marketing roles.
 */
export async function scanTheDrum(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const SEARCH_QUERIES = [
    "creative director",
    "head of creative",
    "executive creative director",
    "chief creative officer",
    "head of brand",
    "brand director",
    "art director",
    "head of marketing",
    "marketing director",
    "head of design",
    "strategy director",
    "head of content",
    "head of social",
    "group creative director",
    "VP creative",
    "VP brand",
  ];

  for (const query of SEARCH_QUERIES) {
    const url = `https://www.thedrum.com/jobs/search?q=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Try multiple possible selectors
    $(".job-listing, .job-card, article, [class*='job'], .listing-item").each(
      (_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job'], a[href*='/jobs/']").first();
        const href = $link.attr("href") || $el.find("a").first().attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, .title, [class*='title']").first().text().trim();
        const company = $el
          .find(".company, .employer, [class*='company'], [class*='employer']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find(".location, [class*='location'], [class*='place']")
          .first()
          .text()
          .trim();

        if (!title || !href || title.length < 5) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.thedrum.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Global",
          link: fullLink,
          source: "The Drum",
        });
      },
    );

    // Fallback: any link containing /job/
    $("a[href*='/job/'], a[href*='/jobs/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 8 || title.length > 120) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://www.thedrum.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "Global",
        link: fullLink,
        source: "The Drum",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
