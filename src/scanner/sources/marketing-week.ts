import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan marketingweek.com/jobs for marketing and creative leadership roles.
 *
 * Marketing Week is a leading UK/global marketing trade publication.
 * Their jobs board focuses on senior marketing, brand, and creative roles.
 */
export async function scanMarketingWeek(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const SEARCH_QUERIES = [
    "creative director",
    "head of creative",
    "head of brand",
    "brand director",
    "marketing director",
    "head of marketing",
    "chief marketing officer",
    "CMO",
    "art director",
    "head of design",
    "head of content",
    "head of social",
    "VP marketing",
    "VP brand",
    "executive creative director",
    "group creative director",
  ];

  for (const query of SEARCH_QUERIES) {
    const url = `https://www.marketingweek.com/jobs/?s=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    $(".job-listing, .job, article, [class*='job-item'], .listing").each(
      (_, el) => {
        const $el = $(el);
        const $link = $el.find("a").first();
        const href = $link.attr("href");
        const title =
          $el.find("h2, h3, h4, .title, [class*='title']").first().text().trim() ||
          $link.text().trim();
        const company = $el
          .find(".company, .employer, [class*='company']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find(".location, [class*='location']")
          .first()
          .text()
          .trim();

        if (!title || !href || title.length < 5) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.marketingweek.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "United Kingdom",
          link: fullLink,
          source: "Marketing Week",
        });
      },
    );

    // Fallback
    $("a[href*='/job'], a[href*='/jobs/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 8 || title.length > 120) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://www.marketingweek.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "United Kingdom",
        link: fullLink,
        source: "Marketing Week",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
