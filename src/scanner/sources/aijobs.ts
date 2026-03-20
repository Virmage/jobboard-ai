import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership } from "../utils";

/**
 * Scan AIJobs.net for AI/ML/Data Science jobs.
 *
 * AIJobs renders SSR HTML with job listing cards.
 * Market: Global, Categories: AI/ML/Data Science, 31K+ listings.
 * We paginate through the first few pages since no keyword search is needed
 * (all listings are AI-related).
 */
export async function scanAIJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? "https://aijobs.net/"
        : `https://aijobs.net/page/${page}/`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // AIJobs uses article or card-style elements
      $(
        "article, " +
        ".job-listing, " +
        "[class*='job-card'], " +
        ".job-item, " +
        "li[class*='job'], " +
        "tr[class*='job'], " +
        ".card"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='aijobs.net/job/'], a[href*='/job/']").first();
        const href = $titleLink.attr("href") || $el.find("a").first().attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, h4, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='company'], [class*='employer'], .text-muted").first().text().trim();
        const location =
          $el.find("[class*='location']").first().text().trim();

        if (!title || title.length < 3) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://aijobs.net${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "Global",
          link: fullLink,
          source: "AIJobs",
        });
      });
    } catch {
      // page parse failure
    }

    await sleep(2_000);
  }

  return jobs;
}
