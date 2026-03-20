import type { RawJob } from "../types";
import { fetchJSON, sleep, titleMatchesCreativeLeadership, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * SmartRecruiters public API job posting shape.
 */
interface SRPosting {
  id: string;
  name: string;
  uuid: string;
  refNumber: string;
  company: {
    name: string;
    identifier: string;
  };
  location: {
    city: string;
    region: string;
    country: string;
    remote: boolean;
  };
  department?: {
    label: string;
  };
  releasedDate: string; // ISO date
  creator?: {
    name: string;
  };
  experienceLevel?: {
    label: string;
  };
  customField?: Array<{
    fieldLabel: string;
    valueLabel: string;
  }>;
}

interface SRResponse {
  totalFound: number;
  offset: number;
  limit: number;
  content: SRPosting[];
}

/**
 * Well-known companies using SmartRecruiters with public job boards.
 * Similar to the Greenhouse cache approach — maintain a list of company IDs.
 * Company IDs are the SmartRecruiters company identifiers.
 */
const COMPANY_IDS = [
  "Visa",
  "Bosch",
  "LVMH",
  "adidas",
  "Sanofi",
  "Spotify",
  "HelloFresh",
  "Zalando",
  "Delivery-Hero",
  "SoundCloud",
  "N26",
  "TradeRepublic",
  "Personio",
  "SumUp",
  "Wolt",
  "Glovo",
  "GetYourGuide",
  "FlixBus",
  "Auto1Group",
  "Contentful",
  "Pipedrive",
  "Wise",
  "Bolt",
  "SmartRecruiters",
  "IKEA",
  "Equinix",
  "McDonalds",
  "UberEats",
  "LinkedIn",
  "Square",
  "Toast",
];

/**
 * Scan SmartRecruiters public API for job postings.
 *
 * Endpoint: https://api.smartrecruiters.com/v1/companies/{companyId}/postings
 * No auth needed for public postings.
 * Maintains a list of company IDs (similar to Greenhouse cache approach).
 */
export async function scanSmartRecruiters(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<string>();

  for (const companyId of COMPANY_IDS) {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const data = await fetchJSON<SRResponse>(
        `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?offset=${offset}&limit=${limit}`,
      );

      if (!data?.content?.length) {
        hasMore = false;
        break;
      }

      for (const posting of data.content) {
        if (seenIds.has(posting.id)) continue;
        if (!titleMatchesCreativeLeadership(posting.name)) continue;

        // Date filter
        const postedDate = posting.releasedDate
          ? new Date(posting.releasedDate)
          : null;
        if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

        seenIds.add(posting.id);

        // Build location string
        const loc = posting.location;
        const locationParts = [loc.city, loc.region, loc.country].filter(Boolean);
        const locationStr = loc.remote
          ? `Remote${locationParts.length ? ` (${locationParts.join(", ")})` : ""}`
          : locationParts.join(", ") || "See listing";

        jobs.push({
          title: posting.name,
          company: posting.company?.name || companyId,
          location: locationStr,
          link: `https://jobs.smartrecruiters.com/${companyId}/${posting.id}`,
          source: "SmartRecruiters",
          postedAt: postedDate ?? undefined,
        });
      }

      // Check if there are more pages
      if (data.content.length < limit || offset + limit >= data.totalFound) {
        hasMore = false;
      } else {
        offset += limit;
      }

      await sleep(500);
    }

    await sleep(800);
  }

  return jobs;
}
