#!/usr/bin/env npx tsx
/**
 * build-agency-cache.ts
 * Probes Greenhouse/Lever/Ashby ATS boards for top global advertising agencies.
 * Writes agency-cache.json for use by src/scanner/sources/agency-cache.ts.
 *
 * Usage: npx tsx scripts/build-agency-cache.ts
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AgencyDef {
  id: string;
  name: string;
  country: string;
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
  /** If true, skip creative-only filter and ingest all role types (for VC portfolio boards) */
  allRoles?: boolean;
}

export interface AgencyProject {
  id: string;
  name: string;
  country: string;
  careerUrl: string | null;
  atsType: "greenhouse" | "lever" | "ashby" | null;
  atsId: string | null;
  /** If true, skip creative-only filter and ingest all role types */
  allRoles?: boolean;
}

// ---------------------------------------------------------------------------
// Agency list — top global advertising/creative agencies with known ATS slugs
// ---------------------------------------------------------------------------
const AGENCIES: AgencyDef[] = [
  // === WPP Group ===
  { id: "ogilvy", name: "Ogilvy", country: "global", ats: "greenhouse", slug: "ogilvy" },
  { id: "akqa", name: "AKQA", country: "global", ats: "greenhouse", slug: "akqa" },
  { id: "grey", name: "Grey", country: "global", ats: "greenhouse", slug: "grey" },
  { id: "wunderman-thompson", name: "VML (Wunderman Thompson)", country: "global", ats: "greenhouse", slug: "vml" },
  { id: "groupm", name: "GroupM", country: "global", ats: "greenhouse", slug: "groupm" },
  { id: "mindshare", name: "Mindshare", country: "global", ats: "greenhouse", slug: "mindshare" },
  { id: "mediacom", name: "MediaCom", country: "global", ats: "greenhouse", slug: "mediacom" },
  { id: "wavemaker", name: "Wavemaker", country: "global", ats: "greenhouse", slug: "wavemaker" },
  { id: "hogarth", name: "Hogarth", country: "global", ats: "greenhouse", slug: "hogarth" },
  { id: "hill-knowlton", name: "Hill & Knowlton", country: "global", ats: "greenhouse", slug: "hillknowlton" },
  { id: "wpp-corporate", name: "WPP Corporate", country: "global", ats: "greenhouse", slug: "wpp" },
  { id: "finsbury-glover", name: "Finsbury Glover Hering", country: "global", ats: "greenhouse", slug: "finsburygloverhering" },

  // === Publicis Groupe ===
  { id: "saatchi", name: "Saatchi & Saatchi", country: "global", ats: "greenhouse", slug: "saatchi" },
  { id: "leo-burnett", name: "Leo Burnett", country: "global", ats: "greenhouse", slug: "leoburnett" },
  { id: "publicis-sapient", name: "Publicis Sapient", country: "global", ats: "greenhouse", slug: "publicissapient" },
  { id: "bbh", name: "BBH (Bartle Bogle Hegarty)", country: "global", ats: "greenhouse", slug: "bbh" },
  { id: "msl-group", name: "MSL Group", country: "global", ats: "greenhouse", slug: "mslgroup" },
  { id: "starcom", name: "Starcom", country: "global", ats: "greenhouse", slug: "starcom" },
  { id: "zenith", name: "Zenith", country: "global", ats: "greenhouse", slug: "zenith" },
  { id: "performics", name: "Performics", country: "global", ats: "greenhouse", slug: "performics" },
  { id: "epsilon", name: "Epsilon", country: "global", ats: "greenhouse", slug: "epsilon" },

  // === IPG (Interpublic) ===
  { id: "mccann", name: "McCann", country: "global", ats: "greenhouse", slug: "mccann" },
  { id: "fcb", name: "FCB", country: "global", ats: "greenhouse", slug: "fcbglobal" },
  { id: "mullenlowe", name: "MullenLowe", country: "global", ats: "greenhouse", slug: "mullenlowe" },
  { id: "rga", name: "R/GA", country: "global", ats: "greenhouse", slug: "rga" },
  { id: "martin-agency", name: "The Martin Agency", country: "us", ats: "greenhouse", slug: "themartinagency" },
  { id: "deutsch", name: "Deutsch", country: "us", ats: "greenhouse", slug: "deutsch" },
  { id: "jack-morton", name: "Jack Morton", country: "global", ats: "greenhouse", slug: "jackmorton" },
  { id: "weber-shandwick", name: "Weber Shandwick", country: "global", ats: "greenhouse", slug: "webershandwick" },
  { id: "mediabrands", name: "IPG Mediabrands", country: "global", ats: "greenhouse", slug: "ipgmediabrands" },
  { id: "initiative", name: "Initiative", country: "global", ats: "greenhouse", slug: "initiative" },
  { id: "um-global", name: "UM (Universal McCann)", country: "global", ats: "greenhouse", slug: "universalmccann" },

  // === Dentsu ===
  { id: "dentsu-creative", name: "Dentsu Creative", country: "global", ats: "greenhouse", slug: "dentsucreative" },
  { id: "dentsu-inc", name: "Dentsu Inc.", country: "global", ats: "greenhouse", slug: "dentsuinc" },
  { id: "isobar", name: "Isobar (Dentsu)", country: "global", ats: "greenhouse", slug: "isobar" },
  { id: "merkle", name: "Merkle", country: "global", ats: "greenhouse", slug: "merkle" },
  { id: "carat-dentsu", name: "Carat (Dentsu)", country: "global", ats: "greenhouse", slug: "carat" },
  { id: "360i", name: "360i", country: "us", ats: "greenhouse", slug: "360i" },

  // === Omnicom ===
  { id: "bbdo", name: "BBDO", country: "global", ats: "greenhouse", slug: "bbdo" },
  { id: "ddb", name: "DDB", country: "global", ats: "greenhouse", slug: "ddb" },
  { id: "tbwa", name: "TBWA", country: "global", ats: "greenhouse", slug: "tbwa" },
  { id: "interbrand", name: "Interbrand", country: "global", ats: "greenhouse", slug: "interbrand" },
  { id: "porter-novelli", name: "Porter Novelli", country: "global", ats: "greenhouse", slug: "porternovelli" },
  { id: "fleishman", name: "FleishmanHillard", country: "global", ats: "greenhouse", slug: "fleishmanhillard" },
  { id: "omnicom-group", name: "Omnicom Group", country: "global", ats: "greenhouse", slug: "omnicomgroup" },
  { id: "ddb-global", name: "DDB Global", country: "global", ats: "lever", slug: "ddb" },
  { id: "phd-media", name: "PHD Media", country: "global", ats: "greenhouse", slug: "phdmedia" },

  // === Independents (Global) ===
  { id: "wieden-kennedy", name: "Wieden+Kennedy", country: "global", ats: "greenhouse", slug: "wk" },
  { id: "droga5", name: "Droga5 (Accenture Song)", country: "global", ats: "greenhouse", slug: "droga5" },
  { id: "72andsunny", name: "72andSunny", country: "global", ats: "greenhouse", slug: "72andsunny" },
  { id: "anomaly", name: "Anomaly", country: "global", ats: "lever", slug: "anomaly" },
  { id: "mother", name: "Mother", country: "global", ats: "greenhouse", slug: "mother" },
  { id: "cpb", name: "CP+B", country: "global", ats: "greenhouse", slug: "cpb" },
  { id: "sid-lee", name: "Sid Lee", country: "global", ats: "greenhouse", slug: "sidlee" },
  { id: "huge", name: "Huge", country: "global", ats: "greenhouse", slug: "hugeinc" },
  { id: "critical-mass", name: "Critical Mass", country: "global", ats: "greenhouse", slug: "criticalmass" },
  { id: "accenture-song", name: "Accenture Song", country: "global", ats: "greenhouse", slug: "accenturesong" },
  { id: "publicis-worldwide", name: "Publicis Worldwide", country: "global", ats: "greenhouse", slug: "publicisworldwide" },
  { id: "havas-creative", name: "Havas Creative", country: "global", ats: "greenhouse", slug: "havas" },
  { id: "havas-media", name: "Havas Media", country: "global", ats: "greenhouse", slug: "havasmedia" },
  { id: "havas-health", name: "Havas Health", country: "global", ats: "greenhouse", slug: "havashealth" },
  { id: "arnold-worldwide", name: "Arnold Worldwide", country: "us", ats: "greenhouse", slug: "arnoldworldwide" },
  { id: "draftfcb", name: "FCB Health", country: "us", ats: "greenhouse", slug: "fcbhealth" },

  // === Australian agencies ===
  { id: "clemenger-bbdo", name: "Clemenger BBDO", country: "au", ats: "greenhouse", slug: "clemenger" },
  { id: "che-proximity", name: "CHE Proximity", country: "au", ats: "greenhouse", slug: "cheproximity" },
  { id: "the-monkeys", name: "The Monkeys (Accenture Song AU)", country: "au", ats: "greenhouse", slug: "themonkeys" },
  { id: "thinkerbell", name: "Thinkerbell", country: "au", ats: "greenhouse", slug: "thinkerbell" },
  { id: "colenso-bbdo", name: "Colenso BBDO", country: "nz", ats: "greenhouse", slug: "colenso" },
  { id: "host-havas", name: "Host/Havas", country: "au", ats: "greenhouse", slug: "hosthavas" },
  { id: "ddb-au", name: "DDB Australia", country: "au", ats: "greenhouse", slug: "ddbsydney" },
  { id: "tbwa-au", name: "TBWA\\Sydney", country: "au", ats: "greenhouse", slug: "tbwasydney" },
  { id: "jwt-au", name: "JWT Sydney", country: "au", ats: "greenhouse", slug: "jwt" },
  { id: "saatchi-au", name: "Saatchi & Saatchi Sydney", country: "au", ats: "greenhouse", slug: "saatchiaustralia" },
  { id: "leo-burnett-au", name: "Leo Burnett Sydney", country: "au", ats: "greenhouse", slug: "leoburnettaustralia" },
  { id: "mccann-au", name: "McCann Sydney", country: "au", ats: "greenhouse", slug: "mccannsydney" },
  { id: "grey-au", name: "Grey Australia", country: "au", ats: "greenhouse", slug: "greyaustralia" },
  { id: "ogilvy-au", name: "Ogilvy Australia", country: "au", ats: "greenhouse", slug: "ogilvyaustralia" },
  { id: "whybin-tbwa", name: "Whybin TBWA", country: "au", ats: "greenhouse", slug: "whybintbwa" },
  { id: "dentsu-au", name: "Dentsu Australia", country: "au", ats: "greenhouse", slug: "dentsuaustralia" },

  // === Lever-based agencies ===
  // wk on lever not valid — WK is on greenhouse/wk
  { id: "bbh-lever", name: "BBH (Lever)", country: "global", ats: "lever", slug: "bbh" },
  { id: "droga5-lever", name: "Droga5 (Lever)", country: "global", ats: "lever", slug: "droga5" },
  { id: "crispin-lever", name: "Crispin Porter Bogusky", country: "global", ats: "lever", slug: "crispinporterbogusky" },
  { id: "serviceplan", name: "Serviceplan", country: "global", ats: "lever", slug: "serviceplan" },
  { id: "edelman", name: "Edelman", country: "global", ats: "lever", slug: "edelman" },
  { id: "ketchum", name: "Ketchum", country: "global", ats: "lever", slug: "ketchum" },
  { id: "golin", name: "GolinHarris", country: "global", ats: "lever", slug: "golin" },
  { id: "iab", name: "IAB (Interactive Advertising Bureau)", country: "us", ats: "lever", slug: "iab" },

  // === Ashby-based agencies ===
  { id: "adam-eve-ddb", name: "adam&eveDDB", country: "uk", ats: "ashby", slug: "adamandeveddb" },
  { id: "amy-bbdo", name: "AMV BBDO", country: "uk", ats: "ashby", slug: "amvbbdo" },

  // === Additional found boards ===
  { id: "iris-worldwide", name: "Iris Worldwide", country: "global", ats: "greenhouse", slug: "iris" },
  { id: "zeno-group", name: "Zeno Group", country: "global", ats: "lever", slug: "zenogroup" },

  // === VC firms — portfolio-wide job boards (allRoles: true = no creative filter) ===
  { id: "a16z", name: "a16z (Andreessen Horowitz)", country: "us", ats: "greenhouse", slug: "a16z", allRoles: true },
  { id: "a16z-crypto", name: "a16z Crypto", country: "us", ats: "greenhouse", slug: "a16zcrypto", allRoles: true },
  { id: "sequoia-scout", name: "Sequoia Capital (internal)", country: "us", ats: "greenhouse", slug: "sequoiacapital", allRoles: true },
  { id: "general-catalyst", name: "General Catalyst", country: "us", ats: "greenhouse", slug: "generalcatalyst", allRoles: true },
  { id: "accel", name: "Accel Partners", country: "us", ats: "greenhouse", slug: "accel", allRoles: true },
  { id: "bessemer", name: "Bessemer Venture Partners", country: "us", ats: "greenhouse", slug: "bvp", allRoles: true },
  { id: "lightspeed", name: "Lightspeed Venture Partners", country: "us", ats: "greenhouse", slug: "lightspeedventurepartners", allRoles: true },
  { id: "index-ventures", name: "Index Ventures", country: "global", ats: "greenhouse", slug: "indexventures", allRoles: true },
  { id: "battery-ventures", name: "Battery Ventures", country: "us", ats: "greenhouse", slug: "batteryventures", allRoles: true },
  { id: "nea", name: "NEA", country: "us", ats: "greenhouse", slug: "nea", allRoles: true },
  { id: "kpcb", name: "Kleiner Perkins", country: "us", ats: "greenhouse", slug: "kleinerperkins", allRoles: true },
  { id: "founders-fund", name: "Founders Fund", country: "us", ats: "greenhouse", slug: "foundersfund", allRoles: true },
  { id: "benchmark", name: "Benchmark Capital", country: "us", ats: "greenhouse", slug: "benchmark", allRoles: true },
  { id: "first-round", name: "First Round Capital", country: "us", ats: "greenhouse", slug: "firstround", allRoles: true },
  { id: "greylock", name: "Greylock Partners", country: "us", ats: "greenhouse", slug: "greylock", allRoles: true },
  { id: "insight-partners", name: "Insight Partners", country: "us", ats: "greenhouse", slug: "insightpartners", allRoles: true },
  { id: "tiger-global", name: "Tiger Global", country: "us", ats: "greenhouse", slug: "tigerglobal", allRoles: true },
  { id: "softbank-vision", name: "SoftBank Vision Fund", country: "global", ats: "greenhouse", slug: "softbankvisionfund", allRoles: true },

  // === VC firms — Lever ===
  { id: "a16z-lever", name: "a16z (Lever check)", country: "us", ats: "lever", slug: "andreessen-horowitz", allRoles: true },
  { id: "sequoia-lever", name: "Sequoia (Lever check)", country: "us", ats: "lever", slug: "sequoiacap", allRoles: true },
  { id: "khosla-lever", name: "Khosla Ventures", country: "us", ats: "lever", slug: "khoslaventures", allRoles: true },
  { id: "felicis-lever", name: "Felicis Ventures", country: "us", ats: "lever", slug: "felicis", allRoles: true },
  { id: "redpoint-lever", name: "Redpoint Ventures", country: "us", ats: "lever", slug: "redpoint", allRoles: true },
];

