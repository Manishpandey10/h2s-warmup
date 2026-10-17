import { authenticatedDatabase, apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { complaintSaveSchema } from "@/lib/complaints";

export async function GET(request: Request) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const { data, error } = await db.from("complaints").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    return json({ complaints: data });
  } catch (error) { return apiFailure(error); }
}

export async function POST(request: Request) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const input = complaintSaveSchema.safeParse(await limitedJson(request, 32768));
    if (!input.success) throw new ApiError(400, "INVALID_INPUT");
    const { id, facts, draft } = input.data;
    const { error } = await db.from("complaints").insert({ id, user_id: userId, facts, ...draft });
    if (error?.code === "23505") throw new ApiError(409, "DUPLICATE_ENTRY");
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    return json({ saved: true }, 201);
  } catch (error) { return apiFailure(error); }
}
