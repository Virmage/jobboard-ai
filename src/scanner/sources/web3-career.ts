import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, parseRelativeAge } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan web3.career for job postings matching the given slugs.
 *
 * Each slug maps to a URL like https://web3.career/{slug}-jobs.
 * The site renders SSR HTML tables with relative age cells ("8d", "2mo").
 */
export async function scanWeb3Career(slugs: string[]): Promise<RawJob[]> {
  const jobs: RawJob[] = [];

  for (const slug of slugs) {
    const html = await fetchText(`https://web3.career/${slug}-jobs`);
    if (!html) {
      await sleep(1_000);
      continue;
    }

    const $ = cheerio.load(html);
    $("tr.table_row").each((_, el) => {
      const $el = $(el);
      const $link = $el.find("td:first-child a[href]").first();
      const href = $link.attr("href");
      if (!href) return;

      const title = $el.find("h2").text().trim();
      const company = $el.find("h3").text().trim();
      // Location is typically in the 2nd or 3rd td — grab only the first span with location-like text
      let loc = "Remote";
      $el.find("td").each((i, td) => {
        if (i === 0) return; // skip title cell
        const text = $(td).find("span").first().text().trim();
        if (text && text.length < 50 && !/^\d+\s*(h|d|w|mo|y)$/.test(text)) {
          loc = text;
          return false; // break
        }
      });

      // Parse relative age from table cells (e.g. "8d", "2mo")
      const cells = $el.find("td");
      let ageDays = Infinity;
      cells.each((_, td) => {
        const txt = $(td).text().trim();
        if (/^\d+\s*(h|d|w|mo|y)$/.test(txt)) {
          ageDays = parseRelativeAge(txt);
        }
      });

      if (ageDays > CUTOFF_DAYS) return;

      if (title) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: loc,
          link: href.startsWith("http") ? href : `https://web3.career${href}`,
          source: "web3.career",
        });
      }
    });
    await sleep(1_000);
  }

  return jobs;
}
