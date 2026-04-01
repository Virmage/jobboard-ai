#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import { checkAlerts } from "../src/lib/alerts.js";

async function main() {
  console.log("Running alert check...");
  await checkAlerts();
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Alert check failed:", e);
  process.exit(1);
});
