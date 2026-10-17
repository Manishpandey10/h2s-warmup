"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { featureCopy, aiErrorKey } from "@/lib/feature-copy";
import { helpInputSchema, helpOutputSchema } from "@/lib/guidance";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import { errorMessage } from "@/lib/i18n";

const responseSchema = helpOutputSchema.extend({ sources: z.array(z.object({ id: z.string().uuid(), title: z.string(), url: z.string().url(), verified_on: z.string() })) });
type Answer = z.infer<typeof responseSchema>;

export function HelpPanel() {
  const { language, t } = useLanguage();
  const c = featureCopy(language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ data: Answer; language: "en" | "hi" } | null>(null);
  const renderError = error ? aiErrorKey(error) ? c[aiErrorKey(error)!] : t[errorMessage(error)] : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = helpInputSchema.safeParse({ question: form.get("question"), category: form.get("category"),
      state: form.get("state"), occupation: form.get("occupation"), language });
    if (!input.success) { setError("INVALID_INPUT"); return; }
    setBusy(true); setError(null); setAnswer(null);
    try {
      const result = responseSchema.safeParse(await apiRequest("/api/help", { method: "POST", body: JSON.stringify(input.data) }));
      if (!result.success) throw new ClientApiError("AI_INVALID_OUTPUT");
      setAnswer({ data: result.data, language: input.data.language });
    } catch (error) { setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR"); }
    finally { setBusy(false); }
  }

  return <div className="narrow"><h1>{c.help}</h1><p className="muted">{c.helpIntro}</p>
    <section className="card"><form onSubmit={submit}><fieldset disabled={busy}>
      <label htmlFor="category">{c.category}</label><select name="category" id="category">
        {(["schemes", "rights", "safety", "documents"] as const).map((value) => <option value={value} key={value}>{c[value]}</option>)}
      </select>
      <div className="form-grid"><div><label htmlFor="state">{c.state}</label><input name="state" id="state" required minLength={2} maxLength={80} autoComplete="address-level1" /></div>
        <div><label htmlFor="occupation">{c.occupation}</label><input name="occupation" id="occupation" required minLength={2} maxLength={100} /></div></div>
      <label htmlFor="question">{c.question}</label><textarea id="question" name="question" required minLength={5} maxLength={1000} rows={4} aria-describedby="help-privacy" />
      <p className="hint" id="help-privacy">{c.helpPrivacy}</p>
      <button className="primary" type="submit">{busy ? c.thinking : c.ask}</button>
    </fieldset></form></section>
    {busy && <p className="notice" role="status">{c.thinking}</p>}
    {renderError && <p className="error" role="alert">{renderError}</p>}
    {answer && <section className="card" aria-live="polite">
      <div lang={answer.language}><p className="answer">{answer.data.answer}</p><h2>{c.nextStep}</h2><p>{answer.data.next_step}</p></div>
      <h2>{c.sources}</h2><ul className="source-list">{answer.data.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><br /><span className="hint">{c.verified}: {source.verified_on}</span></li>)}</ul>
    </section>}
  </div>;
}
