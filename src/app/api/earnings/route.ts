import { z } from "zod";
import { authenticatedDatabase, ApiError, apiFailure, json, limitedJson } from "@/lib/api";
import { earningInputSchema, earningsResponseSchema, PAGE_SIZE } from "@/lib/earnings";
import { monthBounds } from "@/lib/dates";

const querySchema = z.object({
  month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
  page: z.coerce.number().int().min(0).max(100_000),
});

export async function GET(request: Request) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const url = new URL(request.url);
    const query = querySchema.safeParse({
      month: url.searchParams.get("month"),
      page: url.searchParams.get("page") ?? 0,
    });
    if (!query.success) throw new ApiError(400, "INVALID_INPUT");
    const { month, page } = query.data;
    const { start, end } = monthBounds(month);
    const [records, totals] = await Promise.all([
      db
        .from("earnings")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .gte("work_date", start)
        .lt("work_date", end)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      db.rpc("earnings_month_summary", { p_month: start }),
    ]);
    if (records.error || totals.error) throw new ApiError(503, "DATABASE_ERROR");
    // Summary includes the entire month, not just the visible history page.
    const result = earningsResponseSchema.safeParse({
      entries: records.data,
      count: records.count,
      summary: totals.data?.[0],
    });
    if (!result.success) throw new ApiError(503, "DATABASE_ERROR");
    return json(result.data);
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, userId } = await authenticatedDatabase(request);
    const body = z
      .object({ id: z.string().uuid(), entry: earningInputSchema })
      .strict()
      .safeParse(await limitedJson(request));
    if (!body.success) throw new ApiError(400, "INVALID_INPUT");
    const { error } = await db
      .from("earnings")
      .insert({ ...body.data.entry, id: body.data.id, user_id: userId });
    // Reusing the submission ID prevents a lost network response from creating duplicates.
    if (error?.code === "23505") throw new ApiError(409, "DUPLICATE_ENTRY");
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    return json({ saved: true }, 201);
  } catch (error) {
    return apiFailure(error);
  }
}
