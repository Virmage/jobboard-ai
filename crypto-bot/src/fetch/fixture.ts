import { readFileSync } from "node:fs";
import type { Tweet } from "../types";

export function loadFixture(path: string): Tweet[] {
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Fixture at ${path} must be a JSON array of tweets`);
  }
  return parsed as Tweet[];
}
