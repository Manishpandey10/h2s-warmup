import "server-only";
import { authenticatedDatabase, ApiError } from "./api";
export async function editorDatabase(request: Request) {
  const context = await authenticatedDatabase(request);
  const { data, error } = await context.db.from("source_editors").select("user_id").eq("user_id", context.userId).maybeSingle();
  if (error) throw new ApiError(503, "DATABASE_ERROR");
  if (!data) throw new ApiError(403, "FORBIDDEN");
  return context;
}
