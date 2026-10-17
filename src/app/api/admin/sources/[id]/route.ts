import { z } from "zod";
import { editorDatabase } from "@/lib/admin";
import { apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { sourceInputSchema } from "@/lib/guidance";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { db, userId } = await editorDatabase(request);
    const id = z
      .string()
      .uuid()
      .safeParse((await context.params).id);
    const input = sourceInputSchema.safeParse(await limitedJson(request, 16384));
    if (!id.success || !input.success) throw new ApiError(400, "INVALID_INPUT");
    const { data, error } = await db
      .from("guidance_sources")
      .update(input.data)
      .eq("id", id.data)
      .eq("owner_id", userId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    if (!data) throw new ApiError(404, "NOT_FOUND");
    return json({ saved: true });
  } catch (error) {
    return apiFailure(error);
  }
}
