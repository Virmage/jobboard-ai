#!/usr/bin/env node

/**
 * AgentJobs — MCP Server entry point
 *
 * Detects transport mode from CLI args or environment:
 *
 *   stdio (default):  For Claude Desktop / local CLI integration
 *     tsx src/mcp/index.ts
 *     tsx src/mcp/index.ts --stdio
 *
 *   http:  For remote access via HTTP + SSE
 *     tsx src/mcp/index.ts --http
 *     tsx src/mcp/index.ts --http --port 3100
 *     MCP_TRANSPORT=http tsx src/mcp/index.ts
 *
 * Environment:
 *   DATABASE_URL   — Postgres connection string (required)
 *   MCP_TRANSPORT  — "stdio" | "http" (default: stdio)
 *   MCP_PORT       — HTTP port when using http transport (default: 3100)
 */

import { config } from "dotenv";

// Load .env.local then .env (Next.js convention)
config({ path: ".env.local" });
config({ path: ".env" });

import { createMcpServer } from "./server.js";

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const hasHttpFlag = args.includes("--http");
const hasStdioFlag = args.includes("--stdio");

const portArgIdx = args.indexOf("--port");
const cliPort =
  portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : undefined;

// Determine transport
const transport =
  hasHttpFlag
    ? "http"
    : hasStdioFlag
      ? "stdio"
      : process.env.MCP_TRANSPORT === "http"
        ? "http"
        : "stdio";

const httpPort = cliPort ?? parseInt(process.env.MCP_PORT ?? "3100", 10);

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  console.error(
    "[agentjobs-mcp] Error: DATABASE_URL environment variable is required."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function main() {
  const server = createMcpServer();

  if (transport === "http") {
    // Dynamic import to avoid loading http deps in stdio mode
    const { SSEServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/sse.js"
    );
    const http = await import("node:http");

    let sseTransport: InstanceType<typeof SSEServerTransport> | null = null;

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${httpPort}`);

      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", transport: "http" }));
        return;
      }

      // SSE endpoint — client connects here to receive events
      if (url.pathname === "/sse" && req.method === "GET") {
        sseTransport = new SSEServerTransport("/messages", res);
        await server.connect(sseTransport);
        console.error("[agentjobs-mcp] SSE client connected");
        return;
      }

      // Messages endpoint — client posts JSON-RPC messages here
      if (url.pathname === "/messages" && req.method === "POST") {
        if (!sseTransport) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "No SSE connection. Connect to /sse first." })
          );
          return;
        }
        await sseTransport.handlePostMessage(req, res);
        return;
      }

      // Info page
      if (url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            name: "AgentJobs MCP Server",
            version: "1.0.0",
            transport: "http+sse",
            endpoints: {
              sse: "/sse",
              messages: "/messages",
              health: "/health",
            },
          })
        );
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    httpServer.listen(httpPort, () => {
      console.error(
        `[agentjobs-mcp] HTTP+SSE server listening on http://localhost:${httpPort}`
      );
      console.error(
        `[agentjobs-mcp] Connect SSE at http://localhost:${httpPort}/sse`
      );
    });
  } else {
    // stdio transport (default) — for Claude Desktop
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("[agentjobs-mcp] Server started on stdio transport");
  }

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
