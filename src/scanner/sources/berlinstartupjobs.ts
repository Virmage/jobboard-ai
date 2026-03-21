import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan Berlin Startup Jobs for Berlin/Germany startup roles.
 *
 * Berlin Startup Jobs renders SSR HTML with job listing cards.
 * Market: Berlin/Germany, Categories: startup roles.
 * All listings are Berlin-based, so we paginate through recent postings.
 */
export async function scanBerlinStartupJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? "https://berlinstartupjobs.com/"
        : `https://berlinstartupjobs.com/page/${page}/`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Berlin Startup Jobs uses WordPress-style post listings
      $(
        "article, " +
        ".bsj-job, " +
        "[class*='job-listing'], " +
        ".post, " +
        ".entry, " +
        "li[class*='job']"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='berlinstartupjobs.com/']").first();
        const href = $titleLink.attr("href") || $el.find("h2 a, h3 a").first().attr("href");
        const title =
          $el.find("h2, h3, h4, .entry-title, [class*='title']").first().text().trim() ||
          $titleLink.text().trim();
        const company =
          $el.find("[class*='company'], .entry-company, [class*='startup']").first().text().trim();
        const location =
          $el.find("[class*='location']").first().text().trim();
        const tags =
          $el.find("[class*='tag'], [class*='category']").text().trim();

        if (!title || title.length < 3) return;


        // Skip pagination and category links
        if (href && href.match(/\/page\/|\/category\//)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://berlinstartupjobs.com${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Berlin Startup",
          location: location || "Berlin, Germany",
          link: fullLink,
          source: "Berlin Startup Jobs",
        });
      });
    } catch {
      // page parse failure
    }

    await sleep(2_000);
  }

  return jobs;
}