// ---------------------------------------------------------------------------
// ATS probers
// ---------------------------------------------------------------------------
async function checkGreenhouse(slug: string): Promise<{ ok: boolean; url: string }> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: AbortSignal.timeout(8000) }
    );
    return { ok: res.ok, url: `https://boards.greenhouse.io/${slug}` };
  } catch {
    return { ok: false, url: "" };
  }
}

async function checkLever(slug: string): Promise<{ ok: boolean; url: string }> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { ok: false, url: "" };
    const data = (await res.json()) as unknown[];
    return { ok: Array.isArray(data), url: `https://jobs.lever.co/${slug}` };
  } catch {
    return { ok: false, url: "" };
  }
}

async function checkAshby(slug: string): Promise<{ ok: boolean; url: string }> {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
      { signal: AbortSignal.timeout(8000) }
    );
    return { ok: res.ok, url: `https://jobs.ashbyhq.com/${slug}` };
  } catch {
    return { ok: false, url: "" };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== build-agency-cache ===`);
  console.log(`Probing ${AGENCIES.length} advertising agencies...\n`);

  const results = await Promise.all(
    AGENCIES.map(async (ag): Promise<AgencyProject> => {
      let result: { ok: boolean; url: string };

      switch (ag.ats) {
        case "greenhouse":
          result = await checkGreenhouse(ag.slug);
          break;
        case "lever":
          result = await checkLever(ag.slug);
          break;
        case "ashby":
          result = await checkAshby(ag.slug);
          break;
      }

      const status = result.ok ? "[OK] " : "[--] ";
      console.log(`  ${status} ${ag.name} (${ag.ats}/${ag.slug})${result.ok ? " — found" : ""}`);

      return {
        id: ag.id,
        name: ag.name,
        country: ag.country,
        careerUrl: result.ok ? result.url : null,
        atsType: result.ok ? ag.ats : null,
        atsId: result.ok ? ag.slug : null,
        allRoles: ag.allRoles ?? false,
      };
    })
  );

  const found = results.filter((r) => r.careerUrl);
  console.log(`\n--- Results ---`);
  console.log(`Boards found: ${found.length}/${results.length}`);
  console.log(`Found agencies:`);
  for (const r of found) {
    console.log(`  ${r.name} — ${r.careerUrl}`);
  }

  const cachePath = path.resolve(process.cwd(), "agency-cache.json");
  fs.writeFileSync(cachePath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${cachePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
