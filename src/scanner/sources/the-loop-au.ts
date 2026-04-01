import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan theloop.com.au for Australian creative, advertising, and design roles.
 *
 * The Loop is Australia's premier creative industry job board covering
 * advertising agencies, design studios, and in-house creative teams.
 * Great source for creative director, art director, and head of brand roles.
 */
export async function scanTheLoopAU(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // The Loop's job categories relevant to creative leadership
  const URLS = [
    "https://www.theloop.com.au/jobs/creative-advertising",
    "https://www.theloop.com.au/jobs/design",
    "https://www.theloop.com.au/jobs/marketing",
    "https://www.theloop.com.au/jobs/digital-media",
    "https://www.theloop.com.au/jobs/creative-advertising?page=2",
    "https://www.theloop.com.au/jobs/design?page=2",
  ];

  for (const url of URLS) {
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // The Loop uses card/list layouts for jobs
    $(
      "article, .job-card, .listing, [class*='job-listing'], [class*='job-item']",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el
        .find("a[href*='/job/'], a[href*='/jobs/']")
        .first();
      const href = $link.attr("href") || $el.find("a").first().attr("href");
      const title =
        $link.text().trim() ||
        $el
          .find("h2, h3, h4, .title, [class*='title']")
          .first()
          .text()
          .trim();
      const company = $el
        .find(".company, .employer, [class*='company'], [class*='employer']")
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
        : `https://www.theloop.com.au${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Australia",
        link: fullLink,
        source: "The Loop (AU)",
      });
    });

    // Fallback: scan all job links
    $("a[href*='/job/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 8 || title.length > 120) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://www.theloop.com.au${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "Australia",
        link: fullLink,
        source: "The Loop (AU)",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
