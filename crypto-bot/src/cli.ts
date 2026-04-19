import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Tweet, ClassifiedTweet } from "./types";
import { loadFixture } from "./fetch/fixture";
import { fetchUserTweets } from "./fetch/xApi";
import { classifyBatch } from "./classify/classify";

interface CliArgs {
  input?: string;
  user: string;
  max: number;
  output: string;
  concurrency: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    user: "zachxbt",
    max: 100,
    output: "crypto-bot/out/classified.json",
    concurrency: 5,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    switch (flag) {
      case "--input":
        args.input = next;
        i++;
        break;
      case "--user":
        args.user = next;
        i++;
        break;
      case "--max":
        args.max = Number(next);
        i++;
        break;
      case "--output":
        args.output = next;
        i++;
        break;
      case "--concurrency":
        args.concurrency = Number(next);
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  return args;
}

function printHelp(): void {
  console.log(
    [
      "Usage: tsx crypto-bot/src/cli.ts [options]",
      "",
      "Options:",
      "  --input <path>        Load tweets from a local JSON fixture (skips X API)",
      "  --user <handle>       X handle to fetch (default: zachxbt). Requires X_BEARER_TOKEN.",
      "  --max <n>             Max tweets to fetch (default: 100)",
      "  --output <path>       Where to write classified.json (default: crypto-bot/out/classified.json)",
      "  --concurrency <n>     Parallel classification workers (default: 5)",
      "  -h, --help            Show this help",
    ].join("\n"),
  );
}

function summarize(results: ClassifiedTweet[]): void {
  const total = results.length;
  const negative = results.filter((r) => r.classification.is_negative).length;
  const actionable = results.filter((r) => r.classification.actionable).length;
  const withTicker = results.filter((r) =>
    r.classification.mentioned_projects.some((p) => p.ticker),
  ).length;

  console.log("\n=== Classification summary ===");
  console.log(`Total tweets:        ${total}`);
  console.log(
    `Negative:            ${negative}  (${pct(negative, total)})`,
  );
  console.log(
    `Actionable (short):  ${actionable}  (${pct(actionable, total)})`,
  );
  console.log(
    `Has ticker:          ${withTicker}  (${pct(withTicker, total)})`,
  );

  const actionableRows = results
    .filter((r) => r.classification.actionable)
    .sort((a, b) => b.classification.confidence - a.classification.confidence);

  if (actionableRows.length > 0) {
    console.log("\n=== Actionable tweets ===");
    for (const row of actionableRows) {
      const projects = row.classification.mentioned_projects
        .map((p) => `${p.name}${p.ticker ? ` ($${p.ticker})` : ""}`)
        .join(", ");
      console.log(
        `[${row.tweet.created_at}] conf=${row.classification.confidence.toFixed(2)} ${projects}`,
      );
      console.log(`  ${row.classification.reason}`);
      console.log(`  ${row.tweet.url ?? row.tweet.id}`);
    }
  }
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

async function loadTweets(args: CliArgs): Promise<Tweet[]> {
  if (args.input) {
    console.log(`Loading fixture from ${args.input}...`);
    return loadFixture(args.input);
  }
  console.log(`Fetching up to ${args.max} tweets from @${args.user}...`);
  return fetchUserTweets(args.user, { max: args.max });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const tweets = await loadTweets(args);
  console.log(`Loaded ${tweets.length} tweets.`);

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY env var required to run classification");
  }
  const client = new Anthropic();

  console.log(
    `Classifying with concurrency=${args.concurrency}... (this calls the Claude API)`,
  );
  const start = Date.now();
  const results = await classifyBatch(client, tweets, {
    concurrency: args.concurrency,
    onProgress: (done, total, tweet) => {
      process.stdout.write(
        `\r  [${done}/${total}] ${tweet.id.slice(0, 24).padEnd(24)}`,
      );
    },
  });
  process.stdout.write("\n");
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s.`);

  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, JSON.stringify(results, null, 2));
  console.log(`Wrote ${args.output}`);

  summarize(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
