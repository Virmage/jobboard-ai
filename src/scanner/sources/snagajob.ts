import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of queries relevant to hourly/retail/hospitality work.
 * We include broader queries too since the board covers many categories.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

/**
 * Scan Snagajob for hourly work listings.
 *
 * Market: US
 * Categories: retail/hospitality/hourly
 * Method: HTML scraping
 */
export async function scanSnagajob(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        q: query,
        radius: "50",
        sort: "date",
      });

      const url = `https://www.snagajob.com/jobs?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Snagajob renders job cards in list/card format
      $(
        ".job-listing, [class*='job-card'], [class*='JobCard'], [class*='search-result'], [class*='listing-card'], article",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/jobs/'], a[href*='snagajob']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, [class*='title'], [data-testid*='title']").first().text().trim();
        const company = $el
          .find("[class*='company'], [class*='employer'], [data-testid*='company']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location'], [data-testid*='location']")
          .first()
          .text()
          .trim();
        const salary = $el
          .find("[class*='salary'], [class*='pay'], [class*='wage'], [data-testid*='pay']")
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
          : `https://www.snagajob.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "United States",
          link: fullLink,
          source: "Snagajob",
          salary: salary || undefined,
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
              source: "Snagajob",
              salary: job?.baseSalary?.value
                ? `$${job.baseSalary.value}/hr`
                : undefined,
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
