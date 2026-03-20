import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of search queries to keep request count reasonable.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

/**
 * Scan Workforce Australia (workforceaustralia.gov.au) for government job listings.
 *
 * Market: Australia
 * Categories: all government
 * Method: HTML scraping
 */
export async function scanWorkforceAU(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        query: query,
        pageSize: "50",
        sortBy: "datePosted",
      });

      const url = `https://www.workforceaustralia.gov.au/individuals/jobs/search?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Job listing cards
      $(
        "[class*='job-card'], [class*='JobCard'], [class*='search-result'], article, [data-testid*='job']",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='employer'], [class*='company'], [class*='business']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location']")
          .first()
          .text()
          .trim();
        const salary = $el
          .find("[class*='salary'], [class*='pay']")
          .first()
          .text()
          .trim();

        if (!title || !href) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.workforceaustralia.gov.au${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Australia",
          link: fullLink,
          source: "Workforce Australia",
          salary: salary || undefined,
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
              location:
                job?.jobLocation?.address?.addressLocality || "Australia",
              link,
              source: "Workforce Australia",
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
