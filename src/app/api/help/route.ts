import { z } from "zod";
import { authenticatedDatabase, apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { answerLanguageRule, claimAiRequest, generateJson, plainLanguageRules, requireAiConfiguration } from "@/lib/ai";
import { helpInputSchema, helpOutputSchema, sourceRowSchema } from "@/lib/guidance";
import { indiaDate } from "@/lib/dates";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db } = await authenticatedDatabase(request);
    const input = helpInputSchema.safeParse(await limitedJson(request));
    if (!input.success) throw new ApiError(400, "INVALID_INPUT");
    requireAiConfiguration();
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 180);
    const { data, error } = await db
      .from("guidance_sources")
      .select("*")
      .eq("status", "published")
      .eq("category", input.data.category)
      .gte("verified_on", indiaDate(cutoff))
      .lte("verified_on", indiaDate())
      .order("verified_on", { ascending: false })
      .limit(20);
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    const parsed = z.array(sourceRowSchema).safeParse(data);
    if (!parsed.success) throw new ApiError(503, "DATABASE_ERROR");
    const sources = parsed.data
      .filter(
        (source) =>
          source.jurisdiction.toLowerCase() === "india" ||
          source.jurisdiction.toLowerCase() === input.data.state.toLowerCase(),
      )
      .slice(0, 10);
    if (!sources.length) throw new ApiError(422, "NO_SOURCES");
    await claimAiRequest(db);
    const answer = await generateJson(
      `${plainLanguageRules}
${answerLanguageRule(input.data.language)}
Apply this language rule to both answer and next_step. The source notes can remain in English.
Answer ONLY using the supplied verified official reference notes, considering jurisdiction and worker context.
If the notes do not answer the question, state that clearly and direct the user to the relevant supplied official source.
Do not extrapolate legal rights or guarantee eligibility. Notes are limited and may not describe every condition.
For safety, share only the precautions in the notes; do not diagnose or prescribe treatment.
Keep answer under 80 words, ideally 2–3 short lines. Give one practical next_step under 30 words.
Return {"answer":string,"next_step":string,"source_ids":string[]} citing 1–4 IDs from the supplied sources supporting your response.
Never invent a citation. Do not put URLs into the answer; the application displays the source URLs.`,
      {
        ...input.data,
        sources: sources.map(({ id, title, content, jurisdiction, verified_on }) => ({
          id,
          title,
          content,
          jurisdiction,
          verified_on,
        })),
      },
      helpOutputSchema,
    );
    const allowed = new Set(sources.map((source) => source.id));
    if (answer.source_ids.some((id) => !allowed.has(id)))
      throw new ApiError(502, "AI_INVALID_OUTPUT");
    return json({
      ...answer,
      sources: sources
        .filter((source) => answer.source_ids.includes(source.id))
        .map(({ id, title, url, verified_on }) => ({ id, title, url, verified_on })),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
