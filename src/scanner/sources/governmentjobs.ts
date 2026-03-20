import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of queries for US state/local government jobs.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

/**
 * Scan GovernmentJobs.com for US state and local government positions.
 *
 * Market: US
 * Categories: state/local government
 * Method: HTML scraping
 */
export async function scanGovernmentJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        keyword: query,
        sort: "PostDate%7CDescending",
      });

      const url = `https://www.governmentjobs.com/jobs?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // GovernmentJobs renders job cards in list items
      $(
        ".job-listing, .search-result-item, [class*='job-item'], [class*='job-result'], tr[class*='job'], .item",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h3, h4, .job-title, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='agency'], [class*='department'], [class*='employer'], .agency-name")
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
        const dateText = $el
          .find("[class*='date'], [class*='posted'], time")
          .first()
          .text()
          .trim();

        if (!title || !href) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://www.governmentjobs.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Government Agency",
          location: loc || "United States",
          link: fullLink,
          source: "GovernmentJobs",
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
              company: job?.hiringOrganization?.name || "Government Agency",
              location: job?.jobLocation?.address?.addressLocality || "United States",
              link,
              source: "GovernmentJobs",
              salary: job?.baseSalary?.value
                ? `$${job.baseSalary.value}`
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
