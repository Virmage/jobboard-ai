import Anthropic from "@anthropic-ai/sdk";
import type { Tweet, Classification } from "../types";
import { CLASSIFIER_SYSTEM } from "./prompt";

const MODEL = "claude-opus-4-7";

function parseClassification(
  tweetId: string,
  rawText: string,
): Classification {
  const trimmed = rawText.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON object in model output: ${trimmed.slice(0, 200)}`);
  }
  const jsonSlice = trimmed.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(jsonSlice);
  return {
    tweet_id: tweetId,
    is_negative: Boolean(parsed.is_negative),
    confidence: Number(parsed.confidence ?? 0),
    severity: Number(parsed.severity ?? 0),
    reason: String(parsed.reason ?? ""),
    mentioned_projects: Array.isArray(parsed.mentioned_projects)
      ? parsed.mentioned_projects
      : [],
    actionable: Boolean(parsed.actionable),
    actionable_reason: String(parsed.actionable_reason ?? ""),
  };
}

export async function classifyTweet(
  client: Anthropic,
  tweet: Tweet,
): Promise<Classification> {
  const userContent = `Tweet by @${tweet.author} at ${tweet.created_at}:\n\n${tweet.text}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: CLASSIFIER_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`No text block in response for tweet ${tweet.id}`);
  }
  return parseClassification(tweet.id, textBlock.text);
}

export interface BatchOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number, tweet: Tweet) => void;
}

export async function classifyBatch(
  client: Anthropic,
  tweets: Tweet[],
  opts: BatchOptions = {},
): Promise<Array<{ tweet: Tweet; classification: Classification }>> {
  const concurrency = opts.concurrency ?? 5;
  const results: Array<{ tweet: Tweet; classification: Classification }> = [];
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= tweets.length) return;
      const tweet = tweets[idx];
      try {
        const classification = await classifyTweet(client, tweet);
        results[idx] = { tweet, classification };
      } catch (err) {
        results[idx] = {
          tweet,
          classification: {
            tweet_id: tweet.id,
            is_negative: false,
            confidence: 0,
            severity: 0,
            reason: `ERROR: ${err instanceof Error ? err.message : String(err)}`,
            mentioned_projects: [],
            actionable: false,
            actionable_reason: "classification failed",
          },
        };
      }
      done++;
      opts.onProgress?.(done, tweets.length, tweet);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tweets.length) }, worker),
  );
  return results;
}
