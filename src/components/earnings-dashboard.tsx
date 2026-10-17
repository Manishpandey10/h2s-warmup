"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-provider";
import { EarningForm } from "./earning-form";
import { indiaDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import {
  earningsResponseSchema,
  PAGE_SIZE,
  type Earning,
  type EarningsResponse,
} from "@/lib/earnings";
import { errorMessage, type MessageKey } from "@/lib/i18n";

export function EarningsDashboard() {
  const { language, t } = useLanguage();
  const [month, setMonth] = useState(indiaDate().slice(0, 7));
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MessageKey | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const [editing, setEditing] = useState<Earning | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const formAnchor = useRef<HTMLDivElement>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setResult(null);
    apiRequest(`/api/earnings?month=${month}&page=${page}`, { signal: controller.signal })
      .then((body) => {
        if (controller.signal.aborted) return;
        const parsed = earningsResponseSchema.safeParse(body);
        if (!parsed.success) throw new ClientApiError("DATABASE_ERROR");
        if (page > 0 && parsed.data.entries.length === 0) {
          setPage(page - 1);
          return;
        }
        setResult(parsed.data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(errorMessage(error instanceof ClientApiError ? error.code : "SERVER_ERROR"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, page, revision]);

  async function deleteEntry(id: string) {
    setDeleteBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/api/earnings/${id}`, { method: "DELETE" });
      if (editing?.id === id) setEditing(null);
      setDeleting(null);
      setNotice("deleted");
      refresh();
    } catch (error) {
      setError(errorMessage(error instanceof ClientApiError ? error.code : "SERVER_ERROR"));
    } finally {
      setDeleteBusy(false);
    }
  }

  const total = result?.summary;
  const cards = total
    ? [
        { label: t.received, value: total.received_paise, style: "" },
        { label: t.expenses, value: total.expense_paise, style: "" },
        { label: t.net, value: total.received_paise - total.expense_paise, style: "highlight" },
        { label: t.pending, value: total.pending_paise, style: "" },
      ]
    : [];

  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t.earnings}</span>
          <h1>{t.welcome}</h1>
          <p className="muted">{t.earningsIntro}</p>
        </div>
        <div className="month-control">
          <label htmlFor="month">{t.month}</label>
          <input
            id="month"
            type="month"
            min="2000-01"
            max="2099-12"
            value={month}
            onChange={(event) => {
              if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(event.target.value)) {
                setMonth(event.target.value);
                setPage(0);
                setNotice(null);
              }
            }}
          />
        </div>
      </div>
      <section aria-label={t.summary} aria-busy={loading}>
        {loading ? (
          <p role="status" className="notice">
            {t.loading}
          </p>
        ) : (
          total && (
            <>
              <div className="stats">
                {cards.map((card) => (
                  <div className={`stat ${card.style}`} key={card.label}>
                    <span>{card.label}</span>
                    <strong>{money(card.value, language)}</strong>
                  </div>
                ))}
              </div>
              <p className="hint">
                {t.netHelp} · {t.hours}:{" "}
                {(total.minutes_worked / 60).toLocaleString(language === "hi" ? "hi-IN" : "en-IN", {
                  maximumFractionDigits: 1,
                })}
              </p>
            </>
          )
        )}
      </section>
      {notice && (
        <p className="notice" role="status">
          {t[notice]}
        </p>
      )}
      {error && (
        <div className="error" role="alert">
          <p>{t[error]}</p>
          {!result && <p>{t.loadFailed}</p>}
          <button type="button" className="secondary" onClick={refresh}>
            {t.retry}
          </button>
        </div>
      )}
      <div ref={formAnchor}>
        <EarningForm
          key={editing?.id ?? "new"}
          entry={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setNotice(editing ? "updated" : "saved");
            setEditing(null);
            setPage(0);
            refresh();
          }}
        />
      </div>
      <section className="card" aria-labelledby="history-heading" aria-busy={loading}>
        <div className="section-heading compact">
          <h2 id="history-heading">{t.history}</h2>
          <button type="button" className="secondary" disabled={loading} onClick={refresh}>
            {t.refresh}
          </button>
        </div>
        {!loading && result && result.entries.length === 0 && (
          <div className="empty">
            <h3>{t.emptyTitle}</h3>
            <p className="muted">{t.emptyText}</p>
          </div>
        )}
        {result && result.entries.length > 0 && (
          <>
            <p className="hint">
              {t.countLabel}: {result.count}
            </p>
            <ul className="entry-list">
              {result.entries.map((entry) => (
                <li key={entry.id} className="entry">
                  <time dateTime={entry.work_date}>
                    {new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(`${entry.work_date}T00:00:00Z`))}
                  </time>
                  <dl className="entry-values">
                    <div>
                      <dt>{t.received}</dt>
                      <dd>{money(entry.received_paise, language)}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses}</dt>
                      <dd>{money(entry.expense_paise, language)}</dd>
                    </div>
                    <div>
                      <dt>{t.pending}</dt>
                      <dd>{money(entry.pending_paise, language)}</dd>
                    </div>
                    <div>
                      <dt>{t.hours}</dt>
                      <dd>
                        {(entry.minutes_worked / 60).toLocaleString(
                          language === "hi" ? "hi-IN" : "en-IN",
                          { maximumFractionDigits: 1 },
                        )}
                      </dd>
                    </div>
                  </dl>
                  {entry.note && <p className="user-text">{entry.note}</p>}
                  {deleting === entry.id ? (
                    <div className="delete-confirm" role="group" aria-label={t.deleteQuestion}>
                      <p>{t.deleteQuestion}</p>
                      <div className="actions">
                        <button
                          type="button"
                          className="danger"
                          disabled={deleteBusy}
                          onClick={() => deleteEntry(entry.id)}
                        >
                          {deleteBusy ? t.deleting : t.confirmDelete}
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => setDeleting(null)}
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="actions" role="group" aria-label={t.recordActions}>
                      <button
                        type="button"
                        className="secondary"
                        disabled={deleteBusy}
                        onClick={() => {
                          setEditing(entry);
                          formAnchor.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          requestAnimationFrame(() =>
                            document.getElementById("entry-heading")?.focus(),
                          );
                        }}
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        className="text-danger"
                        disabled={deleteBusy}
                        onClick={() => setDeleting(entry.id)}
                      >
                        {t.remove}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <nav className="pagination" aria-label={t.history}>
              <button
                className="secondary"
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage(page - 1)}
              >
                {t.previous}
              </button>
              <span>
                {t.page} {page + 1} / {Math.max(1, Math.ceil(result.count / PAGE_SIZE))}
              </span>
              <button
                className="secondary"
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= result.count || loading}
                onClick={() => setPage(page + 1)}
              >
                {t.next}
              </button>
            </nav>
          </>
        )}
      </section>
    </>
  );
}
