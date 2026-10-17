import { describe, expect, it } from "vitest";
import { indiaDate, isRealDate, monthBounds } from "../src/lib/dates";
import { calendarDays, dateAllowed, monthAllowed, shiftMonth } from "../src/lib/calendar";
import { toPaise, toRupees } from "../src/lib/money";
import { earningInputSchema } from "../src/lib/earnings";
import { isOfficialUrl, helpGenerationSchema, helpInputSchema, helpOutputSchema } from "../src/lib/guidance";
import { complaintFactsSchema } from "../src/lib/complaints";
import { localeFor } from "../src/lib/locale";
import { featureCopy } from "../src/lib/feature-copy";
import { messages } from "../src/lib/i18n";
import { occupationFor } from "../src/lib/worker-types";

describe("money is exact and bounded", () => {
  it("preserves paise without floating point multiplication", () => {
    expect(toPaise("0.29")).toBe(29);
    expect(toPaise("900.50")! - toPaise("200.25")!).toBe(70025);
    expect(toRupees(70025)).toBe("700.25");
  });
  it.each(["-1", "1e3", "2.999", "NaN", "₹50", "1,000", "1000000.01", ""])(
    "rejects invalid amount %s",
    (value) => {
      expect(toPaise(value)).toBeNull();
    },
  );
});

describe("Indian dates and real calendar validation", () => {
  it("uses India midnight rather than UTC midnight", () => {
    expect(indiaDate(new Date("2026-10-16T19:00:00Z"))).toBe("2026-10-17");
  });
  it("handles leap days and December boundaries", () => {
    expect(isRealDate("2024-02-29")).toBe(true);
    expect(isRealDate("2025-02-29")).toBe(false);
    expect(monthBounds("2026-12")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
  });
});

describe("calendar picker boundaries", () => {
  it("places leap-day dates under the right weekday", () => {
    const days = calendarDays("2024-02");
    expect(days.indexOf("2024-02-01")).toBe(3);
    expect(days.filter(Boolean)).toHaveLength(29);
    expect(days.length % 7).toBe(0);
  });
  it("moves across years and blocks dates beyond allowed limits", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(dateAllowed("2024-02-29", "2020-01-01", "2024-02-29")).toBe(true);
    expect(dateAllowed("2024-03-01", "2020-01-01", "2024-02-29")).toBe(false);
    expect(monthAllowed("2026-10", "2000-01", "2026-10")).toBe(true);
    expect(monthAllowed("2026-11", "2000-01", "2026-10")).toBe(false);
  });
});

describe("earnings input", () => {
  const entry = {
    work_date: "2024-01-01",
    received_paise: 100,
    expense_paise: 0,
    pending_paise: 0,
    minutes_worked: 60,
    note: "",
  };
  it("rejects browser-supplied ownership and fractional paise", () => {
    expect(earningInputSchema.safeParse({ ...entry, user_id: "someone-else" }).success).toBe(false);
    expect(earningInputSchema.safeParse({ ...entry, received_paise: 0.5 }).success).toBe(false);
  });
  it("rejects future dates, invalid days, and more than 24 hours", () => {
    expect(earningInputSchema.safeParse({ ...entry, work_date: "2099-01-01" }).success).toBe(false);
    expect(earningInputSchema.safeParse({ ...entry, work_date: "2024-02-30" }).success).toBe(false);
    expect(earningInputSchema.safeParse({ ...entry, minutes_worked: 1441 }).success).toBe(false);
  });
  it("permits expense-only entries but rejects completely empty entries", () => {
    expect(
      earningInputSchema.safeParse({
        ...entry,
        received_paise: 0,
        minutes_worked: 0,
        expense_paise: 500,
      }).success,
    ).toBe(true);
    expect(
      earningInputSchema.safeParse({ ...entry, received_paise: 0, minutes_worked: 0 }).success,
    ).toBe(false);
  });
});

describe("guidance and complaints", () => {
  it("sends the selected worker context to guidance in English", () => {
    expect(occupationFor("delivery", "")).toBe("Delivery partner");
    expect(occupationFor("dailyWage", "")).toBe("Daily-wage worker");
    expect(occupationFor("other", "  Tailor  ")).toBe("Tailor");
    expect(helpInputSchema.safeParse({
      question: "How can I get help?",
      category: "rights",
      state: "Punjab",
      occupation: occupationFor("other", "Tailor"),
      language: "pa",
    }).success).toBe(true);
  });
  it("accepts Punjabi for both AI flows and provides localized labels", () => {
    expect(helpInputSchema.safeParse({
      question: "ਮੈਨੂੰ ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਚਾਹੀਦੇ ਹਨ?",
      category: "documents",
      state: "Punjab",
      occupation: "Driver",
      language: "pa",
    }).success).toBe(true);
    expect(complaintFactsSchema.safeParse({
      worker_name: "Gurpreet Singh",
      recipient: "Platform support",
      issue_date: "2024-01-01",
      details: "Payment for my completed delivery has not arrived.",
      requested_resolution: "Please release the pending payment.",
      language: "pa",
    }).success).toBe(true);
    expect(localeFor("pa")).toBe("pa-IN");
    expect(messages.pa.earnings).toBe("ਮੇਰੀ ਕਮਾਈ");
    expect(featureCopy("pa").help).toBe("ਮਦਦ ਲਵੋ");
  });
  it("does not accept lookalike official domains or unsafe protocols", () => {
    expect(isOfficialUrl("https://eshram.gov.in/faqs")).toBe(true);
    expect(isOfficialUrl("https://eshram.gov.in.attacker.com/faqs")).toBe(false);
    expect(isOfficialUrl("javascript:alert(1)")).toBe(false);
    expect(isOfficialUrl("https://user:secret@eshram.gov.in/faqs")).toBe(false);
  });
  it("rejects uncited AI guidance", () => {
    expect(
      helpOutputSchema.safeParse({
        answer: "An unsupported answer",
        next_step: "Apply",
        source_ids: [],
      }).success,
    ).toBe(false);
  });
  it("allows an honest insufficient-source signal without a fabricated answer", () => {
    expect(helpGenerationSchema.safeParse({
      status: "insufficient",
      answer: "",
      next_step: "",
      source_ids: [],
    }).success).toBe(true);
    expect(helpOutputSchema.safeParse({
      answer: "",
      next_step: "",
      source_ids: [],
    }).success).toBe(false);
  });
  it("requires the real complaint facts before generating", () => {
    expect(
      complaintFactsSchema.safeParse({
        worker_name: "Worker",
        recipient: "Support",
        issue_date: "2024-01-01",
        details: "",
        requested_resolution: "",
        language: "en",
      }).success,
    ).toBe(false);
  });
});
