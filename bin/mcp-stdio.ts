#!/usr/bin/env node

/**
 * CLI entry point for the AgentJobs MCP server.
 *
 * Usage:
 *   npx agentjobs-mcp
 *
 * Environment:
 *   DATABASE_URL          -- Postgres connection string (for direct DB access)
 *   AGENTJOBS_API_URL     -- Base URL of the REST API (e.g. https://agentjobs.com)
 *                            When set, the server uses HTTP calls instead of direct DB access.
 *
 * At least one of DATABASE_URL or AGENTJOBS_API_URL must be set.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "../src/mcp/server.js";

async function main() {
  // Validate that we have a data source configured
  if (!process.env.DATABASE_URL && !process.env.AGENTJOBS_API_URL) {
    console.error(
      "[agentjobs-mcp] Error: Set either DATABASE_URL (direct DB) or AGENTJOBS_API_URL (HTTP API) environment variable."
    );
    process.exit(1);
  }

  const mode = process.env.AGENTJOBS_API_URL ? "http" : "db";
  console.error(`[agentjobs-mcp] Starting in ${mode} mode...`);

  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("[agentjobs-mcp] Server ready on stdio transport");

  // Graceful shutdown
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
