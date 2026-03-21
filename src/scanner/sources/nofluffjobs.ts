import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, fetchJSON, sleep } from "../utils";

/**
 * No Fluff Jobs API response shape.
 */
interface NFJPosting {
  id?: string;
  name?: string;
  title?: string;
  company?: { name?: string };
  location?: { places?: Array<{ city?: string; country?: { code?: string } }> };
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    type?: string;
  };
  posted?: number; // unix timestamp ms
  url?: string;
  technology?: string;
  seniority?: string[];
}

interface NFJResponse {
  postings?: NFJPosting[];
  totalCount?: number;
  totalPages?: number;
}

/**
 * Scan No Fluff Jobs for tech roles in Poland/Eastern Europe.
 *
 * Market: Poland/Eastern Europe
 * Categories: tech (salary transparency)
 * Method: Try API first, fall back to HTML scraping
 */
export async function scanNoFluffJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  try {
    // Try the public API first
    for (let page = 1; page <= 5; page++) {
      const apiUrl = `https://nofluffjobs.com/api/posting?page=${page}`;
      const apiData = await fetchJSON<NFJResponse>(apiUrl);

      if (apiData?.postings?.length) {
        for (const posting of apiData.postings) {
          const title = posting.title || posting.name || "";


          const id = posting.id || "";
          if (!id || seenIds.has(id)) continue;

          const location = posting.location?.places
            ?.map((p) => [p.city, p.country?.code].filter(Boolean).join(", "))
            .join(" | ") || "Poland";

          let salary: string | undefined;
          if (posting.salary?.from && posting.salary?.to) {
            salary = `${posting.salary.currency || "PLN"} ${posting.salary.from}-${posting.salary.to} ${posting.salary.type || ""}`.trim();
          }

          seenIds.add(id);
          jobs.push({
            title,
            company: posting.company?.name || "See listing",
            location,
            link: posting.url || `https://nofluffjobs.com/job/${id}`,
            source: "No Fluff Jobs",
            salary,
            postedAt: posting.posted ? new Date(posting.posted) : undefined,
            description: [posting.technology, ...(posting.seniority || [])].filter(Boolean).join(", ") || undefined,
          });
        }
        await sleep(2_000);
        continue;
      }

      // Fallback: HTML scraping
      const url =
        page === 1
          ? "https://nofluffjobs.com/"
          : `https://nofluffjobs.com/?page=${page}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      const $ = cheerio.load(html);

      // No Fluff Jobs renders postings in list items with salary info
      $(
        "[class*='posting-list-item'], [class*='job-card'], [class*='list-item'], nfj-posting-item, a[href*='/job/']",
      ).each((_, el) => {
        const $el = $(el);
        let href = $el.is("a") ? $el.attr("href") : null;
        let title = "";

        if (href) {
          title = $el.find("h3, h4, [class*='title']").first().text().trim();
        } else {
          const $link = $el.find("a[href*='/job/']").first();
          href = $link.attr("href") || null;
          title = $link.text().trim() ||
            $el.find("h3, h4, [class*='title']").first().text().trim();
        }

        const company = $el
          .find("[class*='company'], [class*='employer']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location'], [class*='city']")
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
          : `https://nofluffjobs.com${href}`;
        if (seenIds.has(fullLink)) return;

        seenIds.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Poland",
          link: fullLink,
          source: "No Fluff Jobs",
          salary: salary || undefined,
        });
      });

      await sleep(2_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
