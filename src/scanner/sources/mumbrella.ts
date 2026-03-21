import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan mumbrella.com.au/jobs for marketing/creative leadership roles.
 *
 * Mumbrella is an Australian marketing and media industry site.
 * Their jobs section lists marketing, media, and creative roles.
 */
export async function scanMumbrella(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Mumbrella jobs listing pages
  const urls = [
    "https://mumbrella.com.au/jobs",
    "https://mumbrella.com.au/jobs?page=2",
  ];

  for (const url of urls) {
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Job listing cards
    $(
      "article, .job-listing, .job-card, [class*='job-item'], .listing",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el
        .find("a[href*='/job'], a[href*='/jobs/']")
        .first();
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
        : `https://mumbrella.com.au${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Australia",
        link: fullLink,
        source: "Mumbrella",
      });
    });

    // Fallback: scan all links
    $("a[href*='/job']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 10 || title.length > 120) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://mumbrella.com.au${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "Australia",
        link: fullLink,
        source: "Mumbrella",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
