import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(public status: number, public code: string) {
      super(code);
    }
  }
  return {
    ApiError,
    authenticatedDatabase: vi.fn(),
    limitedJson: (request: Request) => request.json(),
    json: (body: unknown, status = 200) => Response.json(body, { status }),
    apiFailure: (error: unknown) =>
      error instanceof ApiError
        ? Response.json({ error: error.code }, { status: error.status })
        : Response.json({ error: "SERVER_ERROR" }, { status: 500 }),
  };
});

vi.mock("@/lib/ai", () => ({
  answerLanguageRule: () => "Use the selected language.",
  plainLanguageRules: "Use verified facts.",
  requireAiConfiguration: vi.fn(),
  claimAiRequest: vi.fn(),
  generateJson: vi.fn(),
}));

import { authenticatedDatabase } from "@/lib/api";
import { claimAiRequest, generateJson } from "@/lib/ai";
import { POST } from "../src/app/api/help/route";

const sourceId = "d09515ae-2ab0-48c4-98d6-58d4c8654490";
const source = {
  id: sourceId,
  title: "Official e-Shram FAQ",
  url: "https://eshram.gov.in/faqs",
  content: "The official FAQ describes how to view enrolled schemes.",
  jurisdiction: "India",
  verified_on: "2026-10-17",
};

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

function databaseResult(sources: unknown[]) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: sources, error: null }),
  };
  return { from: vi.fn().mockReturnValue(query) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authenticatedDatabase).mockResolvedValue({ db: databaseResult([source]) } as never);
});

describe("POST /api/help", () => {
  it("returns a useful answer with only its verified citation", async () => {
    vi.mocked(generateJson).mockResolvedValue({
      status: "answered",
      answer: "Open My Enrolled Schemes to see your status.",
      next_step: "Choose View beside the scheme to read its details.",
      source_ids: [sourceId],
    } as never);

    const response = await POST(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sources).toEqual([{
      id: sourceId,
      title: source.title,
      url: source.url,
      verified_on: source.verified_on,
    }]);
    expect(body).not.toHaveProperty("status");
    expect(claimAiRequest).toHaveBeenCalledOnce();
  });

  it("does not call the model when no reviewed source is available", async () => {
    vi.mocked(authenticatedDatabase).mockResolvedValue({ db: databaseResult([]) } as never);
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "NO_SOURCES" });
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("rejects an unsupported answer instead of sending generic advice", async () => {
    vi.mocked(generateJson).mockResolvedValue({
      status: "insufficient",
      answer: "",
      next_step: "",
      source_ids: [],
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "NO_RELEVANT_SOURCE" });
  });

  it("rejects a citation that was not supplied to the model", async () => {
    vi.mocked(generateJson).mockResolvedValue({
      status: "answered",
      answer: "Claim about another scheme.",
      next_step: "Apply now.",
      source_ids: ["e7a712f1-38fc-44e4-a418-87a4acf0e781"],
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI_INVALID_OUTPUT" });
  });
});
