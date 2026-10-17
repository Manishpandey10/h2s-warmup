import { authenticatedDatabase, apiFailure, ApiError, json, limitedJson } from "@/lib/api";
import { claimAiRequest, generateJson, plainLanguageRules, requireAiConfiguration } from "@/lib/ai";
import { complaintDraftSchema, complaintFactsSchema } from "@/lib/complaints";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db } = await authenticatedDatabase(request);
    const input = complaintFactsSchema.safeParse(await limitedJson(request, 16384));
    if (!input.success) throw new ApiError(400, "INVALID_INPUT");
    requireAiConfiguration();
    await claimAiRequest(db);
    const draft = await generateJson(`${plainLanguageRules}
Prepare a polite factual complaint from ONLY the supplied facts. The user has supplied their name, recipient,
issue date, issue details and requested resolution. Do not add dates, transaction IDs, amounts, evidence,
legal threats, legislation, deadlines, attachments, or assurances not stated by the user.
This is a draft for the worker to review and send themselves. Do not claim legal validity.
Use a brief subject and a short letter, maximum 220 words. Return {"title":string,"body":string}.`, input.data, complaintDraftSchema);
    return json(draft);
  } catch (error) { return apiFailure(error); }
}
