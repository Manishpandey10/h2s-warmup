import { z } from "zod";
import { indiaDate, isRealDate } from "./dates";

const amount = z.number().int().min(0).max(100_000_000);
export const earningInputSchema = z
  .object({
    work_date: z
      .string()
      .refine((value) => isRealDate(value) && value >= "2000-01-01" && value <= indiaDate()),
    received_paise: amount,
    expense_paise: amount,
    pending_paise: amount,
    minutes_worked: z.number().int().min(0).max(1440),
    note: z.string().trim().max(500),
  })
  .strict()
  .refine(
    (value) =>
      value.received_paise + value.expense_paise + value.pending_paise + value.minutes_worked > 0,
  );

export const earningRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  work_date: z.string(),
  received_paise: amount,
  expense_paise: amount,
  pending_paise: amount,
  minutes_worked: z.number().int(),
  note: z.string(),
  created_at: z.string(),
});
const total = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const summarySchema = z.object({
  received_paise: total,
  expense_paise: total,
  pending_paise: total,
  minutes_worked: total,
});
export const earningsResponseSchema = z.object({
  entries: z.array(earningRowSchema),
  count: z.number().int().nonnegative(),
  summary: summarySchema,
});
export type Earning = z.infer<typeof earningRowSchema>;
export type EarningInput = z.infer<typeof earningInputSchema>;
export type EarningsResponse = z.infer<typeof earningsResponseSchema>;
export const PAGE_SIZE = 20;
