import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, fetchJSON, sleep, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of search queries for the Singapore government portal.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

interface CareersGovSGJob {
  title?: string;
  organisationName?: string;
  location?: string;
  url?: string;
  id?: string;
  closingDate?: string;
  postingDate?: string;
  salary?: string;
}

interface CareersGovSGResponse {
  jobs?: CareersGovSGJob[];
  data?: CareersGovSGJob[];
  results?: CareersGovSGJob[];
}

/**
 * Scan Singapore Government Careers (careers.gov.sg) for job listings.
 *
 * Market: Singapore
 * Categories: government
 * Method: Try API first, fall back to HTML scraping
 */
export async function scanCareersGovSG(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      // Try the API endpoint first
      const apiUrl = `https://www.careers.gov.sg/api/job-search?keyword=${encodeURIComponent(query)}&page=1&pageSize=50`;
      const apiData = await fetchJSON<CareersGovSGResponse>(apiUrl);

      if (apiData) {
        const items = apiData.jobs || apiData.data || apiData.results || [];
        for (const item of items) {
          const title = item.title || "";


          const link = item.url || (item.id ? `https://www.careers.gov.sg/job/${item.id}` : "");
          if (!link || seenLinks.has(link)) continue;

          seenLinks.add(link);
          jobs.push({
            title,
            company: item.organisationName || "Singapore Government",
            location: item.location || "Singapore",
            link,
            source: "Careers.gov.sg",
            salary: item.salary || undefined,
            postedAt: item.postingDate ? new Date(item.postingDate) : undefined,
          });
        }
        await sleep(2_000);
        continue;
      }

      // Fallback: HTML scraping
      const url = `https://www.careers.gov.sg/search?q=${encodeURIComponent(query)}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      $(
        "[class*='job-card'], [class*='search-result'], [class*='listing'], article",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/'], a[href*='/posting/'], a[href*='careers.gov']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, h4, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='ministry'], [class*='agency'], [class*='organisation'], [class*='org']")
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


        const fullLink = href.startsWith("http")
          ? href
          : `https://www.careers.gov.sg${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Singapore Government",
          location: loc || "Singapore",
          link: fullLink,
          source: "Careers.gov.sg",
          salary: salary || undefined,
        });
      });

      // JSON-LD fallback
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = Array.isArray(data) ? data : [data];
          for (const job of items) {
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;


            const link = job?.url;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "Singapore Government",
              location: job?.jobLocation?.address?.addressLocality || "Singapore",
              link,
              source: "Careers.gov.sg",
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
