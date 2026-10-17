"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./language-provider";
import { earningInputSchema, type Earning } from "@/lib/earnings";
import { indiaDate } from "@/lib/dates";
import { toPaise, toRupees } from "@/lib/money";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import { errorMessage, type MessageKey } from "@/lib/i18n";

export function EarningForm({ entry, onSaved, onCancel }: { entry: Earning | null; onSaved: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const submissionId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = earningInputSchema.safeParse({
      work_date: data.get("work_date"), received_paise: toPaise(String(data.get("received"))),
      expense_paise: toPaise(String(data.get("expenses"))), pending_paise: toPaise(String(data.get("pending"))),
      minutes_worked: Number(data.get("minutes")), note: data.get("note")
    });
    if (!parsed.success) { setError("invalidEntry"); return; }
    setBusy(true); setError(null);
    try {
      submissionId.current ??= crypto.randomUUID();
      await apiRequest(entry ? `/api/earnings/${entry.id}` : "/api/earnings", {
        method: entry ? "PATCH" : "POST",
        body: JSON.stringify(entry ? parsed.data : { id: submissionId.current, entry: parsed.data })
      });
      if (!entry) form.reset();
      submissionId.current = null;
      onSaved();
    } catch (error) { setError(errorMessage(error instanceof ClientApiError ? error.code : "SERVER_ERROR")); }
    finally { setBusy(false); }
  }

  return <section className="card entry-form" aria-labelledby="entry-heading">
    <span className="eyebrow">{t.earnings}</span>
    <h2 id="entry-heading" tabIndex={-1}>{entry ? t.editTitle : t.addTitle}</h2>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <label htmlFor="work-date">{t.date}</label>
        <input id="work-date" name="work_date" type="date" min="2000-01-01" max={indiaDate()} defaultValue={entry?.work_date ?? indiaDate()} required />
        <p className="hint" id="amount-hint">{t.amountHint}</p>
        <div className="form-grid">
          {([{ name: "received", label: t.received, value: entry?.received_paise },
            { name: "expenses", label: t.expenses, value: entry?.expense_paise },
            { name: "pending", label: t.pending, value: entry?.pending_paise }] as const).map((field) => <div key={field.name}>
            <label htmlFor={field.name}>{field.label} (₹)</label>
            <input id={field.name} name={field.name} type="text" inputMode="decimal" pattern="[0-9]{1,7}(\.[0-9]{1,2})?"
              maxLength={10} defaultValue={toRupees(field.value ?? 0)} required aria-describedby={field.name === "pending" ? "amount-hint pending-hint" : "amount-hint"} />
          </div>)}
          <div><label htmlFor="minutes">{t.minutes}</label>
            <input id="minutes" name="minutes" type="number" min={0} max={1440} step={1} defaultValue={entry?.minutes_worked ?? 0} required aria-describedby="time-hint" />
          </div>
        </div>
        <p className="hint" id="time-hint">{t.timeHint}</p>
        <p className="hint" id="pending-hint">{t.pendingHint}</p>
        <label htmlFor="note">{t.note}</label>
        <textarea id="note" name="note" maxLength={500} rows={3} defaultValue={entry?.note ?? ""} aria-describedby="note-hint" />
        <p className="hint" id="note-hint">{t.noteHint}</p>
        <div className="actions">
          <button className="primary" type="submit">{busy ? t.saving : entry ? t.update : t.save}</button>
          {entry && <button className="secondary" type="button" onClick={onCancel}>{t.cancel}</button>}
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{t[error]}</p>}
    </form>
  </section>;
}
