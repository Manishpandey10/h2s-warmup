"use client";

import { useState, type FormEvent } from "react";
import { UiIcon, type IconName } from "./ui-icon";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { featureCopy, aiErrorKey } from "@/lib/feature-copy";
import { helpInputSchema, helpOutputSchema } from "@/lib/guidance";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import { errorMessage, type Language } from "@/lib/i18n";
import { occupationFor, workerTypes, type WorkerType } from "@/lib/worker-types";
import { ChoiceSelect } from "./choice-select";
import { LoadingSpinner } from "./loading-spinner";
import { VoiceInput } from "./voice-input";

const workerIcons: Record<WorkerType, IconName> = {
  delivery: "bike",
  driver: "car",
  dailyWage: "hammer",
  domestic: "home",
  other: "briefcase",
};

const responseSchema = helpOutputSchema.extend({
  sources: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      url: z.string().url(),
      verified_on: z.string(),
    }),
  ),
});
type Answer = z.infer<typeof responseSchema>;

export function HelpPanel() {
  const { language, t } = useLanguage();
  const c = featureCopy(language);
  const [busy, setBusy] = useState(false);
  const [workerType, setWorkerType] = useState<WorkerType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ data: Answer; language: Language } | null>(null);
  const renderError = error
    ? aiErrorKey(error)
      ? c[aiErrorKey(error)!]
      : t[errorMessage(error)]
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = helpInputSchema.safeParse({
      question: form.get("question"),
      category: form.get("category"),
      state: form.get("state"),
      occupation: occupationFor(workerType ?? "other", String(form.get("occupation") ?? "")),
      language,
    });
    if (!input.success) {
      setError("INVALID_INPUT");
      return;
    }
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const result = responseSchema.safeParse(
        await apiRequest("/api/help", { method: "POST", body: JSON.stringify(input.data) }),
      );
      if (!result.success) throw new ClientApiError("AI_INVALID_OUTPUT");
      setAnswer({ data: result.data, language: input.data.language });
    } catch (error) {
      setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow page-stack">
      <div className="page-hero">
        <span className="hero-icon"><UiIcon name="sparkles" size={25} /></span>
        <h1>{c.help}</h1>
        <p className="muted">{c.helpIntro}</p>
      </div>
      <section className="card">
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <fieldset className="worker-fieldset">
              <legend>{c.workerType}</legend>
              <p className="hint">{c.workerTypeIntro}</p>
              <div className="worker-grid">
                {workerTypes.map((type) => {
                  return (
                    <label className="worker-option" key={type}>
                      <input
                        type="radio"
                        name="worker-type"
                        value={type}
                        checked={workerType === type}
                        onChange={() => setWorkerType(type)}
                        required
                      />
                      <span className="worker-icon"><UiIcon name={workerIcons[type]} size={24} /></span>
                      <span>{c[type]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {workerType === "other" && (
              <div>
                <label htmlFor="occupation">{c.occupation}</label>
                <input name="occupation" id="occupation" required minLength={2} maxLength={100} />
              </div>
            )}
            <label htmlFor="category">{c.category}</label>
            <ChoiceSelect
              name="category"
              id="category"
              label={c.category}
              options={(["schemes", "rights", "safety", "documents"] as const).map((value) => ({
                value,
                label: c[value],
              }))}
            />
            <label htmlFor="state">{c.state}</label>
            <input
              name="state"
              id="state"
              required
              minLength={2}
              maxLength={80}
              autoComplete="address-level1"
            />
            <label htmlFor="question">{c.question}</label>
            <textarea
              id="question"
              lang={language}
              name="question"
              required
              minLength={5}
              maxLength={1000}
              rows={4}
              aria-describedby="help-privacy"
            />
            <VoiceInput targetId="question" />
            <p className="hint" id="help-privacy">
              {c.helpPrivacy}
            </p>
            <button className="primary" type="submit" aria-busy={busy}>
              {busy && <LoadingSpinner />}
              {busy ? c.thinking : c.ask}
              {!busy && <UiIcon name="arrow" size={19} />}
            </button>
          </fieldset>
        </form>
      </section>
      {renderError && (
        <p className="error" role="alert">
          {renderError}
        </p>
      )}
      {answer && (
        <section className="card answer-card" aria-live="polite">
          <div lang={answer.language}>
            <p className="answer">{answer.data.answer}</p>
            <h2>{c.nextStep}</h2>
            <p>{answer.data.next_step}</p>
          </div>
          <h2>{c.sources}</h2>
          <ul className="source-list">
            {answer.data.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
                <br />
                <span className="hint">
                  {c.verified}: {source.verified_on}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
