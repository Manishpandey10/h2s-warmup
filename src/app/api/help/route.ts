import { z } from "zod";
import { authenticatedDatabase, apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { answerLanguageRule, claimAiRequest, generateJson, plainLanguageRules, requireAiConfiguration } from "@/lib/ai";
import { helpGenerationSchema, helpInputSchema, helpOutputSchema, sourceRowSchema } from "@/lib/guidance";
import { indiaDate } from "@/lib/dates";

export const maxDuration = 60;
const helpSourceSchema = sourceRowSchema.pick({
  id: true,
  title: true,
  url: true,
  content: true,
  jurisdiction: true,
  verified_on: true,
});

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
      .select("id,title,url,content,jurisdiction,verified_on")
      .eq("status", "published")
      .eq("category", input.data.category)
      .gte("verified_on", indiaDate(cutoff))
      .lte("verified_on", indiaDate())
      .order("verified_on", { ascending: false })
      .limit(20);
    if (error) throw new ApiError(503, "DATABASE_ERROR");
    const parsed = z.array(helpSourceSchema).safeParse(data);
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
Answer the worker's exact question using only the supplied verified official reference notes. Begin with the useful fact or an honest limit, in words a first-time smartphone user can understand. Use their occupation and state only when a source gives relevant facts.
Give a concrete next step with the exact action or option named in a source. Do not merely say "visit the portal", "check online", or "contact authorities". Explain a portal button only when a supplied note describes it.
For a question about the worker's current enrolment, distinguish what the source lets them check from what this app cannot see. Never imply their e-Shram card itself guarantees insurance or a benefit.
Do not repeat e-Shram/myScheme descriptions for unrelated questions. If no source supports either a direct answer or a specific, relevant check the worker can do, return {"status":"insufficient","answer":"","next_step":"","source_ids":[]}.
Do not extrapolate legal rights or guarantee eligibility. Notes are limited and may not describe every condition.
For safety, share only the precautions in the notes; do not diagnose or prescribe treatment.
Keep answer under 80 words, ideally 2–3 short lines. Give one practical next_step under 30 words.
For a supported question, return {"status":"answered","answer":string,"next_step":string,"source_ids":string[]} citing 1–4 IDs from the supplied sources supporting your response.
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
      helpGenerationSchema,
    );
    if (answer.status === "insufficient") throw new ApiError(422, "NO_RELEVANT_SOURCE");
    const grounded = helpOutputSchema.safeParse({
      answer: answer.answer,
      next_step: answer.next_step,
      source_ids: answer.source_ids,
    });
    if (!grounded.success) throw new ApiError(502, "AI_INVALID_OUTPUT");
    const allowed = new Set(sources.map((source) => source.id));
    if (grounded.data.source_ids.some((id) => !allowed.has(id)))
      throw new ApiError(502, "AI_INVALID_OUTPUT");
    return json({
      ...grounded.data,
      sources: sources
        .filter((source) => grounded.data.source_ids.includes(source.id))
        .map(({ id, title, url, verified_on }) => ({ id, title, url, verified_on })),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
