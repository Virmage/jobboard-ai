#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[jobboard-ai-mcp] Server started on stdio");
}

main().catch((error) => {
  console.error("[jobboard-ai-mcp] Fatal error:", error);
  process.exit(1);
});
