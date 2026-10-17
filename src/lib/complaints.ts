import { z } from "zod";
import { indiaDate, isRealDate } from "./dates";

export const complaintFactsSchema = z.object({
  worker_name: z.string().trim().min(2).max(100), recipient: z.string().trim().min(2).max(160),
  issue_date: z.string().refine((value) => isRealDate(value) && value >= "2000-01-01" && value <= indiaDate()),
  details: z.string().trim().min(20).max(1800), requested_resolution: z.string().trim().min(5).max(500),
  language: z.enum(["en", "hi"])
}).strict();
export const complaintDraftSchema = z.object({ title: z.string().trim().min(3).max(200), body: z.string().trim().min(30).max(5000) }).strict();
export const complaintSaveSchema = z.object({ id: z.string().uuid(), facts: complaintFactsSchema, draft: complaintDraftSchema }).strict();
export const complaintRowSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid(), title: z.string(), body: z.string(), facts: z.unknown(), created_at: z.string()
});
export type ComplaintFacts = z.infer<typeof complaintFactsSchema>;
export type ComplaintDraft = z.infer<typeof complaintDraftSchema>;
