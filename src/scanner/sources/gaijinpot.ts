import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of queries relevant to English-speaking roles in Japan.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

/**
 * Scan GaijinPot Jobs for English-speaking roles in Japan.
 *
 * Market: Japan
 * Categories: English-speaking roles
 * Method: HTML scraping
 */
export async function scanGaijinPot(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const url = `https://jobs.gaijinpot.com/index/search?keyword=${encodeURIComponent(query)}&sort=date`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // GaijinPot renders job listings in table rows or card divs
      $(
        ".job-listing, .job-row, [class*='job-card'], [class*='search-result'], article, tr.job, .listing",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/view/'], a[href*='gaijinpot']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, .title, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='company'], [class*='employer'], .company")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location'], .location")
          .first()
          .text()
          .trim();
        const salary = $el
          .find("[class*='salary'], [class*='pay']")
          .first()
          .text()
          .trim();

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://jobs.gaijinpot.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Japan",
          link: fullLink,
          source: "GaijinPot",
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


            const link = job?.url;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location: job?.jobLocation?.address?.addressLocality || "Japan",
              link,
              source: "GaijinPot",
              salary: job?.baseSalary?.value
                ? `JPY ${job.baseSalary.value}`
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
