"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { featureCopy, aiErrorKey } from "@/lib/feature-copy";
import {
  complaintDraftSchema,
  complaintFactsSchema,
  complaintRowSchema,
  type ComplaintDraft,
  type ComplaintFacts,
} from "@/lib/complaints";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import { errorMessage } from "@/lib/i18n";
import { indiaDate } from "@/lib/dates";

const historySchema = z.object({ complaints: z.array(complaintRowSchema) });
function download(title: string, body: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", `${title}\n\n${body}`], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "rozmitra-complaint.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ComplaintPanel() {
  const { language, t } = useLanguage();
  const c = featureCopy(language);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [facts, setFacts] = useState<ComplaintFacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<z.infer<typeof complaintRowSchema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setHistoryError(false);
    apiRequest("/api/complaints", { signal: controller.signal })
      .then((body) => {
        if (!controller.signal.aborted) setHistory(historySchema.parse(body).complaints);
      })
      .catch(() => {
        if (!controller.signal.aborted) setHistoryError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = complaintFactsSchema.safeParse({
      worker_name: form.get("worker_name"),
      recipient: form.get("recipient"),
      issue_date: form.get("issue_date"),
      details: form.get("details"),
      requested_resolution: form.get("resolution"),
      language,
    });
    if (!parsed.success) {
      setError("INVALID_INPUT");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = complaintDraftSchema.safeParse(
        await apiRequest("/api/complaints/draft", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        }),
      );
      if (!result.success) throw new ClientApiError("AI_INVALID_OUTPUT");
      setDraft(result.data);
      setFacts(parsed.data);
      setSaved(false);
      submissionId.current = null;
    } catch (error) {
      setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft || !facts || !complaintDraftSchema.safeParse(draft).success) {
      setError("INVALID_INPUT");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      submissionId.current ??= crypto.randomUUID();
      await apiRequest("/api/complaints", {
        method: "POST",
        body: JSON.stringify({ id: submissionId.current, facts, draft }),
      });
      setSaved(true);
      setRevision((value) => value + 1);
    } catch (error) {
      setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR");
    } finally {
      setSaving(false);
    }
  }

  const renderError = error
    ? aiErrorKey(error)
      ? c[aiErrorKey(error)!]
      : t[errorMessage(error)]
    : null;
  return (
    <div className="narrow">
      <h1>{c.complaints}</h1>
      <p className="muted">{c.complaintIntro}</p>
      {!draft && (
        <section className="card">
          <form onSubmit={generate}>
            <fieldset disabled={busy}>
              <label htmlFor="worker-name">{c.name}</label>
              <input
                id="worker-name"
                name="worker_name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
              <label htmlFor="recipient">{c.recipient}</label>
              <input id="recipient" name="recipient" required minLength={2} maxLength={160} />
              <label htmlFor="issue-date">{c.issueDate}</label>
              <input
                id="issue-date"
                name="issue_date"
                type="date"
                min="2000-01-01"
                max={indiaDate()}
                required
              />
              <label htmlFor="details">{c.details}</label>
              <textarea
                id="details"
                name="details"
                minLength={20}
                maxLength={1800}
                rows={5}
                required
              />
              <label htmlFor="resolution">{c.resolution}</label>
              <textarea
                id="resolution"
                name="resolution"
                minLength={5}
                maxLength={500}
                rows={3}
                required
              />
              <p className="hint">{c.sentToAi}</p>
              <button className="primary" type="submit">
                {busy ? c.generating : c.generate}
              </button>
            </fieldset>
          </form>
        </section>
      )}
      {busy && (
        <p className="notice" role="status">
          {c.generating}
        </p>
      )}
      {renderError && (
        <p className="error" role="alert">
          {renderError}
        </p>
      )}
      {draft && (
        <section className="card" aria-labelledby="draft-heading">
          <h2 id="draft-heading">{c.review}</h2>
          <p>{c.reviewHint}</p>
          <label htmlFor="draft-title">{c.title}</label>
          <input
            lang={facts?.language}
            id="draft-title"
            value={draft.title}
            maxLength={200}
            disabled={saving}
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value });
              setSaved(false);
              submissionId.current = null;
            }}
          />
          <label htmlFor="draft-body">{c.body}</label>
          <textarea
            lang={facts?.language}
            id="draft-body"
            value={draft.body}
            maxLength={5000}
            rows={14}
            disabled={saving}
            onChange={(event) => {
              setDraft({ ...draft, body: event.target.value });
              setSaved(false);
              submissionId.current = null;
            }}
          />
          <div className="actions">
            <button type="button" className="primary" onClick={save} disabled={saving || saved}>
              {saving ? t.saving : saved ? c.draftSaved : c.saveDraft}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => download(draft.title, draft.body)}
            >
              {c.download}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => {
                setDraft(null);
                setFacts(null);
                setError(null);
              }}
            >
              {c.regenerate}
            </button>
          </div>
          {saved && (
            <p className="notice" role="status">
              {c.draftSaved}
            </p>
          )}
        </section>
      )}
      <section className="card">
        <h2>{c.savedDrafts}</h2>
        <p className="hint">{c.privacy}</p>
        {loading ? (
          <p role="status">{t.loading}</p>
        ) : historyError ? (
          <div className="error" role="alert">
            <p>{t.databaseError}</p>
            <button
              className="secondary"
              type="button"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t.retry}
            </button>
          </div>
        ) : history.length === 0 ? (
          <p className="muted">{c.noDrafts}</p>
        ) : (
          <ul className="plain-list">
            {history.map((item) => (
              <li className="source-card" key={item.id}>
                <h3>{item.title}</h3>
                <details>
                  <summary>{c.review}</summary>
                  <p className="answer">{item.body}</p>
                </details>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => download(item.title, item.body)}
                >
                  {c.download}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
