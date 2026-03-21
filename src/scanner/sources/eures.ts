import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, fetchJSON, sleep, ALL_SEARCH_QUERIES } from "../utils";

/**
 * Subset of search queries for the EU portal.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

/**
 * EURES API response shape (if API is available).
 */
interface EuresAPIJob {
  header?: {
    handle?: string;
    dataSourceName?: string;
  };
  body?: {
    label?: string;
    company?: string;
    location?: string;
    description?: string;
  };
  related?: {
    urls?: Array<{ urlValue?: string }>;
  };
}

interface EuresAPIResponse {
  data?: EuresAPIJob[];
  items?: EuresAPIJob[];
  resultList?: EuresAPIJob[];
}

/**
 * Scan the EU Job Mobility Portal (EURES) for job listings.
 *
 * Market: EU/EEA
 * Categories: all
 * Method: Try EURES REST API first, fall back to HTML scraping
 */
export async function scanEures(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    // Try the EURES search API endpoint first
    for (const query of SEARCH_QUERIES) {
      const apiUrl = `https://eures.europa.eu/api/v2/jv-search?keyword=${encodeURIComponent(query)}&page=1&resultsPerPage=50&sortBy=MOST_RECENT`;
      const apiData = await fetchJSON<EuresAPIResponse>(apiUrl);

      if (apiData) {
        const items = apiData.data || apiData.items || apiData.resultList || [];
        for (const item of items) {
          const title = item.body?.label || "";


          const handle = item.header?.handle || "";
          const link = handle
            ? `https://eures.europa.eu/eures-services/eures-job-search/jv-se/${handle}`
            : "";
          if (!link || seenLinks.has(link)) continue;

          seenLinks.add(link);
          jobs.push({
            title,
            company: item.body?.company || "See listing",
            location: item.body?.location || "EU/EEA",
            link,
            source: "EURES",
            description: item.body?.description?.slice(0, 500),
          });
        }
        await sleep(2_000);
        continue;
      }

      // Fallback: HTML scraping of the search results page
      const params = new URLSearchParams({
        keyword: query,
        page: "1",
        resultsPerPage: "50",
        sortBy: "MOST_RECENT",
      });

      const url = `https://eures.europa.eu/eures-services/eures-job-search_en?${params}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(3_000);
        continue;
      }

      const $ = cheerio.load(html);

      // EURES renders job cards in list items or article blocks
      $(
        "[class*='job-result'], [class*='search-result'], article, .ecl-list-item, [class*='vacancy']",
      ).each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='job-search'], a[href*='jv-se'], a[href*='vacancy']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company = $el
          .find("[class*='company'], [class*='employer'], [class*='organisation']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location'], [class*='country']")
          .first()
          .text()
          .trim();

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://eures.europa.eu${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "EU/EEA",
          link: fullLink,
          source: "EURES",
        });
      });

      await sleep(3_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
