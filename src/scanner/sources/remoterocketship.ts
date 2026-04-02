import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { sleep } from "../utils";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Cloudflare challenge page — not real content
    if (text.includes("cf-browser-verification") || text.includes("Just a moment")) return null;
    return text;
  } catch {
    return null;
  }
}

/**
 * Scan Remote Rocketship for remote jobs.
 *
 * Remote Rocketship aggregates remote jobs across engineering, design,
 * marketing, product and more. Uses Cloudflare — requests with full
 * browser headers have a reasonable pass rate; returns [] if blocked.
 *
 * Market: global remote.
 * URL pattern: https://www.remoterocketship.com/jobs?page=N
 */
export async function scanRemoteRocketship(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? "https://www.remoterocketship.com/jobs"
        : `https://www.remoterocketship.com/jobs?page=${page}`;

    const html = await fetchPage(url);
    if (!html) {
      await sleep(3_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Try JSON-LD first (cleanest data)
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const raw = $(el).html() ?? "";
          const data = JSON.parse(raw);
          const items = Array.isArray(data)
            ? data
            : data?.itemListElement?.map((i: { item?: unknown }) => i?.item ?? i) ?? [data];

          for (const item of items) {
            if (item?.["@type"] !== "JobPosting") continue;
            const title = item?.title || item?.name;
            if (!title) continue;
            const link = item?.url || item?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: item?.hiringOrganization?.name || "See listing",
              location:
                item?.jobLocationType === "TELECOMMUTE"
                  ? "Remote"
                  : item?.jobLocation?.address?.addressLocality || "Remote",
              link,
              source: "RemoteRocketship",
              description: item?.description?.slice(0, 500),
              salary:
                item?.baseSalary?.value?.value ||
                item?.baseSalary?.value?.minValue
                  ? `$${item.baseSalary.value.minValue?.toLocaleString()} – $${item.baseSalary.value.maxValue?.toLocaleString()}`
                  : undefined,
              postedAt: item?.datePosted ? new Date(item.datePosted) : undefined,
            });
          }
        } catch {
          // malformed JSON-LD
        }
      });

      // HTML fallback — job cards
      if (jobs.length === 0 || page > 1) {
        $(
          "article, " +
          "[class*='job-card'], " +
          "[class*='JobCard'], " +
          "[class*='job-listing'], " +
          "[class*='JobListing'], " +
          ".job, " +
          "li[class*='job']"
        ).each((_, el) => {
          const $el = $(el);
          const $link = $el.find("a[href*='/jobs/'], a[href*='/job/']").first();
          const href = $link.attr("href") || $el.find("a").first().attr("href");
          const title =
            $link.text().trim() ||
            $el.find("h2, h3, h4, [class*='title'], [class*='Title']").first().text().trim();
          const company =
            $el.find("[class*='company'], [class*='Company'], [class*='employer']").first().text().trim();
          const location =
            $el.find("[class*='location'], [class*='Location']").first().text().trim() || "Remote";

          if (!title || title.length < 3 || !href) return;

          const fullLink = href.startsWith("http")
            ? href
            : `https://www.remoterocketship.com${href}`;
          if (seenLinks.has(fullLink)) return;

          seenLinks.add(fullLink);
          jobs.push({
            title,
            company: company || "See listing",
            location,
            link: fullLink,
            source: "RemoteRocketship",
          });
        });
      }
    } catch {
      // page parse failure
    }

    await sleep(3_000);
  }

  return jobs;
}
