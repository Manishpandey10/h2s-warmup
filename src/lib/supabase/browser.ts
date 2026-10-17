"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

let client: SupabaseClient | undefined;
export function browserSupabase(): SupabaseClient {
  if (client) return client;
  const config = supabaseConfig();
  if (!config) throw new Error("SUPABASE_NOT_CONFIGURED");
  client = createClient(config.url, config.key);
  return client;
}
