import { z } from "zod";
import { indiaDate, isRealDate } from "./dates";

export function isOfficialUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname.endsWith(".gov.in") || url.hostname.endsWith(".nic.in"))
    );
  } catch {
    return false;
  }
}

export const sourceInputSchema = z
  .object({
    title: z.string().trim().min(5).max(160),
    url: z.string().max(1000).refine(isOfficialUrl),
    category: z.enum(["schemes", "rights", "safety", "documents"]),
    content: z.string().trim().min(30).max(3000),
    jurisdiction: z.string().trim().min(2).max(80),
    verified_on: z
      .string()
      .refine((value) => isRealDate(value) && value >= "2020-01-01" && value <= indiaDate()),
  })
  .strict();
export const sourceRowSchema = sourceInputSchema.extend({
  id: z.string().uuid(),
  owner_id: z.string().uuid().nullable(),
  status: z.enum(["draft", "published"]),
  created_at: z.string(),
});
export type GuidanceSource = z.infer<typeof sourceRowSchema>;
export const helpInputSchema = z
  .object({
    question: z.string().trim().min(5).max(1000),
    category: z.enum(["schemes", "rights", "safety", "documents"]),
    state: z.string().trim().min(2).max(80),
    occupation: z.string().trim().min(2).max(100),
    language: z.enum(["en", "hi"]),
  })
  .strict();
export const helpOutputSchema = z
  .object({
    answer: z.string().trim().min(1).max(900),
    next_step: z.string().trim().min(1).max(300),
    source_ids: z.array(z.string().uuid()).min(1).max(4),
  })
  .strict();
