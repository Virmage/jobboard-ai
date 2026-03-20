import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan workatastartup.com (Y Combinator) for job postings.
 *
 * Accepts dynamic search queries. Parses both HTML job cards and
 * JSON-LD structured data with datePosted filtering.
 */
export async function scanYCombinator(
  queries: string[],
): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const q of queries) {
    const encoded = encodeURIComponent(q);
    const html = await fetchText(
      `https://www.workatastartup.com/jobs?query=${encoded}&remote=true`,
    );
    if (!html) {
      await sleep(1_500);
      continue;
    }

    const $ = cheerio.load(html);

    // HTML job cards
    $("a[href*='/jobs/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      if (!href || !href.match(/\/jobs\/\d+/)) return;

      const fullLink = `https://www.workatastartup.com${href}`;
      if (seenLinks.has(fullLink)) return;

      const title =
        $el.find("[class*='title'], h3, h4").text().trim() ||
        $el.text().trim().split("\n")[0].trim();
      const company = $el.find("[class*='company']").text().trim();

      if (title) {
        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "YC Startup",
          location: "Remote",
          link: fullLink,
          source: "YC (Work at a Startup)",
        });
      }
    });

    // JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "");
        if (data?.itemListElement) {
          for (const item of data.itemListElement) {
            if (
              item?.datePosted &&
              !isWithinCutoff(new Date(item.datePosted), CUTOFF_DAYS)
            )
              continue;

            const link =
              item.url || "https://www.workatastartup.com";
            if (seenLinks.has(link)) continue;

            if (item?.name) {
              seenLinks.add(link);
              jobs.push({
                title: item.name,
                company:
                  item.hiringOrganization?.name || "YC Startup",
                location:
                  item.jobLocation?.address?.addressLocality || "Remote",
                link,
                source: "YC (Work at a Startup)",
                postedAt: item.datePosted
                  ? new Date(item.datePosted)
                  : undefined,
              });
            }
          }
        }
      } catch {
        // malformed JSON-LD — skip
      }
    });

    await sleep(1_500);
  }

  return jobs;
}
