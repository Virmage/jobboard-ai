import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of queries for Monster's global job board.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

/**
 * Scan Monster.com for job listings across 40+ countries.
 *
 * Market: global
 * Categories: all
 * Method: HTML scraping
 */
export async function scanMonster(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        q: query,
        where: "",
        page: "1",
        so: "m.h.s", // sort by date
      });

      const url = `https://www.monster.com/jobs/search?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Monster renders job cards in various container formats
      $(
        "[data-testid='svx-job-card'], .job-cardstyle, [class*='job-card'], [class*='JobCard'], [class*='search-result'], article",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job-openings/'], a[href*='/jobs/'], a[href*='monster.com']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, [class*='title'], [data-testid*='title']").first().text().trim();
        const company = $el
          .find("[data-testid='company'], [class*='company'], .company-name")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[data-testid='location'], [class*='location']")
          .first()
          .text()
          .trim();
        const salary = $el
          .find("[class*='salary'], [data-testid*='salary']")
          .first()
          .text()
          .trim();
        const dateText = $el
          .find("[class*='date'], [data-testid*='date'], time")
          .first()
          .text()
          .trim();

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://www.monster.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Global",
          link: fullLink,
          source: "Monster",
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


            const link = job?.url;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location: job?.jobLocation?.address?.addressLocality || "Global",
              link,
              source: "Monster",
              salary: job?.baseSalary?.value
                ? `${job.baseSalary.currency || "USD"} ${job.baseSalary.value}`
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
