"use client";

import Link from "next/link";
import { preparePageSwitch } from "@/lib/page-switch";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "./language-provider";
import { EarningForm } from "./earning-form";
import { indiaDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { localeFor } from "@/lib/locale";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import {
  earningsResponseSchema,
  PAGE_SIZE,
  type Earning,
  type EarningsResponse,
} from "@/lib/earnings";
import { errorMessage, type MessageKey } from "@/lib/i18n";
import { featureCopy } from "@/lib/feature-copy";
import { UiIcon } from "./ui-icon";
import { DatePicker } from "./date-picker";
import { LoadingSpinner } from "./loading-spinner";

export function EarningsDashboard() {
  const { language, t } = useLanguage();
  const c = featureCopy(language);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(localeFor(language), {
    dateStyle: "medium",
    timeZone: "UTC",
  }), [language]);
  const hoursFormatter = useMemo(() => new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: 1,
  }), [language]);
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
  const cards = [
    { label: t.received, value: total?.received_paise ?? null, style: "" },
    { label: t.expenses, value: total?.expense_paise ?? null, style: "" },
    {
      label: t.net,
      value: total ? total.received_paise - total.expense_paise : null,
      style: "highlight",
    },
    { label: t.pending, value: total?.pending_paise ?? null, style: "" },
  ];

  return (
    <>
      <div className="section-heading dashboard-hero">
        <div>
          <span className="hero-icon"><UiIcon name="wallet" size={25} /></span>
          <span className="eyebrow">{t.earnings}</span>
          <h1>{t.welcome}</h1>
          <p className="muted">{t.earningsIntro}</p>
        </div>
        <div className="month-control">
          <label htmlFor="month">{t.month}</label>
          <DatePicker
            id="month"
            label={t.month}
            mode="month"
            min="2000-01"
            max={indiaDate().slice(0, 7)}
            value={month}
            onChange={(selected) => {
              setMonth(selected);
              setPage(0);
              setNotice(null);
            }}
          />
        </div>
      </div>
      <div className="quick-actions" aria-label={t.mainNavigation}>
        <Link
          href="/help"
          scroll={false}
          onNavigate={preparePageSwitch}
          className="quick-action"
        >
          <span className="quick-icon"><UiIcon name="help" size={23} /></span>
          <span><strong>{t.getHelp}</strong><small>{c.helpIntro}</small></span>
          <UiIcon name="arrow" size={19} />
        </Link>
        <Link
          href="/complaints"
          scroll={false}
          onNavigate={preparePageSwitch}
          className="quick-action"
        >
          <span className="quick-icon"><UiIcon name="document" size={23} /></span>
          <span><strong>{t.writeComplaint}</strong><small>{c.complaintIntro}</small></span>
          <UiIcon name="arrow" size={19} />
        </Link>
      </div>
      <section aria-label={t.summary} aria-busy={loading}>
        {loading && <p role="status" className="sr-only">{t.loading}</p>}
        <div className="stats">
          {cards.map((card) => (
            <div className={`stat${card.style ? ` ${card.style}` : ""}${loading ? " stat-loading" : ""}`} key={card.label}>
              <span>{card.label}</span>
              <strong>
                {loading ? (
                  <span className="stat-shimmer" aria-hidden="true" />
                ) : card.value === null ? "—" : money(card.value, language)}
              </strong>
            </div>
          ))}
        </div>
        {total && !loading && (
          <p className="hint">
            {t.netHelp} · {t.hours}:{" "}
            {(total.minutes_worked / 60).toLocaleString(localeFor(language), {
              maximumFractionDigits: 1,
            })}
          </p>
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
            <div className="entry-table-wrap">
              <table className="entry-table" aria-labelledby="history-heading">
                <thead>
                  <tr>
                    <th scope="col">{t.date}</th>
                    <th scope="col">{t.received}</th>
                    <th scope="col">{t.expenses}</th>
                    <th scope="col">{t.pending}</th>
                    <th scope="col">{t.hours}</th>
                    <th scope="col">{t.recordActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.entries.map((entry) => (
                    <Fragment key={entry.id}>
                      <tr className="entry-row">
                        <td className="entry-date" data-label={t.date}>
                          <time dateTime={entry.work_date}>
                            {dateFormatter.format(new Date(`${entry.work_date}T00:00:00Z`))}
                          </time>
                          {entry.note && <span className="entry-note user-text">{entry.note}</span>}
                        </td>
                        <td data-label={t.received}>{money(entry.received_paise, language)}</td>
                        <td data-label={t.expenses}>{money(entry.expense_paise, language)}</td>
                        <td className="entry-pending" data-label={t.pending}>
                          {money(entry.pending_paise, language)}
                        </td>
                        <td data-label={t.hours}>
                          {hoursFormatter.format(entry.minutes_worked / 60)}
                        </td>
                        <td className="entry-actions">
                          <div className="entry-row-actions" role="group" aria-label={t.recordActions}>
                            <button
                              type="button"
                              className="secondary"
                              disabled={deleteBusy}
                              onClick={() => {
                                setEditing(entry);
                                formAnchor.current?.scrollIntoView({ behavior: "auto", block: "start" });
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
                        </td>
                      </tr>
                      {deleting === entry.id && (
                        <tr className="entry-confirm-row">
                          <td colSpan={6}>
                            <div className="delete-confirm" role="group" aria-label={t.deleteQuestion}>
                              <p>{t.deleteQuestion}</p>
                              <div className="actions">
                                <button
                                  type="button"
                                  className="danger"
                                  disabled={deleteBusy}
                                  aria-busy={deleteBusy}
                                  onClick={() => deleteEntry(entry.id)}
                                >
                                  {deleteBusy && <LoadingSpinner />}
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
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
