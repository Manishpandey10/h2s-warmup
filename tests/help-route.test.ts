import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(public status: number, public code: string) { super(code); }
  }
  return {
    ApiError,
    authenticatedDatabase: vi.fn(),
    limitedJson: (request: Request) => request.json(),
    json: (body: unknown, status = 200) => Response.json(body, { status }),
    apiFailure: (error: unknown) => error instanceof ApiError
      ? Response.json({ error: error.code }, { status: error.status })
      : Response.json({ error: "SERVER_ERROR" }, { status: 500 }),
  };
});

vi.mock("@/lib/ai", () => ({
  answerLanguageRule: () => "Use the selected language.",
  plainLanguageRules: "Use sourced facts.",
  requireAiConfiguration: vi.fn(),
  claimAiRequest: vi.fn(),
  generateGroundedJson: vi.fn(),
}));

import { authenticatedDatabase } from "@/lib/api";
import { claimAiRequest, generateGroundedJson } from "@/lib/ai";
import { POST } from "../src/app/api/help/route";

const official = { web: { uri: "https://eshram.gov.in/faqs", title: "e-Shram FAQ" } };
const database = { from: vi.fn() };

function request() {
  return new Request("http://localhost/api/help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "How do I check my enrolled scheme?",
      category: "schemes",
      state: "Punjab",
      occupation: "Delivery partner",
      language: "en",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authenticatedDatabase).mockResolvedValue({ db: database } as never);
});

describe("POST /api/help", () => {
  it("answers from live search citations without reading admin sources", async () => {
    vi.mocked(generateGroundedJson).mockResolvedValue({
      data: { status: "answered", answer: "Use the enrolled schemes option.", next_step: "Open your e-Shram account and choose enrolled schemes." },
      grounding: { groundingChunks: [official], groundingSupports: [{ groundingChunkIndices: [0] }] },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sources).toEqual([expect.objectContaining({ title: "e-Shram FAQ", url: official.web.uri })]);
    expect(body.source_ids).toEqual([body.sources[0].id]);
    expect(database.from).not.toHaveBeenCalled();
    expect(claimAiRequest).toHaveBeenCalledOnce();
  });

  it("does not show an uncited AI answer", async () => {
    vi.mocked(generateGroundedJson).mockResolvedValue({
      data: { status: "answered", answer: "Unsupported claim", next_step: "Apply now." },
      grounding: { groundingChunks: [] },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "NO_RELEVANT_SOURCE" });
  });

  it("rejects a model-declared insufficient answer", async () => {
    vi.mocked(generateGroundedJson).mockResolvedValue({
      data: { status: "insufficient", answer: "", next_step: "" },
      grounding: { groundingChunks: [official] },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "NO_RELEVANT_SOURCE" });
  });

  it("rejects unsafe source URLs", async () => {
    vi.mocked(generateGroundedJson).mockResolvedValue({
      data: { status: "answered", answer: "Claim", next_step: "Action" },
      grounding: { groundingChunks: [{ web: { uri: "javascript:alert(1)", title: "Unsafe" } }] },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(422);
  });
});
