import { NextRequest, NextResponse } from "next/server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "@/mcp/server";
import type { IncomingMessage, ServerResponse } from "node:http";

// ---------------------------------------------------------------------------
// Session management -- track active SSE transports by session ID
// ---------------------------------------------------------------------------
const sessions = new Map<string, SSEServerTransport>();

// Clean up stale sessions every 5 minutes
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessionTimestamps = new Map<string, number>();

function cleanupStaleSessions() {
  const now = Date.now();
  for (const [id, ts] of sessionTimestamps) {
    if (now - ts > SESSION_TTL_MS) {
      const transport = sessions.get(id);
      if (transport) {
        transport.close().catch(() => {});
      }
      sessions.delete(id);
      sessionTimestamps.delete(id);
    }
  }
}

setInterval(cleanupStaleSessions, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Adapt Next.js request/response to Node.js IncomingMessage/ServerResponse
// ---------------------------------------------------------------------------

/**
 * Create a minimal IncomingMessage-like object from a NextRequest.
 */
function adaptRequest(req: NextRequest, body: string): IncomingMessage {
  const { Readable } = require("node:stream");
  const incoming = new Readable({
    read() {
      this.push(body);
      this.push(null);
    },
  }) as IncomingMessage;

  incoming.method = req.method;
  incoming.url = req.nextUrl.pathname + req.nextUrl.search;
  // Copy headers
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  (incoming as any).headers = headers;

  return incoming;
}

/**
 * Create a minimal ServerResponse-like object that captures the response.
 */
function createCaptureResponse(): {
  res: ServerResponse;
  getResult: () => { status: number; headers: Record<string, string>; body: string };
} {
  const { Writable } = require("node:stream");
  const chunks: Buffer[] = [];
  let statusCode = 200;
  const responseHeaders: Record<string, string> = {};
  let headersSent = false;

  const writable = new Writable({
    write(chunk: Buffer, _encoding: string, callback: () => void) {
      chunks.push(chunk);
      callback();
    },
  });

  const res = writable as unknown as ServerResponse;

  // Patch writeHead
  (res as any).writeHead = (
    code: number,
    headers?: Record<string, string>
  ) => {
    statusCode = code;
    if (headers) {
      Object.assign(responseHeaders, headers);
    }
    headersSent = true;
    return res;
  };

  // Patch setHeader
  (res as any).setHeader = (name: string, value: string) => {
    responseHeaders[name.toLowerCase()] = value;
    return res;
  };

  // Patch getHeader
  (res as any).getHeader = (name: string) => {
    return responseHeaders[name.toLowerCase()];
  };

  (res as any).headersSent = false;
  Object.defineProperty(res, "headersSent", {
    get: () => headersSent,
  });

  (res as any).statusCode = statusCode;

  return {
    res,
    getResult: () => ({
      status: statusCode,
      headers: responseHeaders,
      body: Buffer.concat(chunks).toString("utf-8"),
    }),
  };
}

// ---------------------------------------------------------------------------
// GET /api/mcp -- establish SSE connection
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const server = createMcpServer();

  // Use ReadableStream to create a streaming SSE response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Create a mock ServerResponse that writes SSE events to the stream
      const { Writable } = require("node:stream");
      const writable = new Writable({
        write(chunk: Buffer, _encoding: string, callback: () => void) {
          try {
            controller.enqueue(chunk);
          } catch {
            // Stream may be closed
          }
          callback();
        },
      });

      const mockRes = writable as unknown as ServerResponse;
      let headersSent = false;

      (mockRes as any).writeHead = (
        _code: number,
        headers?: Record<string, string>
      ) => {
        headersSent = true;
        return mockRes;
      };
      (mockRes as any).setHeader = () => mockRes;
      (mockRes as any).getHeader = () => undefined;
      Object.defineProperty(mockRes, "headersSent", {
        get: () => headersSent,
      });
      // SSE write helper
      (mockRes as any).write = (data: string | Buffer) => {
        try {
          const chunk =
            typeof data === "string" ? encoder.encode(data) : data;
          controller.enqueue(chunk);
        } catch {
          // Stream closed
        }
        return true;
      };
      (mockRes as any).end = () => {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      const transport = new SSEServerTransport("/api/mcp", mockRes);
      const sessionId = transport.sessionId;

      sessions.set(sessionId, transport);
      sessionTimestamps.set(sessionId, Date.now());

      transport.onclose = () => {
        sessions.delete(sessionId);
        sessionTimestamps.delete(sessionId);
      };

      try {
        await server.connect(transport);
        await transport.start();
      } catch (error) {
        console.error("[mcp-sse] Connection error:", error);
        sessions.delete(sessionId);
        sessionTimestamps.delete(sessionId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      // Client disconnected
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/mcp -- receive JSON-RPC messages for an existing SSE session
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId query parameter" },
      { status: 400 }
    );
  }

  const transport = sessions.get(sessionId);
  if (!transport) {
    return NextResponse.json(
      {
        error: "Session not found. The SSE connection may have expired.",
      },
      { status: 404 }
    );
  }

  // Update session timestamp
  sessionTimestamps.set(sessionId, Date.now());

  try {
    const body = await request.text();
    const message = JSON.parse(body);

    // Use handleMessage to process the JSON-RPC message
    await transport.handleMessage(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process message: ${message}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/mcp -- close a session
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId query parameter" },
      { status: 400 }
    );
  }

  const transport = sessions.get(sessionId);
  if (transport) {
    await transport.close();
    sessions.delete(sessionId);
    sessionTimestamps.delete(sessionId);
  }

  return NextResponse.json({ ok: true });
}
