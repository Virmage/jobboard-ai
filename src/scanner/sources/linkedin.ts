import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText } from "../utils";

/**
 * Scan LinkedIn guest API for job postings matching the given keywords.
 *
 * The guest API returns server-rendered HTML fragments — no auth required.
 * Results are limited to the past week (f_TPR=r604800).
 */
export async function scanLinkedIn(
  keywords: string,
  location?: string,
  isRemote = true,
): Promise<RawJob[]> {
  const jobs: RawJob[] = [];

  const params = new URLSearchParams({
    keywords,
    start: "0",
    f_TPR: "r604800", // past week
  });

  if (location && !isRemote) {
    params.set("location", location);
  } else {
    params.set("f_WT", "2"); // remote filter
  }

  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;
  const html = await fetchText(url);
  if (!html) return jobs;

  const $ = cheerio.load(html);
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
    }
  });

  return jobs;
}
