"use client";

import { browserSupabase } from "./supabase/browser";

export class ClientApiError extends Error {
  constructor(public code: string) { super(code); }
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const { data, error } = await browserSupabase().auth.getSession();
  if (error || !data.session) throw new ClientApiError("UNAUTHORIZED");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (init.body) headers.set("Content-Type", "application/json");
  let response: Response;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  try { response = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" }); }
  catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ClientApiError("NETWORK_ERROR");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "SERVER_ERROR";
    throw new ClientApiError(code);
  }
  return body;
}
