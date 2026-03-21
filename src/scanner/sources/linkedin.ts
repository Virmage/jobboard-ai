import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/** LinkedIn guest API page size (returns ~10 results per page). */
const PAGE_SIZE = 10;

/** Max pages to paginate through per keyword query (5 × 10 = 50 results). */
const MAX_PAGES = 5;

/** Delay between page requests to avoid rate limiting (ms). */
const PAGE_DELAY_MS = 2_000;

/** Per-source timeout — abort pagination if we exceed this (ms). */
const SOURCE_TIMEOUT_MS = 60_000;

/**
 * Scan LinkedIn guest API for job postings matching the given keywords.
 *
 * The guest API returns server-rendered HTML fragments — no auth required.
 * Results are limited to the past week (f_TPR=r604800).
 *
 * Paginates through up to {@link MAX_PAGES} pages (start=0, 10, 20, …)
 * to collect up to 50 results per keyword query.
 */
export async function scanLinkedIn(
  keywords: string,
  location?: string,
  isRemote = true,
): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const startedAt = Date.now();

  for (let page = 0; page < MAX_PAGES; page++) {
    // Check per-source timeout before each page fetch
    if (Date.now() - startedAt > SOURCE_TIMEOUT_MS) {
      console.log(
        `  LinkedIn: timeout reached after ${page} pages, returning ${jobs.length} jobs`,
      );
      break;
    }

    // Add delay between pages (skip delay for the first page)
    if (page > 0) {
      await sleep(PAGE_DELAY_MS);
    }

    const params = new URLSearchParams({
      keywords,
      start: String(page * PAGE_SIZE),
      f_TPR: "r604800", // past week
    });

    if (location && !isRemote) {
      params.set("location", location);
    } else {
      params.set("f_WT", "2"); // remote filter
    }

    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;
    const html = await fetchText(url);
    if (!html) break;

    const $ = cheerio.load(html);
    let pageCount = 0;
    $("li").each((_, el) => {
      const title = $(el).find("h3.base-search-card__title").text().trim();
      const company = $(el)
        .find("h4.base-search-card__subtitle a")
        .text()
        .trim();
      const loc = $(el).find("span.job-search-card__location").text().trim();
      const link = $(el)
        .find("a.base-card__full-link")
        .attr("href")
        ?.split("?")[0];

      if (title && company && link) {
        jobs.push({
          title,
          company,
          location: loc || (isRemote ? "Remote" : location ?? "Unknown"),
          link,
          source: "LinkedIn",
        });
        pageCount++;
      }
    });

    // If we got fewer results than a full page, there are no more pages
    if (pageCount < PAGE_SIZE) break;
  }

  return jobs;
}
