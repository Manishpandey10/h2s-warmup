import { z } from "zod";
import { authenticatedDatabase, apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { answerLanguageRule, claimAiRequest, generateGroundedJson, plainLanguageRules, requireAiConfiguration } from "@/lib/ai";
import { helpInputSchema, helpOutputSchema } from "@/lib/guidance";
import { indiaDate } from "@/lib/dates";

export const maxDuration = 60;

const answerSchema = z.object({
  status: z.enum(["answered", "insufficient"]),
  answer: z.string().trim().max(900),
  next_step: z.string().trim().max(300),
}).strict();

function safeWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await authenticatedDatabase(request);
    const input = helpInputSchema.safeParse(await limitedJson(request));
    if (!input.success) throw new ApiError(400, "INVALID_INPUT");
    requireAiConfiguration();
    await claimAiRequest(db);

    const { data, grounding } = await generateGroundedJson(
      `${plainLanguageRules}
${answerLanguageRule(input.data.language)}
Use Google Search now to answer this Indian worker's exact question. Prefer current Indian government pages (.gov.in or .nic.in), and base factual claims on cited search results. Do not claim that a scheme, right, payment, or insurance applies to this individual without the relevant conditions.
Start with a useful answer in everyday words. Explain a practical action the worker can take, not merely "visit a website". If the search results do not support a useful answer, return status "insufficient"; never invent details or a generic e-Shram/myScheme answer for an unrelated question.
Keep answer under 100 words and next_step under 35 words. Return JSON only: {"status":"answered"|"insufficient","answer":string,"next_step":string}. Do not include URLs in the text; the app displays citations from Google Search metadata.`,
      input.data,
      answerSchema,
    );

    if (data.status === "insufficient") throw new ApiError(422, "NO_RELEVANT_SOURCE");
    const citedIndices = new Set(
      grounding?.groundingSupports?.flatMap((support) => support.groundingChunkIndices ?? []) ?? [],
    );
    const sources = (grounding?.groundingChunks ?? [])
      .filter((chunk, index) => citedIndices.size === 0 || citedIndices.has(index))
      .filter((chunk) => chunk.web && safeWebUrl(chunk.web.uri) && chunk.web.title.trim())
      .slice(0, 4)
      .map((chunk) => ({
        id: crypto.randomUUID(),
        title: chunk.web!.title.slice(0, 160),
        url: chunk.web!.uri,
        verified_on: indiaDate(),
      }));
    if (!sources.length) throw new ApiError(422, "NO_RELEVANT_SOURCE");
    const answer = helpOutputSchema.safeParse({
      answer: data.answer,
      next_step: data.next_step,
      source_ids: sources.map((source) => source.id),
    });
    if (!answer.success) throw new ApiError(502, "AI_INVALID_OUTPUT");
    return json({
      ...answer.data,
      sources,
      search_suggestions_html: grounding?.searchEntryPoint?.renderedContent ?? "",
    });
  } catch (error) {
    return apiFailure(error);
  }
}
