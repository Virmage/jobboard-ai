import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { KnownCall, TradeResult } from "./backtest/types";
import { HORIZONS_MS } from "./backtest/types";
import { runBacktest } from "./backtest/engine";

interface CliArgs {
  input: string;
  output: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input: "crypto-bot/fixtures/known-calls.json",
    output: "crypto-bot/out/sweep-report.txt",
  };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    const n = argv[i + 1];
    if (f === "--input") {
      args.input = n;
      i++;
    } else if (f === "--output") {
      args.output = n;
      i++;
    }
  }
  return args;
}

const ENTRY_DELAYS: Array<{ label: string; ms: number }> = [
  { label: "+5m", ms: 5 * 60 * 1000 },
  { label: "+1h", ms: 60 * 60 * 1000 },
  { label: "+6h", ms: 6 * 60 * 60 * 1000 },
  { label: "+24h", ms: 24 * 60 * 60 * 1000 },
  { label: "+3d", ms: 3 * 24 * 60 * 60 * 1000 },
];

function loadCalls(path: string): KnownCall[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as KnownCall[];
  return parsed.filter(
    (c) => c.id && c.tweet_ts && !c.tweet_ts.startsWith("REPLACE"),
  );
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "  n/a ";
  const pct = n * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function renderPerCall(
  call: KnownCall,
  byDelay: Record<string, TradeResult>,
): string {
  const lines: string[] = [];
  const projectLabel = `${call.project_name}${call.ticker ? ` ($${call.ticker})` : ""}`;
  lines.push(`\n=== ${projectLabel} — tweet ${call.tweet_ts} ===`);

  const horizons = Object.keys(HORIZONS_MS);
  const header = ["delay".padEnd(8)]
    .concat(horizons.map((h) => pad(h, 9)))
    .join("");
  lines.push(header);

  for (const { label } of ENTRY_DELAYS) {
    const trade = byDelay[label];
    if (!trade || trade.entry_price == null) {
      lines.push(`${pad(label, 8)}(no entry price: ${trade?.skipped_reason ?? "unknown"})`);
      continue;
    }
    const cells = horizons.map((h) => pad(fmt(trade.returns_short[h]), 9));
    lines.push(`${pad(label, 8)}${cells.join("")}`);
  }
  lines.push(
    `  (negative % = short loses, positive % = short wins; n/a = horizon not yet reached or no price)`,
  );
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const calls = loadCalls(args.input);
  console.log(`Loaded ${calls.length} calls.`);
  console.log(
    `Sweeping entry delays: ${ENTRY_DELAYS.map((d) => d.label).join(", ")}`,
  );
  console.log(`Horizons: ${Object.keys(HORIZONS_MS).join(", ")}\n`);

  const allResults: Record<string, Record<string, TradeResult>> = {};
  for (const call of calls) allResults[call.id] = {};

  for (const { label, ms } of ENTRY_DELAYS) {
    console.log(`-- entry delay ${label} --`);
    const results = await runBacktest(calls, {
      entryDelayMs: ms,
      onProgress: (done, total, call) => {
        process.stdout.write(
          `\r  [${done}/${total}] ${call.id.slice(0, 30).padEnd(30)}`,
        );
      },
    });
    process.stdout.write("\n");
    for (const r of results) {
      allResults[r.call.id][label] = r;
    }
  }

  const sections: string[] = [];
  sections.push("Entry-delay sweep — short returns by delay × horizon");
  sections.push("=".repeat(70));
  for (const call of calls) {
    sections.push(renderPerCall(call, allResults[call.id]));
  }
  const report = sections.join("\n");

  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, report);
  console.log("\n" + report);
  console.log(`\nWrote ${args.output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
