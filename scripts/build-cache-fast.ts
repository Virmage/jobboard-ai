#!/usr/bin/env npx tsx
/**
 * build-cache-fast.ts
 * Builds career-cache.json by probing known ATS APIs for ~100 top crypto companies.
 * No CoinGecko needed — hardcoded list + parallel ATS checks.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/build-cache-fast.ts
 */

import fs from "fs";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql as rawSql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CareerProject {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  homepage: string;
  careerUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | "workable" | "generic" | null;
  atsId: string | null;
}

interface CompanyDef {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  homepage: string;
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
}

// ---------------------------------------------------------------------------
// Hardcoded company list — ~100 top crypto companies with known ATS board IDs
// ---------------------------------------------------------------------------
const COMPANIES: CompanyDef[] = [
  // === GREENHOUSE ===
  { id: "coinbase", name: "Coinbase", symbol: "COIN", rank: 1, homepage: "https://coinbase.com", ats: "greenhouse", slug: "coinbase" },
  { id: "kraken", name: "Kraken", symbol: "KRAK", rank: 2, homepage: "https://kraken.com", ats: "greenhouse", slug: "kraboratory" },
  { id: "ripple", name: "Ripple", symbol: "XRP", rank: 3, homepage: "https://ripple.com", ats: "greenhouse", slug: "ripple" },
  { id: "circle", name: "Circle", symbol: "USDC", rank: 4, homepage: "https://circle.com", ats: "greenhouse", slug: "circle" },
  { id: "consensys", name: "Consensys", symbol: "ETH", rank: 5, homepage: "https://consensys.io", ats: "greenhouse", slug: "consensys" },
  { id: "chainalysis", name: "Chainalysis", symbol: "CHAIN", rank: 6, homepage: "https://chainalysis.com", ats: "greenhouse", slug: "chainalysis" },
  { id: "opensea", name: "OpenSea", symbol: "OS", rank: 7, homepage: "https://opensea.io", ats: "greenhouse", slug: "opensea" },
  { id: "uniswap", name: "Uniswap Labs", symbol: "UNI", rank: 8, homepage: "https://uniswap.org", ats: "greenhouse", slug: "uniswaplabs" },
  { id: "alchemy", name: "Alchemy", symbol: "ALCH", rank: 9, homepage: "https://alchemy.com", ats: "greenhouse", slug: "alchemy" },
  { id: "phantom", name: "Phantom", symbol: "PHNTM", rank: 10, homepage: "https://phantom.app", ats: "greenhouse", slug: "phantom" },
  { id: "dapper-labs", name: "Dapper Labs", symbol: "FLOW", rank: 11, homepage: "https://dapperlabs.com", ats: "greenhouse", slug: "dapperlabs" },
  { id: "figment", name: "Figment", symbol: "FIG", rank: 12, homepage: "https://figment.io", ats: "greenhouse", slug: "figment" },
  { id: "anchorage", name: "Anchorage Digital", symbol: "ANCH", rank: 13, homepage: "https://anchorage.com", ats: "greenhouse", slug: "anchoragedigital" },
  { id: "fireblocks", name: "Fireblocks", symbol: "FB", rank: 14, homepage: "https://fireblocks.com", ats: "greenhouse", slug: "fireblocks" },
  { id: "paxos", name: "Paxos", symbol: "PAX", rank: 15, homepage: "https://paxos.com", ats: "greenhouse", slug: "paxos" },
  { id: "bitgo", name: "BitGo", symbol: "BITGO", rank: 16, homepage: "https://bitgo.com", ats: "greenhouse", slug: "bitgo" },
  { id: "ledger", name: "Ledger", symbol: "LDG", rank: 17, homepage: "https://ledger.com", ats: "greenhouse", slug: "ledger" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", rank: 18, homepage: "https://polygon.technology", ats: "greenhouse", slug: "polygon" },
  { id: "optimism", name: "Optimism", symbol: "OP", rank: 19, homepage: "https://optimism.io", ats: "greenhouse", slug: "optimism" },
  { id: "arbitrum", name: "Arbitrum (Offchain Labs)", symbol: "ARB", rank: 20, homepage: "https://arbitrum.io", ats: "greenhouse", slug: "arbitrum" },
  { id: "avalanche", name: "Ava Labs (Avalanche)", symbol: "AVAX", rank: 21, homepage: "https://avax.network", ats: "greenhouse", slug: "avalabs" },
  { id: "solana", name: "Solana Foundation", symbol: "SOL", rank: 22, homepage: "https://solana.org", ats: "greenhouse", slug: "solana" },
  { id: "near", name: "NEAR Foundation", symbol: "NEAR", rank: 23, homepage: "https://near.org", ats: "greenhouse", slug: "nearfoundation" },
  { id: "aptos", name: "Aptos Labs", symbol: "APT", rank: 24, homepage: "https://aptoslabs.com", ats: "greenhouse", slug: "aptoslabs" },
  { id: "sui", name: "Mysten Labs (Sui)", symbol: "SUI", rank: 25, homepage: "https://mystenlabs.com", ats: "greenhouse", slug: "mystenlabs" },
  { id: "hedera", name: "Hedera", symbol: "HBAR", rank: 26, homepage: "https://hedera.com", ats: "greenhouse", slug: "hedera" },
  { id: "stellar", name: "Stellar", symbol: "XLM", rank: 27, homepage: "https://stellar.org", ats: "greenhouse", slug: "stellar" },
  { id: "starkware", name: "StarkWare (Starknet)", symbol: "STRK", rank: 28, homepage: "https://starkware.co", ats: "greenhouse", slug: "starkware" },
  { id: "immutable", name: "Immutable", symbol: "IMX", rank: 29, homepage: "https://immutable.com", ats: "greenhouse", slug: "immutable" },
  { id: "animoca", name: "Animoca Brands", symbol: "ANMCA", rank: 30, homepage: "https://animocabrands.com", ats: "greenhouse", slug: "animocabrands" },
  { id: "celestia", name: "Celestia", symbol: "TIA", rank: 31, homepage: "https://celestia.org", ats: "greenhouse", slug: "celestia" },
  { id: "layerzero", name: "LayerZero Labs", symbol: "ZRO", rank: 32, homepage: "https://layerzero.network", ats: "greenhouse", slug: "layerzerolabs" },
  { id: "wormhole-gh", name: "Wormhole", symbol: "W", rank: 33, homepage: "https://wormhole.com", ats: "greenhouse", slug: "wormhole" },
  { id: "eigenlayer", name: "Eigen Labs (EigenLayer)", symbol: "EIGEN", rank: 34, homepage: "https://eigenlayer.xyz", ats: "greenhouse", slug: "eigenlabs" },
  { id: "scroll", name: "Scroll", symbol: "SCR", rank: 35, homepage: "https://scroll.io", ats: "greenhouse", slug: "scroll" },
  { id: "axelar", name: "Axelar", symbol: "AXL", rank: 36, homepage: "https://axelar.network", ats: "greenhouse", slug: "axelarnetwork" },
  { id: "the-graph", name: "The Graph", symbol: "GRT", rank: 37, homepage: "https://thegraph.com", ats: "greenhouse", slug: "thegraph" },
  { id: "protocol-labs", name: "Protocol Labs (Filecoin)", symbol: "FIL", rank: 38, homepage: "https://protocol.ai", ats: "greenhouse", slug: "protocollabs" },
  { id: "blockdaemon", name: "Blockdaemon", symbol: "BD", rank: 39, homepage: "https://blockdaemon.com", ats: "greenhouse", slug: "blockdaemon" },
  { id: "nethermind", name: "Nethermind", symbol: "NM", rank: 40, homepage: "https://nethermind.io", ats: "greenhouse", slug: "nethermind" },
  { id: "aave", name: "Aave", symbol: "AAVE", rank: 41, homepage: "https://aave.com", ats: "greenhouse", slug: "aave" },
  { id: "makerdao", name: "MakerDAO", symbol: "MKR", rank: 42, homepage: "https://makerdao.com", ats: "greenhouse", slug: "makerdao" },
  { id: "dydx", name: "dYdX", symbol: "DYDX", rank: 43, homepage: "https://dydx.exchange", ats: "greenhouse", slug: "dydx" },
  // Additional Greenhouse companies
  { id: "robinhood", name: "Robinhood", symbol: "HOOD", rank: 44, homepage: "https://robinhood.com", ats: "greenhouse", slug: "robinhood" },
  { id: "gemini", name: "Gemini", symbol: "GUSD", rank: 45, homepage: "https://gemini.com", ats: "greenhouse", slug: "gemini" },
  { id: "blockchain-com", name: "Blockchain.com", symbol: "BC", rank: 46, homepage: "https://blockchain.com", ats: "greenhouse", slug: "blockchain" },
  { id: "bitstamp", name: "Bitstamp", symbol: "BSTMP", rank: 47, homepage: "https://bitstamp.net", ats: "greenhouse", slug: "bitstamp" },
  { id: "compound", name: "Compound Labs", symbol: "COMP", rank: 48, homepage: "https://compound.finance", ats: "greenhouse", slug: "compoundlabs" },
  { id: "lido", name: "Lido", symbol: "LDO", rank: 49, homepage: "https://lido.fi", ats: "greenhouse", slug: "lido" },
  { id: "quicknode", name: "QuickNode", symbol: "QN", rank: 50, homepage: "https://quicknode.com", ats: "greenhouse", slug: "quicknode" },
  { id: "certik", name: "CertiK", symbol: "CTK", rank: 51, homepage: "https://certik.com", ats: "greenhouse", slug: "certik" },
  { id: "messari", name: "Messari", symbol: "MSRI", rank: 52, homepage: "https://messari.io", ats: "greenhouse", slug: "messari" },
  { id: "nansen", name: "Nansen", symbol: "NAN", rank: 53, homepage: "https://nansen.ai", ats: "greenhouse", slug: "nansen" },
  { id: "chiliz", name: "Chiliz", symbol: "CHZ", rank: 54, homepage: "https://chiliz.com", ats: "greenhouse", slug: "chiliz" },
  { id: "mina", name: "Mina Foundation", symbol: "MINA", rank: 55, homepage: "https://minaprotocol.com", ats: "greenhouse", slug: "minafoundation" },
  { id: "obol", name: "Obol Labs", symbol: "OBOL", rank: 56, homepage: "https://obol.tech", ats: "greenhouse", slug: "obol" },
  { id: "fuel-labs", name: "Fuel Labs", symbol: "FUEL", rank: 57, homepage: "https://fuel.network", ats: "greenhouse", slug: "fuellabs" },
  { id: "coinmarketcap", name: "CoinMarketCap", symbol: "CMC", rank: 58, homepage: "https://coinmarketcap.com", ats: "greenhouse", slug: "coinmarketcap" },
  { id: "coingecko", name: "CoinGecko", symbol: "CG", rank: 59, homepage: "https://coingecko.com", ats: "greenhouse", slug: "coingecko" },
  { id: "zksync", name: "Matter Labs (zkSync)", symbol: "ZK", rank: 60, homepage: "https://matterlabs.dev", ats: "greenhouse", slug: "matterlabs" },
  { id: "moralis", name: "Moralis", symbol: "MOR", rank: 61, homepage: "https://moralis.io", ats: "greenhouse", slug: "moralis" },
  { id: "dfinity", name: "DFINITY (ICP)", symbol: "ICP", rank: 62, homepage: "https://dfinity.org", ats: "greenhouse", slug: "dfinity" },
  { id: "celo", name: "cLabs (Celo)", symbol: "CELO", rank: 63, homepage: "https://celo.org", ats: "greenhouse", slug: "clabs" },
  { id: "arweave", name: "Arweave", symbol: "AR", rank: 64, homepage: "https://arweave.org", ats: "greenhouse", slug: "arweave" },
  { id: "marinade", name: "Marinade Finance", symbol: "MNDE", rank: 65, homepage: "https://marinade.finance", ats: "greenhouse", slug: "marinade" },
  { id: "sei", name: "Sei Labs", symbol: "SEI", rank: 66, homepage: "https://sei.io", ats: "greenhouse", slug: "seilabs" },
  { id: "injective", name: "Injective", symbol: "INJ", rank: 67, homepage: "https://injective.com", ats: "greenhouse", slug: "injective" },
  { id: "tensor", name: "Tensor", symbol: "TNSR", rank: 68, homepage: "https://tensor.trade", ats: "greenhouse", slug: "tensor" },
  { id: "pyth", name: "Pyth Network", symbol: "PYTH", rank: 69, homepage: "https://pyth.network", ats: "greenhouse", slug: "pythnetwork" },
  { id: "iron-fish", name: "Iron Fish", symbol: "IRON", rank: 70, homepage: "https://ironfish.network", ats: "greenhouse", slug: "ironfish" },
  { id: "forte", name: "Forte", symbol: "FORTE", rank: 71, homepage: "https://forte.io", ats: "greenhouse", slug: "forte" },
  { id: "galaxy-digital", name: "Galaxy Digital", symbol: "GLXY", rank: 72, homepage: "https://galaxy.com", ats: "greenhouse", slug: "galaxydigitalservices" },
  { id: "securitize", name: "Securitize", symbol: "SEC", rank: 73, homepage: "https://securitize.io", ats: "greenhouse", slug: "securitize" },
  { id: "halliday", name: "Halliday", symbol: "HALL", rank: 74, homepage: "https://halliday.xyz", ats: "greenhouse", slug: "halliday" },
  { id: "fluence", name: "Fluence", symbol: "FLT", rank: 75, homepage: "https://fluence.network", ats: "greenhouse", slug: "fluence" },

  // === LEVER ===
  { id: "paradigm", name: "Paradigm", symbol: "PARA", rank: 76, homepage: "https://paradigm.xyz", ats: "lever", slug: "paradigm" },
  { id: "a16z-crypto", name: "a16z crypto", symbol: "A16Z", rank: 77, homepage: "https://a16zcrypto.com", ats: "lever", slug: "a16zcrypto" },
  { id: "pantera", name: "Pantera Capital", symbol: "PNTR", rank: 78, homepage: "https://panteracapital.com", ats: "lever", slug: "panteracapital" },
  { id: "polychain", name: "Polychain Capital", symbol: "POLY", rank: 79, homepage: "https://polychain.capital", ats: "lever", slug: "polychaincapital" },
  { id: "dragonfly", name: "Dragonfly", symbol: "DFLY", rank: 80, homepage: "https://dragonfly.xyz", ats: "lever", slug: "dragonfly-xyz" },
  { id: "multicoin", name: "Multicoin Capital", symbol: "MULTI", rank: 81, homepage: "https://multicoin.capital", ats: "lever", slug: "multicoin-capital" },
  { id: "coinlist", name: "CoinList", symbol: "CLIST", rank: 82, homepage: "https://coinlist.co", ats: "lever", slug: "coinlist" },
  { id: "hashicorp-web3", name: "Gauntlet", symbol: "GNTL", rank: 83, homepage: "https://gauntlet.network", ats: "lever", slug: "gauntlet" },
  { id: "syndica", name: "Syndica", symbol: "SYND", rank: 84, homepage: "https://syndica.io", ats: "lever", slug: "syndica" },
  { id: "jump-crypto", name: "Jump Crypto", symbol: "JUMP", rank: 85, homepage: "https://jumpcrypto.com", ats: "lever", slug: "jumpcrypto" },
  { id: "electric-capital", name: "Electric Capital", symbol: "ELEC", rank: 86, homepage: "https://electriccapital.com", ats: "lever", slug: "electric-capital" },
  { id: "nascent", name: "Nascent", symbol: "NASC", rank: 87, homepage: "https://nascent.xyz", ats: "lever", slug: "nascent" },
  { id: "variant", name: "Variant Fund", symbol: "VRNT", rank: 88, homepage: "https://variant.fund", ats: "lever", slug: "variant" },
  { id: "delphi", name: "Delphi Digital", symbol: "DLPH", rank: 89, homepage: "https://delphidigital.io", ats: "lever", slug: "delphidigital" },
  { id: "foresight-ventures", name: "Foresight Ventures", symbol: "FORE", rank: 90, homepage: "https://foresightventures.com", ats: "lever", slug: "foresight-ventures" },

  // === ASHBY ===
  { id: "worldcoin", name: "Worldcoin (TFH)", symbol: "WLD", rank: 91, homepage: "https://worldcoin.org", ats: "ashby", slug: "Worldcoin" },
  { id: "wormhole-ashby", name: "Wormhole (Ashby)", symbol: "W", rank: 92, homepage: "https://wormhole.com", ats: "ashby", slug: "Wormhole" },
  { id: "monad", name: "Monad", symbol: "MON", rank: 93, homepage: "https://monad.xyz", ats: "ashby", slug: "monad" },
  { id: "espresso-systems", name: "Espresso Systems", symbol: "ESPR", rank: 94, homepage: "https://espressosys.com", ats: "ashby", slug: "espresso" },
  { id: "lit-protocol", name: "Lit Protocol", symbol: "LIT", rank: 95, homepage: "https://litprotocol.com", ats: "ashby", slug: "LitProtocol" },
  { id: "privy", name: "Privy", symbol: "PRVY", rank: 96, homepage: "https://privy.io", ats: "ashby", slug: "Privy" },
  { id: "dynamic", name: "Dynamic", symbol: "DYN", rank: 97, homepage: "https://dynamic.xyz", ats: "ashby", slug: "Dynamic" },
  { id: "berachain", name: "Berachain", symbol: "BERA", rank: 98, homepage: "https://berachain.com", ats: "ashby", slug: "berachain" },
  { id: "eclipse", name: "Eclipse", symbol: "ECLP", rank: 99, homepage: "https://eclipse.xyz", ats: "ashby", slug: "Eclipse" },
  { id: "movement", name: "Movement Labs", symbol: "MOVE", rank: 100, homepage: "https://movementlabs.xyz", ats: "ashby", slug: "MovementLabs" },

  // === EXTRA VERIFIED ===
  { id: "okx", name: "OKX", symbol: "OKB", rank: 101, homepage: "https://okx.com", ats: "greenhouse", slug: "okx" },
  { id: "bybit", name: "Bybit", symbol: "BYB", rank: 102, homepage: "https://bybit.com", ats: "greenhouse", slug: "bybit" },
];

// ---------------------------------------------------------------------------
// ATS API checkers
// ---------------------------------------------------------------------------
async function checkGreenhouse(slug: string): Promise<{ ok: boolean; jobs: number; url: string }> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, jobs: 0, url };
    const data = (await res.json()) as { jobs?: unknown[] };
    return { ok: true, jobs: data.jobs?.length ?? 0, url: `https://boards.greenhouse.io/${slug}` };
  } catch {
    return { ok: false, jobs: 0, url };
  }
}

