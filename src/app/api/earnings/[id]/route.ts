import { z } from "zod";
import { authenticatedDatabase, ApiError, apiFailure, json, limitedJson } from "@/lib/api";
import { earningInputSchema } from "@/lib/earnings";

type Context = { params: Promise<{ id: string }> };
async function recordId(context: Context) {
  const parsed = z.string().uuid().safeParse((await context.params).id);
  if (!parsed.success) throw new ApiError(400, "INVALID_INPUT");
  return parsed.data;
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const id = await recordId(context);
    const body = earningInputSchema.safeParse(await limitedJson(request));
    if (!body.success) throw new ApiError(400, "INVALID_INPUT");
    const { data, error } = await db.from("earnings").update(body.data).eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    if (!data) throw new ApiError(404, "NOT_FOUND");
    return json({ saved: true });
  } catch (error) { return apiFailure(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const id = await recordId(context);
    const { data, error } = await db.from("earnings").delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    if (!data) throw new ApiError(404, "NOT_FOUND");
    return json({ deleted: true });
  } catch (error) { return apiFailure(error); }
}
