"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { UiIcon } from "./ui-icon";
import { DatePicker } from "./date-picker";
import { LoadingSpinner } from "./loading-spinner";
import { useModalDialog } from "./use-modal-dialog";
import { localeFor } from "@/lib/locale";
import { VoiceInput } from "./voice-input";

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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedSaved, setSelectedSaved] = useState<z.infer<typeof complaintRowSchema> | null>(null);
  const [facts, setFacts] = useState<ComplaintFacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<z.infer<typeof complaintRowSchema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const submissionId = useRef<string | null>(null);
  const reviewDialog = useModalDialog(Boolean(draft) && reviewOpen);
  const savedDialog = useModalDialog(Boolean(selectedSaved));
  const savedFacts = selectedSaved ? complaintFactsSchema.safeParse(selectedSaved.facts) : null;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(localeFor(language), {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }),
    [language],
  );

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
      setReviewOpen(true);
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
    <div className="narrow page-stack">
      <div className="page-hero">
        <span className="hero-icon"><UiIcon name="document" size={25} /></span>
        <h1>{c.complaints}</h1>
        <p className="muted">{c.complaintIntro}</p>
      </div>
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
            <input
              id="recipient"
              name="recipient"
              required
              minLength={2}
              maxLength={160}
              aria-describedby="recipient-example"
            />
            <p id="recipient-example" className="hint">{c.recipientExample}</p>
            <label htmlFor="issue-date">{c.issueDate}</label>
            <DatePicker
              id="issue-date"
              name="issue_date"
              label={c.issueDate}
              min="2000-01-01"
              max={indiaDate()}
              required
            />
            <label htmlFor="details">{c.details}</label>
            <textarea
              id="details"
              lang={language}
              name="details"
              minLength={20}
              maxLength={1800}
              rows={5}
              required
              aria-describedby="details-example"
            />
            <VoiceInput targetId="details" />
            <p id="details-example" className="hint">{c.detailsExample}</p>
            <label htmlFor="resolution">{c.resolution}</label>
            <textarea
              id="resolution"
              lang={language}
              name="resolution"
              minLength={5}
              maxLength={500}
              rows={3}
              required
              aria-describedby="resolution-example"
            />
            <VoiceInput targetId="resolution" />
            <p id="resolution-example" className="hint">{c.resolutionExample}</p>
            <p className="hint">{c.sentToAi}</p>
            <button className="primary" type="submit" aria-busy={busy}>
              {busy && <LoadingSpinner />}
              {busy ? c.generating : c.generate}
            </button>
          </fieldset>
        </form>
      </section>
      {draft && !reviewOpen && (
        <button type="button" className="secondary" onClick={() => setReviewOpen(true)}>
          {c.review}
        </button>
      )}
      {renderError && !reviewOpen && (
        <p className="error" role="alert">
          {renderError}
        </p>
      )}
      {draft && (
        <dialog
          ref={reviewDialog}
          className="review-dialog"
          aria-labelledby="draft-heading"
          onClose={() => setReviewOpen(false)}
        >
          <div className="review-dialog-head">
            <h2 id="draft-heading" tabIndex={-1} data-dialog-heading>{c.review}</h2>
            <button
              type="button"
              className="review-dialog-close secondary"
              aria-label={c.closeReview}
              onClick={() => setReviewOpen(false)}
            >×</button>
          </div>
          <div className="review-dialog-content">
            <p>{c.reviewHint}</p>
            {renderError && <p className="error" role="alert">{renderError}</p>}
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
              <button type="button" className="primary" onClick={save} disabled={saving || saved} aria-busy={saving}>
                {saving && <LoadingSpinner />}
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
                  setReviewOpen(false);
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
          </div>
        </dialog>
      )}
      <section className="card">
        <h2 id="saved-drafts-heading">{c.savedDrafts}</h2>
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
          <div className="complaint-table-wrap">
            <table className="complaint-table" aria-labelledby="saved-drafts-heading">
              <thead>
                <tr>
                  <th scope="col">{c.title}</th>
                  <th scope="col">{c.to}</th>
                  <th scope="col">{c.savedOn}</th>
                  <th scope="col">{c.viewDraft}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const parsedFacts = complaintFactsSchema.safeParse(item.facts);
                  return (
                    <tr key={item.id}>
                      <td data-label={c.title} className="complaint-table-title user-text">
                        {item.title}
                      </td>
                      <td data-label={c.to} className="user-text">
                        {parsedFacts.success ? parsedFacts.data.recipient : "—"}
                      </td>
                      <td data-label={c.savedOn}>
                        <time dateTime={item.created_at}>
                          {dateFormatter.format(new Date(item.created_at))}
                        </time>
                      </td>
                      <td className="complaint-table-action">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setSelectedSaved(item)}
                        >
                          {c.viewDraft}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedSaved && (
        <dialog
          ref={savedDialog}
          className="review-dialog"
          aria-labelledby="saved-draft-heading"
          onClose={() => setSelectedSaved(null)}
        >
          <div className="review-dialog-head">
            <h2 id="saved-draft-heading" tabIndex={-1} data-dialog-heading>{c.review}</h2>
            <button
              type="button"
              className="review-dialog-close secondary"
              aria-label={c.closeReview}
              onClick={() => setSelectedSaved(null)}
            >×</button>
          </div>
          <div className="review-dialog-content">
            <dl className="complaint-letter-meta">
              <div>
                <dt>{c.from}</dt>
                <dd className="user-text">{savedFacts?.success ? savedFacts.data.worker_name : "—"}</dd>
              </div>
              <div>
                <dt>{c.to}</dt>
                <dd className="user-text">{savedFacts?.success ? savedFacts.data.recipient : "—"}</dd>
              </div>
              <div>
                <dt>{c.issueDate}</dt>
                <dd>
                  {savedFacts?.success
                    ? dateFormatter.format(new Date(`${savedFacts.data.issue_date}T00:00:00Z`))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>{c.title}</dt>
                <dd className="user-text">{selectedSaved.title}</dd>
              </div>
            </dl>
            <section
              className="complaint-letter-section"
              lang={savedFacts?.success ? savedFacts.data.language : language}
            >
              <h3>{c.body}</h3>
              <p className="complaint-letter-body user-text">{selectedSaved.body}</p>
            </section>
            {savedFacts?.success && (
              <section className="complaint-letter-facts">
                <h3>{c.originalDetails}</h3>
                <p className="user-text">{savedFacts.data.details}</p>
                <h3>{c.resolution}</h3>
                <p className="user-text">{savedFacts.data.requested_resolution}</p>
              </section>
            )}
            <button
              type="button"
              className="secondary"
              onClick={() => download(selectedSaved.title, selectedSaved.body)}
            >
              {c.download}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
