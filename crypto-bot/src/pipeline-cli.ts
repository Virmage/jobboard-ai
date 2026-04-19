import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Tweet, ClassifiedTweet } from "./types";
import { fetchRecentTweetsPublic } from "./fetch/public";
import { loadFixture } from "./fetch/fixture";
import { classifyBatch } from "./classify/classify";
import { runBacktest } from "./backtest/engine";
import { renderReport } from "./backtest/report";
import type { KnownCall } from "./backtest/types";

interface CliArgs {
  user: string;
  input?: string;
  cache: string;
  outDir: string;
  minConfidence: number;
  concurrency: number;
  skipClassify: boolean;
  skipBacktest: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    user: "zachxbt",
    cache: "crypto-bot/out/tweets-cache.json",
    outDir: "crypto-bot/out",
    minConfidence: 0.6,
    concurrency: 4,
    skipClassify: false,
    skipBacktest: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    const n = argv[i + 1];
    switch (f) {
      case "--user":
        args.user = n;
        i++;
        break;
      case "--input":
        args.input = n;
        i++;
        break;
      case "--cache":
        args.cache = n;
        i++;
        break;
      case "--out":
        args.outDir = n;
        i++;
        break;
      case "--min-confidence":
        args.minConfidence = Number(n);
        i++;
        break;
      case "--concurrency":
        args.concurrency = Number(n);
        i++;
        break;
      case "--skip-classify":
        args.skipClassify = true;
        break;
      case "--skip-backtest":
        args.skipBacktest = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
    }
  }
  return args;
}

function printHelp(): void {
  console.log(
    [
      "Usage: tsx crypto-bot/src/pipeline-cli.ts [options]",
      "",
      "End-to-end pipeline: fetch tweets -> classify -> backtest.",
      "No X API key needed — uses public syndication/nitter endpoints.",
      "",
      "Options:",
      "  --user <handle>           X handle to fetch (default: zachxbt)",
      "  --input <path>            Skip fetch; load tweets from this JSON",
      "  --cache <path>            Cache fetched tweets here",
      "  --out <dir>               Output directory (default: crypto-bot/out)",
      "  --min-confidence <n>      Classifier confidence threshold (default: 0.6)",
      "  --concurrency <n>         Parallel classifier workers (default: 4)",
      "  --skip-classify           Skip classification step",
      "  --skip-backtest           Skip backtest step",
      "",
      "Needs ANTHROPIC_API_KEY for the classify step.",
    ].join("\n"),
  );
}

async function loadTweets(args: CliArgs): Promise<Tweet[]> {
  if (args.input) {
    console.log(`Loading tweets from fixture ${args.input}...`);
    return loadFixture(args.input);
  }
  if (existsSync(args.cache)) {
    console.log(
      `Using cached tweets at ${args.cache} (delete it to refetch).`,
    );
    return JSON.parse(readFileSync(args.cache, "utf8")) as Tweet[];
  }
  console.log(`Fetching @${args.user} via public endpoints...`);
  const res = await fetchRecentTweetsPublic(args.user);
  console.log(`Got ${res.tweets.length} tweets via ${res.source}.`);
  if (res.warnings.length > 0) {
    console.log("  Warnings:");
    for (const w of res.warnings) console.log(`    - ${w}`);
  }
  mkdirSync(dirname(args.cache), { recursive: true });
  writeFileSync(args.cache, JSON.stringify(res.tweets, null, 2));
  console.log(`Cached to ${args.cache}`);
  return res.tweets;
}

function callsFromClassifications(
  classified: ClassifiedTweet[],
  minConfidence: number,
): KnownCall[] {
  const calls: KnownCall[] = [];
  for (const row of classified) {
    const c = row.classification;
    if (!c.is_negative || !c.actionable) continue;
    if (c.confidence < minConfidence) continue;
    for (const proj of c.mentioned_projects) {
      calls.push({
        id: `${row.tweet.id}-${proj.ticker ?? proj.name}`.slice(0, 40),
        tweet_ts: row.tweet.created_at,
        tweet_url: row.tweet.url,
        project_name: proj.name,
        ticker: proj.ticker,
        chain: proj.chain,
        contract_address: proj.contract_address,
        notes: c.reason,
      });
    }
  }
  return calls;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });

  const tweets = await loadTweets(args);
  console.log(`\nLoaded ${tweets.length} tweets.\n`);
  if (tweets.length === 0) {
    console.error("No tweets to process. Exiting.");
    process.exit(1);
  }

  if (args.skipClassify) {
    console.log("Skipping classification (--skip-classify).");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY not set. Set it to run classification, or pass --skip-classify.",
    );
    process.exit(1);
  }

  const client = new Anthropic();
  console.log(`Classifying ${tweets.length} tweets with Claude...`);
  const classified = await classifyBatch(client, tweets, {
    concurrency: args.concurrency,
    onProgress: (done, total) => {
      process.stdout.write(`\r  [${done}/${total}]`);
    },
  });
  process.stdout.write("\n");

  const classifiedPath = `${args.outDir}/classified.json`;
  writeFileSync(classifiedPath, JSON.stringify(classified, null, 2));
  console.log(`Wrote ${classifiedPath}`);

  const negatives = classified.filter((r) => r.classification.is_negative);
  const actionable = classified.filter((r) => r.classification.actionable);
  console.log(
    `\nClassifier summary: ${negatives.length} negative / ${actionable.length} actionable / ${classified.length} total`,
  );

  const calls = callsFromClassifications(classified, args.minConfidence);
  const callsPath = `${args.outDir}/derived-calls.json`;
  writeFileSync(callsPath, JSON.stringify(calls, null, 2));
  console.log(
    `Derived ${calls.length} backtestable calls (min_confidence=${args.minConfidence}) -> ${callsPath}`,
  );

  if (calls.length === 0) {
    console.log("\nNo actionable calls derived. Nothing to backtest.");
    return;
  }
  if (args.skipBacktest) {
    console.log("Skipping backtest (--skip-backtest).");
    return;
  }

  console.log(`\nRunning backtest on ${calls.length} derived calls...`);
  const results = await runBacktest(calls, {
    onProgress: (done, total, call) => {
      process.stdout.write(
        `\r  [${done}/${total}] ${call.id.slice(0, 30).padEnd(30)}`,
      );
    },
  });
  process.stdout.write("\n");

  writeFileSync(
    `${args.outDir}/backtest-trades.json`,
    JSON.stringify(results, null, 2),
  );
  const report = renderReport(results);
  writeFileSync(`${args.outDir}/backtest-report.txt`, report);
  console.log("\n" + report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
