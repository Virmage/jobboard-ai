import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, fetchJSON, sleep } from "../utils";

/**
 * Scan creativepool.com/jobs for creative and advertising roles.
 *
 * Creativepool is a global platform for creative professionals.
 * Strong in advertising, design, and creative leadership roles.
 */

interface CreativepoolJob {
  id?: number | string;
  title?: string;
  company_name?: string;
  company?: { name?: string };
  location?: string;
  url?: string;
  job_url?: string;
  salary?: string;
}

export async function scanCreativepool(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const SEARCH_TERMS = [
    "creative director",
    "executive creative director",
    "head of creative",
    "group creative director",
    "art director",
    "head of brand",
    "brand director",
    "chief creative officer",
    "VP creative",
    "head of design",
    "marketing director",
  ];

  for (const term of SEARCH_TERMS) {
    // Try API endpoint first
    try {
      const apiUrl = `https://creativepool.com/api/jobs/search?q=${encodeURIComponent(term)}&per_page=50`;
      const data = await fetchJSON<{ data?: CreativepoolJob[]; jobs?: CreativepoolJob[] }>(apiUrl);
      const items = data?.data || data?.jobs || [];

      for (const job of items) {
        const title = job.title || "";
        if (!title) continue;

        const company = job.company_name || job.company?.name || "See listing";
        const link = job.url || job.job_url || `https://creativepool.com/jobs`;
        if (seenLinks.has(link)) continue;

        seenLinks.add(link);
        jobs.push({
          title,
          company,
          location: job.location || "Global",
          link,
          source: "Creativepool",
          salary: job.salary,
        });
      }

      if (items.length > 0) {
        await sleep(1_500);
        continue;
      }
    } catch {
      // Fall through to HTML scraping
    }

    // HTML scraping fallback
    const url = `https://creativepool.com/jobs/search?keywords=${encodeURIComponent(term)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(1_500);
      continue;
    }

    const $ = cheerio.load(html);

    $(".job-listing, .job-card, article, [class*='job'], .listing").each(
      (_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/jobs/']").first();
        const href = $link.attr("href") || $el.find("a").first().attr("href");
        const title =
          $el.find("h2, h3, .title, [class*='title']").first().text().trim() ||
          $link.text().trim();
        const company = $el
          .find(".company, .employer, [class*='company']")
          .first()
          .text()
          .trim();
        const loc = $el
          .find(".location, [class*='location']")
          .first()
          .text()
          .trim();

        if (!title || !href || title.length < 5) return;

        const fullLink = href.startsWith("http")
          ? href
          : `https://creativepool.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Global",
          link: fullLink,
          source: "Creativepool",
        });
      },
    );

    await sleep(1_500);
  }

  return jobs;
}
