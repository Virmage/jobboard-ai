import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan Japan Dev for software engineering roles in Japan.
 *
 * Market: Japan
 * Categories: software engineering
 * Method: HTML scraping
 *
 * Japan Dev is a smaller, curated board focused on developer roles in Japan.
 * We scrape the main job listing pages directly.
 */
export async function scanJapanDev(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  try {
    // Scrape the main jobs page and a few paginated pages
    for (let page = 1; page <= 5; page++) {
      const url =
        page === 1
          ? "https://japan-dev.com/jobs"
          : `https://japan-dev.com/jobs?page=${page}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      const $ = cheerio.load(html);

      // Japan Dev typically lists jobs in card-style divs
      $(
        ".job-card, .job-listing, [class*='job-item'], [class*='listing'], article, a[href*='/jobs/']",
      ).each((_, el) => {
        const $el = $(el);

        // If the element itself is a link
        let href = $el.is("a") ? $el.attr("href") : null;
        let title = "";

        if (href) {
          title = $el.find("h2, h3, h4, [class*='title'], .title").first().text().trim() ||
            $el.text().trim().split("\n")[0]?.trim() || "";
        } else {
          const $link = $el.find("a[href*='/jobs/'], a[href*='/job/']").first();
          href = $link.attr("href") || null;
          title =
            $link.text().trim() ||
            $el.find("h2, h3, h4, [class*='title']").first().text().trim();
        }

        const company = $el
          .find("[class*='company'], [class*='employer'], .company-name")
          .first()
          .text()
          .trim();
        const loc = $el
          .find("[class*='location']")
          .first()
          .text()
          .trim();
        const salary = $el
          .find("[class*='salary'], [class*='pay']")
          .first()
          .text()
          .trim();
        const tags = $el
          .find("[class*='tag'], [class*='badge'], .tech-stack")
          .map((_, t) => $(t).text().trim())
          .get()
          .join(", ");

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://japan-dev.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: loc || "Japan",
          link: fullLink,
          source: "Japan Dev",
          salary: salary || undefined,
          description: tags || undefined,
        });
      });

      // JSON-LD fallback
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = Array.isArray(data) ? data : data?.itemListElement || [data];
          for (const item of items) {
            const job = item?.item || item;
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;


            const link = job?.url;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location: job?.jobLocation?.address?.addressLocality || "Japan",
              link,
              source: "Japan Dev",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip
        }
      });

      await sleep(2_000);
    }
  } catch {
    // return whatever we collected
  }

  return jobs;
}
