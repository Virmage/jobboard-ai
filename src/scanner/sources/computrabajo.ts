import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Computrabajo country configs for Latin America.
 */
const COUNTRIES = [
  { domain: "www.computrabajo.com", country: "Spain/LATAM", path: "" },
  { domain: "www.computrabajo.com.mx", country: "Mexico", path: "" },
  { domain: "www.computrabajo.com.co", country: "Colombia", path: "" },
  { domain: "co.computrabajo.com", country: "Colombia", path: "" },
  { domain: "www.computrabajo.com.pe", country: "Peru", path: "" },
  { domain: "www.computrabajo.com.ar", country: "Argentina", path: "" },
  { domain: "www.computrabajo.cl", country: "Chile", path: "" },
] as const;

/**
 * Scan Computrabajo for Latin American job listings.
 *
 * Computrabajo renders SSR HTML with job result cards.
 * Market: Latin America (20+ countries), largest LATAM board.
 */
export async function scanComputrabajo(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Smaller subset since we scan multiple countries
  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 6 === 0);

  for (const { domain, country } of COUNTRIES) {
    for (const query of queries) {
      const url = `https://${domain}/trabajo-de-${encodeURIComponent(query).replace(/%20/g, "-")}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      try {
        const $ = cheerio.load(html);

        // Computrabajo uses box_offer or similar card elements
        $(
          ".box_offer, " +
          "[class*='oferta'], " +
          ".cm-offer, " +
          "article.iO, " +
          "div[class*='job_item'], " +
          ".bRS"
        ).each((_, el) => {
          const $el = $(el);
          const $titleLink = $el.find("a[href*='/ofertas-de-trabajo/'], a[href*='/oferta-de-trabajo/'], a[class*='title']").first();
          const href = $titleLink.attr("href");
          const title =
            $titleLink.text().trim() ||
            $el.find("h2, h3, [class*='title']").first().text().trim();
          const company =
            $el.find("[class*='company'], [class*='empresa'], .fs16, a[href*='/empresa/']").first().text().trim();
          const location =
            $el.find("[class*='location'], [class*='ubicacion'], .fs13").first().text().trim();

          if (!title) return;
          if (!titleMatchesCreativeLeadership(title)) return;

          const fullLink = href
            ? href.startsWith("http")
              ? href
              : `https://${domain}${href}`
            : undefined;
          if (!fullLink || seenLinks.has(fullLink)) return;

          seenLinks.add(fullLink);
          jobs.push({
            title,
            company: company || "See listing",
            location: location || country,
            link: fullLink,
            source: `Computrabajo (${country})`,
          });
        });
      } catch {
        // page parse failure
      }

      await sleep(2_000);
    }
  }

  return jobs;
}
