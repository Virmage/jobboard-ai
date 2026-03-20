import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan builtin.com for job postings at the given paths.
 *
 * Each path maps to https://builtin.com{path}?posted=14.
 * Parses JSON-LD structured data first, then falls back to HTML cards.
 */
export async function scanBuiltIn(paths: string[]): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const path of paths) {
    const html = await fetchText(
      `https://builtin.com${path}?posted=${CUTOFF_DAYS}`,
    );
    if (!html) {
      await sleep(1_000);
      continue;
    }

    const $ = cheerio.load(html);

    // JSON-LD first
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "");
        const items =
          data?.itemListElement || data?.about?.itemListElement || [];
        for (const item of items) {
          const name = item?.item?.name || item?.name;
          const url = item?.item?.url || item?.url;
          const posted = item?.item?.datePosted || item?.datePosted;

          if (posted && !isWithinCutoff(new Date(posted), CUTOFF_DAYS))
            continue;

          if (!name) continue;

          const fullLink = url?.startsWith("http")
            ? url
            : `https://builtin.com${url}`;
          if (seenLinks.has(fullLink)) continue;

          seenLinks.add(fullLink);
          jobs.push({
            title: name,
            company: "See listing",
            location: "Remote",
            link: fullLink,
            source: "BuiltIn",
            postedAt: posted ? new Date(posted) : undefined,
          });
        }
      } catch {
        // malformed JSON-LD — skip
      }
    });

    // Fallback: HTML job cards
    $("a[href*='/job/']").each((_, el) => {
      const $el = $(el);
      const title = $el.find("[class*='title'], h2").text().trim();
      const company = $el.find("[class*='company']").text().trim();
      const href = $el.attr("href");

      if (!title || !href) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://builtin.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: "Remote",
        link: fullLink,
        source: "BuiltIn",
      });
    });

    await sleep(1_000);
  }

  return jobs;
}
