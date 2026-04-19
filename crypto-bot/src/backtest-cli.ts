import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { KnownCall } from "./backtest/types";
import { runBacktest } from "./backtest/engine";
import { renderReport } from "./backtest/report";

interface CliArgs {
  input: string;
  output: string;
  json: string;
  minSeverity: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input: "crypto-bot/fixtures/known-calls.json",
    output: "crypto-bot/out/backtest-report.txt",
    json: "crypto-bot/out/backtest-trades.json",
    minSeverity: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    switch (flag) {
      case "--input":
        args.input = next;
        i++;
        break;
      case "--output":
        args.output = next;
        i++;
        break;
      case "--json":
        args.json = next;
        i++;
        break;
      case "--min-severity":
        args.minSeverity = Number(next);
        i++;
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
      "Usage: tsx crypto-bot/src/backtest-cli.ts [options]",
      "",
      "Options:",
      "  --input <path>        Known-calls JSON (default: crypto-bot/fixtures/known-calls.json)",
      "  --output <path>       Text report path",
      "  --json <path>         Raw trades JSON",
      "  --min-severity <n>    Only backtest calls with severity >= n (default: 0, no filter)",
    ].join("\n"),
  );
}

function loadCalls(path: string): KnownCall[] {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON array`);
  }
  const calls = parsed as KnownCall[];
  const bad = calls.filter(
    (c) => !c.id || !c.tweet_ts || c.tweet_ts.startsWith("REPLACE"),
  );
  if (bad.length > 0) {
    console.warn(
      `\nSkipping ${bad.length} call(s) with REPLACE placeholder timestamps: ${bad
        .map((c) => c.id)
        .join(", ")}\n`,
    );
  }
  return calls.filter(
    (c) => c.id && c.tweet_ts && !c.tweet_ts.startsWith("REPLACE"),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const allCalls = loadCalls(args.input);
  const calls =
    args.minSeverity > 0
      ? allCalls.filter((c) => (c.severity ?? 0) >= args.minSeverity)
      : allCalls;

  console.log(`Loaded ${allCalls.length} calls from ${args.input}`);
  if (args.minSeverity > 0) {
    const dropped = allCalls.length - calls.length;
    console.log(
      `Filtered to ${calls.length} (min severity ${args.minSeverity}, dropped ${dropped})`,
    );
    if (dropped > 0) {
      const droppedCalls = allCalls.filter(
        (c) => (c.severity ?? 0) < args.minSeverity,
      );
      for (const c of droppedCalls) {
        console.log(
          `  skipped: [sev ${c.severity ?? 0}] ${c.project_name}${c.ticker ? ` ($${c.ticker})` : ""}`,
        );
      }
    }
  }

  if (calls.length === 0) {
    console.error("Nothing to backtest after filtering.");
    process.exit(1);
  }

  console.log("\nRunning backtest (fetching Binance + GeckoTerminal prices)...");
  const results = await runBacktest(calls, {
    onProgress: (done, total, call) => {
      process.stdout.write(
        `\r  [${done}/${total}] ${call.id.slice(0, 30).padEnd(30)}`,
      );
    },
  });
  process.stdout.write("\n");

  mkdirSync(dirname(args.json), { recursive: true });
  writeFileSync(args.json, JSON.stringify(results, null, 2));

  const report = renderReport(results);
  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, report);
  console.log(report);
  console.log(`\nWrote ${args.output} and ${args.json}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
