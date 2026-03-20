#!/usr/bin/env node

/**
 * CLI entry point for the JobBoard AI MCP server.
 *
 * Usage:
 *   npx jobboard-ai-mcp
 *
 * Environment:
 *   DATABASE_URL          -- Postgres connection string (for direct DB access)
 *   JOBBOARD_API_URL      -- Base URL of the REST API (e.g. https://jobboard.ai)
 *                            When set, the server uses HTTP calls instead of direct DB access.
 *
 * At least one of DATABASE_URL or JOBBOARD_API_URL must be set.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "../src/mcp/server.js";

async function main() {
  // Validate that we have a data source configured
  if (!process.env.DATABASE_URL && !process.env.JOBBOARD_API_URL) {
    console.error(
      "[jobboard-ai-mcp] Error: Set either DATABASE_URL (direct DB) or JOBBOARD_API_URL (HTTP API) environment variable."
    );
    process.exit(1);
  }

  const mode = process.env.JOBBOARD_API_URL ? "http" : "db";
  console.error(`[jobboard-ai-mcp] Starting in ${mode} mode...`);

  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[jobboard-ai-mcp] Server ready on stdio transport");

  // Graceful shutdown
  const shutdown = async () => {
    console.error("[jobboard-ai-mcp] Shutting down...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("[jobboard-ai-mcp] Fatal error:", error);
  process.exit(1);
});
