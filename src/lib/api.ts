import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseConfig } from "./supabase/config";

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export async function authenticatedDatabase(request: Request) {
  const config = supabaseConfig();
  if (!config) throw new ApiError(503, "NOT_CONFIGURED");
  const header = request.headers.get("authorization") ?? "";
  if (!/^Bearer \S+$/.test(header) || header.length > 8192) throw new ApiError(401, "UNAUTHORIZED");
  const token = header.slice(7);
  const db = createClient(config.url, config.key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  // Verify with Supabase Auth; never trust a browser-supplied user ID or decoded token alone.
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "UNAUTHORIZED");
  return { db, userId: data.user.id };
}

export async function limitedJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "INVALID_INPUT");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_INPUT");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "INVALID_INPUT");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, "INVALID_INPUT"); }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.code }, error.status);
  // Do not send SQL details, auth tokens, or personal records to the browser or logs.
  return json({ error: "SERVER_ERROR" }, 500);
}
