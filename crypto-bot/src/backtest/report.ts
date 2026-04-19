import { HORIZONS_MS, type TradeResult } from "./types";

export interface BucketStats {
  count: number;
  by_horizon: Record<
    string,
    {
      n: number;
      mean_return: number;
      median_return: number;
      win_rate: number;
      best: number;
      worst: number;
    }
  >;
}

function stats(returns: number[]): BucketStats["by_horizon"][string] {
  if (returns.length === 0) {
    return { n: 0, mean_return: 0, median_return: 0, win_rate: 0, best: 0, worst: 0 };
  }
  const sorted = [...returns].sort((a, b) => a - b);
  const sum = returns.reduce((a, b) => a + b, 0);
  const wins = returns.filter((r) => r > 0).length;
  return {
    n: returns.length,
    mean_return: sum / returns.length,
    median_return: sorted[Math.floor(sorted.length / 2)],
    win_rate: wins / returns.length,
    best: sorted[sorted.length - 1],
    worst: sorted[0],
  };
}

function bucket(results: TradeResult[]): BucketStats {
  const by_horizon: BucketStats["by_horizon"] = {};
  for (const label of Object.keys(HORIZONS_MS)) {
    const rs = results
      .map((r) => r.returns_short[label])
      .filter((x): x is number => x != null && Number.isFinite(x));
    by_horizon[label] = stats(rs);
  }
  return { count: results.length, by_horizon };
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

export function renderReport(results: TradeResult[]): string {
  const lines: string[] = [];
  lines.push("=".repeat(70));
  lines.push("zachxbt short-signal backtest");
  lines.push("=".repeat(70));

  const usable = results.filter((r) => r.entry_price != null);
  const skipped = results.filter((r) => r.entry_price == null);
  const perpsLive = usable.filter(
    (r) => r.venue === "binance_perp" && r.perps_available_at_tweet,
  );
  const hlPerps = usable.filter((r) => r.venue === "hyperliquid_perp");
  const dexOnly = usable.filter((r) => r.venue === "dex");

  lines.push("");
  lines.push(`Total calls:                   ${results.length}`);
  lines.push(`Backtestable:                  ${usable.length}`);
  lines.push(`  -> Binance perps (live):     ${perpsLive.length}`);
  lines.push(`  -> Hyperliquid perps:        ${hlPerps.length}`);
  lines.push(`  -> DEX hypothetical:         ${dexOnly.length}`);
  lines.push(`Skipped:                       ${skipped.length}`);

  if (skipped.length > 0) {
    lines.push("");
    lines.push("--- Skipped calls ---");
    for (const r of skipped) {
      lines.push(
        `  ${r.call.id.padEnd(20)} ${r.call.project_name.padEnd(20)} ${r.skipped_reason ?? "unknown"}`,
      );
    }
  }

  for (const [label, subset] of [
    ["Binance perps (shortable at tweet time)", perpsLive],
    ["Hyperliquid perps (shortable at tweet time)", hlPerps],
    ["DEX-only (hypothetical short)", dexOnly],
  ] as const) {
    if (subset.length === 0) continue;
    const b = bucket(subset);
    lines.push("");
    lines.push(`--- ${label} (n=${b.count}) ---`);
    lines.push(
      pad("horizon", 10) +
        pad("n", 5) +
        pad("mean", 10) +
        pad("median", 10) +
        pad("win%", 10) +
        pad("best", 10) +
        pad("worst", 10),
    );
    for (const [horizon, s] of Object.entries(b.by_horizon)) {
      lines.push(
        pad(horizon, 10) +
          pad(String(s.n), 5) +
          pad(fmtPct(s.mean_return), 10) +
          pad(fmtPct(s.median_return), 10) +
          pad(fmtPct(s.win_rate), 10) +
          pad(fmtPct(s.best), 10) +
          pad(fmtPct(s.worst), 10),
      );
    }
  }

  lines.push("");
  lines.push("--- Per-trade detail ---");
  for (const r of usable) {
    const venue =
      r.venue === "binance_perp"
        ? "BINANCE"
        : r.venue === "hyperliquid_perp"
          ? "HYPERLIQUID"
          : "DEX";
    const name = `${r.call.project_name}${r.call.ticker ? ` ($${r.call.ticker})` : ""}`;
    lines.push(`[${venue}] ${name}   ${new Date(r.entry_ts).toISOString()}`);
    for (const [horizon, ret] of Object.entries(r.returns_short)) {
      if (ret == null) continue;
      lines.push(`    ${pad(horizon, 6)} ${fmtPct(ret)}`);
    }
  }

  return lines.join("\n");
}
