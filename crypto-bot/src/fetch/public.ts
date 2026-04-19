import type { Tweet } from "../types";
import { fetchRecentTweetsViaSyndication } from "./syndication";
import { fetchRecentTweetsViaNitter } from "./nitter";

export interface PublicFetchResult {
  tweets: Tweet[];
  source: "syndication" | "nitter";
  warnings: string[];
}

export async function fetchRecentTweetsPublic(
  username: string,
): Promise<PublicFetchResult> {
  const warnings: string[] = [];
  try {
    const tweets = await fetchRecentTweetsViaSyndication(username);
    return { tweets, source: "syndication", warnings };
  } catch (e) {
    warnings.push(`syndication: ${e instanceof Error ? e.message : e}`);
  }
  try {
    const tweets = await fetchRecentTweetsViaNitter(username);
    return { tweets, source: "nitter", warnings };
  } catch (e) {
    warnings.push(`nitter: ${e instanceof Error ? e.message : e}`);
  }
  throw new Error(
    `All public fetchers failed for @${username}:\n  - ${warnings.join("\n  - ")}`,
  );
}
