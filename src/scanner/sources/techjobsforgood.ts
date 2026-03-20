import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership } from "../utils";

/**
 * Scan Tech Jobs for Good for tech roles at nonprofits and social impact orgs.
 *
 * Market: US/global
 * Categories: tech at nonprofits
 * Method: HTML scraping
 *
 * This is a smaller board so we scrape the main listing pages directly
 * rather than iterating through many search queries.
 */
export async function scanTechJobsForGood(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    // Scrape first few pages of listings
    for (let page = 1; page <= 5; page++) {
      const url =
        page === 1
          ? "https://techjobsforgood.com/"
          : `https://techjobsforgood.com/?page=${page}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Tech Jobs for Good lists jobs in card/list format
      $(
        ".job-listing, .job-card, [class*='job-item'], [class*='listing'], article, .card, tr",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/listing/'], a[href*='/jobs/']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, [class*='title'], .job-title").first().text().trim();
        const company = $el
          .find("[class*='company'], [class*='org'], .company-name, .organization")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location']")
          .first()
          .text()
          .trim();

        if (!title || !href) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://techjobsforgood.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "United States",
          link: fullLink,
          source: "Tech Jobs for Good",
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
              source: "Tech Jobs for Good",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip
        }
      });

      await sleep(2_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
