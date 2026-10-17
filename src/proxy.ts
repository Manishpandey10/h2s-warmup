import { NextResponse, type NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigin = (process.env.FRONTEND_ORIGIN ?? "").trim().replace(/\/$/, "");
  const sameOrigin = new URL(request.url).origin;

  if (origin && origin !== allowedOrigin && origin !== sameOrigin) {
    return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
  }

  const response =
    request.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    for (const [name, value] of Object.entries(corsHeaders)) {
      response.headers.set(name, value);
    }
  }

  return response;
}

export const config = { matcher: "/api/:path*" };
