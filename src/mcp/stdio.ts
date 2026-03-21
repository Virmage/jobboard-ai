#!/usr/bin/env node

/**
 * Stdio-only entry point (legacy compatibility).
 * Prefer using src/mcp/index.ts which supports both stdio and HTTP.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[agentjobs-mcp] Error: DATABASE_URL environment variable is required."
    );
    process.exit(1);
  }

  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("[agentjobs-mcp] Server started on stdio transport");

  const shutdown = async () => {
    console.error("[agentjobs-mcp] Shutting down...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("[agentjobs-mcp] Fatal error:", error);
  process.exit(1);
});
