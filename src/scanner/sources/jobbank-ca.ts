import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of search queries to avoid excessive requests against the government portal.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

/**
 * Scan the Canadian Government Job Bank (jobbank.gc.ca) for job listings.
 *
 * Market: Canada
 * Categories: all
 * Method: HTML scraping of public government data
 */
export async function scanJobBankCA(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        searchstring: query,
        sort: "D", // sort by date
      });

      const url = `https://www.jobbank.gc.ca/jobsearch/jobsearch?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Job Bank lists results in article elements or result blocks
      $("article.resultJob, .results-jobs article, [class*='result']").each(
        (_, el) => {
          const $el = $(el);
          const $link = $el.find("a[href*='/jobposting/'], a[href*='/fl/']").first();
          const href = $link.attr("href");
          const title =
            $link.text().trim() ||
            $el.find(".noctitle, .resultJobItem h3, h3").first().text().trim();
          const company = $el
            .find(".business, .employer, [class*='company'], [class*='employer']")
            .first()
            .text()
            .trim();
          const loc = $el
            .find(".location, [class*='location']")
            .first()
            .text()
            .trim();
          const salary = $el
            .find(".salary, [class*='salary']")
            .first()
            .text()
            .trim();

          if (!title || !href) return;


          const fullLink = href.startsWith("http")
            ? href
            : `https://www.jobbank.gc.ca${href}`;
          if (seenLinks.has(fullLink)) return;

          seenLinks.add(fullLink);
          jobs.push({
            title,
            company: company || "See listing",
            location: loc || "Canada",
            link: fullLink,
            source: "Job Bank Canada",
            salary: salary || undefined,
          });
        },
      );

      // Also try JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = Array.isArray(data) ? data : data?.itemListElement || [data];
          for (const item of items) {
            const job = item?.item || item;
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;


            const link = job?.url || job?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location:
                job?.jobLocation?.address?.addressLocality || "Canada",
              link,
              source: "Job Bank Canada",
              salary: job?.baseSalary?.value
                ? `${job.baseSalary.currency || "CAD"} ${job.baseSalary.value}`
                : undefined,
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip malformed JSON-LD
        }
      });

      await sleep(3_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
