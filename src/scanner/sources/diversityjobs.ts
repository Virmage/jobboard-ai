import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of queries for diversity-focused job board.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

/**
 * Scan DiversityJobs.com for diversity-focused job listings.
 *
 * Market: US
 * Categories: all (diversity-focused)
 * Method: HTML scraping
 */
export async function scanDiversityJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const url = `https://www.diversityjobs.com/jobs?q=${encodeURIComponent(query)}&sort=date`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // DiversityJobs job listing cards
      $(
        ".job-listing, .job-result, [class*='job-card'], [class*='search-result'], article, .listing-item",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/jobs/'], a[href*='career']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='company'], [class*='employer'], .company-name")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location']")
          .first()
          .text()
          .trim();
        const dateText = $el
          .find("[class*='date'], [class*='posted'], time")
          .first()
          .text()
          .trim();

        if (!title || !href) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.diversityjobs.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "United States",
          link: fullLink,
          source: "DiversityJobs",
          postedAt: dateText ? new Date(dateText) : undefined,
        });
      });

      // JSON-LD fallback
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = Array.isArray(data) ? data : data?.itemListElement || [data];
          for (const item of items) {
            const job = item?.item || item;
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;
            if (!title || !titleMatchesCreativeLeadership(title)) continue;

            const link = job?.url;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location: job?.jobLocation?.address?.addressLocality || "United States",
              link,
              source: "DiversityJobs",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip
        }
      });

      await sleep(3_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