async function checkLever(slug: string): Promise<{ ok: boolean; jobs: number; url: string }> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, jobs: 0, url };
    const data = (await res.json()) as unknown[];
    return { ok: true, jobs: Array.isArray(data) ? data.length : 0, url: `https://jobs.lever.co/${slug}` };
  } catch {
    return { ok: false, jobs: 0, url };
  }
}

async function checkAshby(slug: string): Promise<{ ok: boolean; jobs: number; url: string }> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, jobs: 0, url };
    const data = (await res.json()) as { jobs?: unknown[] };
    return { ok: true, jobs: data.jobs?.length ?? 0, url: `https://jobs.ashbyhq.com/${slug}` };
  } catch {
    return { ok: false, jobs: 0, url };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== build-cache-fast ===`);
  console.log(`Checking ${COMPANIES.length} crypto companies...\n`);

  // Run all checks in parallel
  const results = await Promise.all(
    COMPANIES.map(async (co): Promise<CareerProject & { jobCount: number }> => {
      let result: { ok: boolean; jobs: number; url: string };

      switch (co.ats) {
        case "greenhouse":
          result = await checkGreenhouse(co.slug);
          break;
        case "lever":
          result = await checkLever(co.slug);
          break;
        case "ashby":
          result = await checkAshby(co.slug);
          break;
      }

      if (result.ok) {
        console.log(`  [OK]  ${co.name} (${co.ats}/${co.slug}) — ${result.jobs} jobs`);
      } else {
        console.log(`  [--]  ${co.name} (${co.ats}/${co.slug}) — board not found`);
      }

      return {
        id: co.id,
        name: co.name,
        symbol: co.symbol,
        rank: co.rank,
        homepage: co.homepage,
        careerUrl: result.ok ? result.url : null,
        atsType: result.ok ? co.ats : null,
        atsId: result.ok ? co.slug : null,
        jobCount: result.jobs,
      };
    })
  );

  // Stats
  const found = results.filter((r) => r.careerUrl);
  const totalJobs = found.reduce((sum, r) => sum + r.jobCount, 0);
  console.log(`\n--- Results ---`);
  console.log(`Boards found: ${found.length}/${results.length}`);
  console.log(`Total open positions: ${totalJobs}\n`);

  // Write career-cache.json (without jobCount field, matches CareerProject interface)
  const cacheData: CareerProject[] = results.map(({ jobCount, ...rest }) => rest);
  const cachePath = path.resolve(import.meta.dirname, "..", "career-cache.json");
  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  console.log(`Wrote ${cachePath}`);

  // Populate DB
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("No DATABASE_URL — skipping DB insert");
    return;
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log("Upserting into career_projects table...");

  // Use raw SQL for upsert since drizzle pg-core doesn't have onConflictDoUpdate for pgTable easily
  for (const r of results) {
    await client`
      INSERT INTO career_projects (id, name, symbol, rank, homepage, career_url, ats_type, ats_id, job_count, updated_at)
      VALUES (${r.id}, ${r.name}, ${r.symbol}, ${r.rank}, ${r.homepage}, ${r.careerUrl}, ${r.atsType}, ${r.atsId}, ${r.jobCount}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        rank = EXCLUDED.rank,
        homepage = EXCLUDED.homepage,
        career_url = EXCLUDED.career_url,
        ats_type = EXCLUDED.ats_type,
        ats_id = EXCLUDED.ats_id,
        job_count = EXCLUDED.job_count,
        updated_at = NOW()
    `;
  }

  const count = await client`SELECT count(*) as c FROM career_projects`;
  console.log(`DB now has ${count[0].c} career_projects rows`);

  await client.end();
  console.log("Done!\n");
}

main();
