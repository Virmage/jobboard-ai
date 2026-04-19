import { renderReport } from "./report";
import { HORIZONS_MS, type TradeResult } from "./types";

function fakeTrade(
  id: string,
  venue: TradeResult["venue"],
  entry: number,
  exits: Record<string, number>,
  perps = true,
): TradeResult {
  const exit_prices: Record<string, number | null> = {};
  const returns_short: Record<string, number | null> = {};
  for (const k of Object.keys(HORIZONS_MS)) {
    exit_prices[k] = exits[k] ?? null;
    returns_short[k] = exits[k] != null ? (entry - exits[k]) / entry : null;
  }
  return {
    call: {
      id,
      tweet_ts: "2024-01-01T00:00:00Z",
      project_name: id,
      ticker: id.toUpperCase(),
    },
    venue,
    symbol_or_pool: `${id.toUpperCase()}USDT`,
    entry_ts: 1704067500000,
    entry_price: entry,
    exit_prices,
    returns_short,
    perps_available_at_tweet: perps,
  };
}

function approxEqual(a: number, b: number, tol = 1e-9): boolean {
  return Math.abs(a - b) < tol;
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  OK   ${name}`);
  } catch (err) {
    console.log(`  FAIL ${name}: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

console.log("Backtest engine self-test\n");

test("short return math: price drops 50% -> +50% short return", () => {
  const t = fakeTrade("DROP", "binance_perp", 100, { "1h": 50, "24h": 50, "7d": 50, "30d": 50 });
  if (!approxEqual(t.returns_short["24h"]!, 0.5)) {
    throw new Error(`expected 0.5, got ${t.returns_short["24h"]}`);
  }
});

test("short return math: price rises 20% -> -20% short return", () => {
  const t = fakeTrade("UP", "binance_perp", 100, { "1h": 120, "24h": 120, "7d": 120, "30d": 120 });
  if (!approxEqual(t.returns_short["1h"]!, -0.2)) {
    throw new Error(`expected -0.2, got ${t.returns_short["1h"]}`);
  }
});

test("report bucketizes perps vs DEX separately", () => {
  const trades: TradeResult[] = [
    fakeTrade("a", "binance_perp", 100, { "24h": 50, "1h": 90, "7d": 50, "30d": 50 }, true),
    fakeTrade("b", "binance_perp", 10, { "24h": 1, "1h": 8, "7d": 1, "30d": 1 }, true),
    fakeTrade("c", "dex", 0.5, { "24h": 0.1, "1h": 0.3, "7d": 0.1, "30d": 0.1 }, false),
  ];
  const report = renderReport(trades);
  if (!report.includes("Binance perps (shortable at tweet time) (n=2)")) {
    throw new Error("perps bucket header missing");
  }
  if (!report.includes("DEX-only (hypothetical short) (n=1)")) {
    throw new Error("dex bucket header missing");
  }
});

test("report skips trades with null entry_price", () => {
  const trades: TradeResult[] = [
    {
      call: { id: "bad", tweet_ts: "2024-01-01T00:00:00Z", project_name: "bad" },
      venue: "unavailable",
      symbol_or_pool: null,
      entry_ts: 0,
      entry_price: null,
      exit_prices: {},
      returns_short: {},
      perps_available_at_tweet: false,
      skipped_reason: "no price data",
    },
  ];
  const report = renderReport(trades);
  if (!/Skipped:\s+1/.test(report)) {
    throw new Error(`skipped count wrong: ${report}`);
  }
});

console.log("\nAll tests passed.");
