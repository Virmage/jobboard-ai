import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, parseRelativeAge, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan cryptocurrencyjobs.co for job postings in the given categories.
 *
 * Each category maps to https://cryptocurrencyjobs.co/{category}/.
 * The site renders SSR HTML with li.grid job cards.
 */
export async function scanCryptoJobs(
  categories: string[],
): Promise<RawJob[]> {
  const jobs: RawJob[] = [];

  for (const cat of categories) {
    const html = await fetchText(`https://cryptocurrencyjobs.co/${cat}/`);
    if (!html) {
      await sleep(1_000);
      continue;
    }

    const $ = cheerio.load(html);
    $("li.grid").each((_, el) => {
      const $el = $(el);
      const $titleLink = $el.find("h2 a").first();
      const href = $titleLink.attr("href");
      if (!href) return;

      const title = $titleLink.text().trim();
      const company = $el.find("h3").text().trim();
      const loc = $el.find("h4 a").first().text().trim() || "Remote";

      // Check for date via <time> element or relative text
      const timeEl = $el.find("time").attr("datetime");
      const relText = $el.find("time").text().trim() || $el.text();
      let withinCutoff = true; // default: include if no date info found

      if (timeEl) {
        withinCutoff = isWithinCutoff(new Date(timeEl), CUTOFF_DAYS);
      } else {
        const ageMatch = relText.match(
          /(\d+)\s*(h|d|w|mo|month|y)\w*\s*ago/i,
        );
        if (ageMatch) {
          const ageDays = parseRelativeAge(`${ageMatch[1]}${ageMatch[2]}`);
          withinCutoff = ageDays <= CUTOFF_DAYS;
        }
      }

      if (!withinCutoff) return;

      if (title) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: loc,
          link: href.startsWith("http")
            ? href
            : `https://cryptocurrencyjobs.co${href}`,
          source: "cryptocurrencyjobs.co",
        });
      }
    });
    await sleep(1_000);
  }

  return jobs;
}
