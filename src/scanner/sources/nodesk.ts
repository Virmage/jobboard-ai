import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan NoDesk for remote jobs.
 *
 * NoDesk renders SSR HTML with job listing cards.
 * Market: Global/Europe remote.
 * We paginate through the first few pages since the site
 * is already filtered to remote jobs.
 */
export async function scanNoDesk(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? "https://nodesk.co/remote-jobs/"
        : `https://nodesk.co/remote-jobs/page/${page}/`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // NoDesk uses card/list-style job listings
      $(
        "article, " +
        ".job-listing, " +
        "[class*='job-card'], " +
        ".job-item, " +
        "li[class*='job'], " +
        ".card, " +
        "tr"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='nodesk.co/remote-jobs/'], a[href*='/remote-jobs/']").first();
        const href = $titleLink.attr("href") || $el.find("a").first().attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, h4, [class*='title'], td:first-child").first().text().trim();
        const company =
          $el.find("[class*='company'], [class*='employer'], td:nth-child(2)").first().text().trim();
        const location =
          $el.find("[class*='location'], td:nth-child(3)").first().text().trim();

        if (!title || title.length < 3) return;


        // Skip navigation links
        if (href && (href === "/remote-jobs/" || href.match(/\/remote-jobs\/page\//))) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://nodesk.co${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "Remote",
          link: fullLink,
          source: "NoDesk",
        });
      });
    } catch {
      // page parse failure
    }

    await sleep(2_000);
  }

  return jobs;
}
