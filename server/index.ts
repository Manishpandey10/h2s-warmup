/** Standalone Node backend. Shares the same handlers as the one-service Next app. */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { GET as getEarnings, POST as addEarning } from "../src/app/api/earnings/route";
import { PATCH as editEarning, DELETE as deleteEarning } from "../src/app/api/earnings/[id]/route";
import { POST as getHelp } from "../src/app/api/help/route";
import { GET as getComplaints, POST as saveComplaint } from "../src/app/api/complaints/route";
import { POST as draftComplaint } from "../src/app/api/complaints/draft/route";
import { GET as getSources, POST as addSource } from "../src/app/api/admin/sources/route";
import { PATCH as editSource } from "../src/app/api/admin/sources/[id]/route";

type Handler = (request: Request) => Promise<Response>;
const routes: Record<string, Handler> = {
  "GET /api/earnings": getEarnings,
  "POST /api/earnings": addEarning,
  "POST /api/help": getHelp,
  "GET /api/complaints": getComplaints,
  "POST /api/complaints": saveComplaint,
  "POST /api/complaints/draft": draftComplaint,
  "GET /api/admin/sources": getSources,
  "POST /api/admin/sources": addSource,
};

function cors(request: IncomingMessage, response: ServerResponse): boolean {
  const origin = request.headers.origin;
  const allowed = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .trim()
    .replace(/\/$/, "");
  response.setHeader("Vary", "Origin");
  if (origin && origin !== allowed) {
    response.writeHead(403);
    response.end();
    return false;
  }
  if (origin) response.setHeader("Access-Control-Allow-Origin", allowed);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "private, no-store");
  return true;
}

async function handle(incoming: IncomingMessage, outgoing: ServerResponse) {
  if (!cors(incoming, outgoing)) return;
  if (incoming.method === "OPTIONS") {
    outgoing.writeHead(204);
    outgoing.end();
    return;
  }
  const method = incoming.method ?? "GET";
  const url = new URL(incoming.url ?? "/", "http://backend.local");
  if (method === "GET" && url.pathname === "/health") {
    outgoing.writeHead(200, { "Content-Type": "application/json" });
    outgoing.end(JSON.stringify({ status: "ok" }));
    return;
  }
  let handler = routes[`${method} ${url.pathname}`];
  const earningMatch = url.pathname.match(/^\/api\/earnings\/([a-zA-Z0-9-]+)$/);
  if (earningMatch && (method === "PATCH" || method === "DELETE")) {
    const id = earningMatch[1];
    handler = (request) =>
      (method === "PATCH" ? editEarning : deleteEarning)(request, {
        params: Promise.resolve({ id }),
      });
  }
  const sourceMatch = url.pathname.match(/^\/api\/admin\/sources\/([a-zA-Z0-9-]+)$/);
  if (sourceMatch && method === "PATCH") {
    const id = sourceMatch[1];
    handler = (request) => editSource(request, { params: Promise.resolve({ id }) });
  }
  if (!handler) {
    outgoing.writeHead(404, { "Content-Type": "application/json" });
    outgoing.end(JSON.stringify({ error: "NOT_FOUND" }));
    return;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of incoming) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 32768) {
      outgoing.writeHead(413);
      outgoing.end();
      return;
    }
    chunks.push(bytes);
  }
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  const request = new Request(url, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks).toString("utf8"),
  });
  const response = await handler(request);
  outgoing.statusCode = response.status;
  response.headers.forEach((value, name) => outgoing.setHeader(name, value));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}

const server = createServer((request, response) => {
  handle(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "SERVER_ERROR" }));
  });
});
server.requestTimeout = 60_000;
server.headersTimeout = 15_000;
const port = Number(process.env.PORT ?? 3001);
server.listen(port, "0.0.0.0", () => {
  console.log(`RozMitra backend listening on port ${port}`);
});
