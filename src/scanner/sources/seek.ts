import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, ALL_SEARCH_QUERIES } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Search keywords — covers all major job categories.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_,i) => i % 5 === 0);

/**
 * Scan seek.com.au for creative/marketing/brand leadership roles.
 *
 * Seek uses SSR HTML with JSON-LD structured data embedded in the page.
 * We search Sydney + remote roles across multiple keyword queries.
 */
export async function scanSeek(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    const params = new URLSearchParams({
      keywords: query,
      where: "Sydney NSW",
      daterange: String(CUTOFF_DAYS),
      workarrangement: "2", // includes remote/hybrid
    });

    const url = `https://www.seek.com.au/${encodeURIComponent(query).replace(/%20/g, "-")}-jobs/in-All-Sydney-NSW?daterange=${CUTOFF_DAYS}&workarrangement=2`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Seek embeds job data in JSON-LD or data attributes
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "");
        const items = data?.itemListElement || [];
        for (const item of items) {
          const job = item?.item || item;
          const title = job?.title || job?.name;
          const company =
            job?.hiringOrganization?.name || "See listing";
          const loc =
            job?.jobLocation?.address?.addressLocality ||
            job?.jobLocation?.name ||
            "Sydney, NSW";
          const link = job?.url || job?.sameAs;
          const posted = job?.datePosted;

          if (!title || !link) return;

          if (seenLinks.has(link)) return;

          seenLinks.add(link);
          jobs.push({
            title,
            company,
            location: loc,
            link: link.startsWith("http")
              ? link
              : `https://www.seek.com.au${link}`,
            source: "Seek",
            postedAt: posted ? new Date(posted) : undefined,
          });
        }
      } catch {
        // malformed JSON-LD
      }
    });

    // Fallback: HTML job cards
    $("article[data-testid='job-card'], [data-card-type='JobCard']").each(
      (_, el) => {
        const $el = $(el);
        const $link = $el.find("a[href*='/job/']").first();
        const href = $link.attr("href");
        const title =
          $link.text().trim() ||
          $el.find("h3, [data-testid='job-card-title']").text().trim();
        const company = $el
          .find(
            "[data-testid='company-name'], a[href*='/companies/']",
          )
          .text()
          .trim();
        const loc = $el
          .find(
            "[data-testid='job-card-location'], span:contains('Sydney'), span:contains('Remote')",
          )
          .first()
          .text()
          .trim();

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://www.seek.com.au${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Sydney, NSW",
          link: fullLink,
          source: "Seek",
        });
      },
    );

    await sleep(2_000);
  }

  return jobs;
}
