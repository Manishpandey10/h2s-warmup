import { z } from "zod";
import { editorDatabase } from "@/lib/admin";
import { apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { sourceInputSchema } from "@/lib/guidance";

export async function GET(request: Request) {
  try {
    const { db } = await editorDatabase(request);
    const { data, error } = await db.from("guidance_sources").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    return json({ sources: data });
  } catch (error) { return apiFailure(error); }
}

export async function POST(request: Request) {
  try {
    const { db, userId } = await editorDatabase(request);
    const parsed = z.object({ id: z.string().uuid(), source: sourceInputSchema }).strict().safeParse(await limitedJson(request, 16384));
    if (!parsed.success) throw new ApiError(400, "INVALID_INPUT");
    const { error } = await db.from("guidance_sources").insert({ id: parsed.data.id, owner_id: userId, ...parsed.data.source, status: "draft" });
    if (error?.code === "23505") throw new ApiError(409, "DUPLICATE_ENTRY");
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    return json({ saved: true }, 201);
  } catch (error) { return apiFailure(error); }
}
