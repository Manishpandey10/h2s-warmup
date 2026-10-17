"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { featureCopy, aiErrorKey } from "@/lib/feature-copy";
import { apiRequest, ClientApiError } from "@/lib/client-api";
import { errorMessage } from "@/lib/i18n";
import { sourceInputSchema, sourceRowSchema, type GuidanceSource } from "@/lib/guidance";
import { indiaDate } from "@/lib/dates";

export function SourceEditor() {
  const { language, t } = useLanguage(); const c = featureCopy(language);
  const [sources, setSources] = useState<GuidanceSource[]>([]);
  const [editing, setEditing] = useState<GuidanceSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [revision, setRevision] = useState(0);
  const submissionId = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    apiRequest("/api/admin/sources", { signal: controller.signal }).then((body) => {
      if (controller.signal.aborted) return;
      const parsed = z.object({ sources: z.array(sourceRowSchema) }).parse(body);
      setSources(parsed.sources); setAllowed(true);
    }).catch((error: unknown) => { if (!controller.signal.aborted) { setAllowed(false); setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR"); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    const parsed = sourceInputSchema.safeParse(Object.fromEntries(values));
    if (!parsed.success) { setError("INVALID_INPUT"); return; }
    setBusy(true); setError(null); setSaved(false);
    try {
      const editingId = editing?.status === "draft" ? editing.id : null;
      submissionId.current ??= crypto.randomUUID();
      await apiRequest(editingId ? `/api/admin/sources/${editingId}` : "/api/admin/sources", {
        method: editingId ? "PATCH" : "POST", body: JSON.stringify(editingId ? parsed.data : { id: submissionId.current, source: parsed.data })
      });
      setEditing(null); form.reset(); submissionId.current = null; setSaved(true); setRevision((value) => value + 1);
    } catch (error) { setError(error instanceof ClientApiError ? error.code : "SERVER_ERROR"); }
    finally { setBusy(false); }
  }

  const renderError = error ? aiErrorKey(error) ? c[aiErrorKey(error)!] : t[errorMessage(error)] : null;
  return <div className="narrow"><h1>{c.admin}</h1><p className="muted">{c.adminIntro}</p>
    {renderError && <div className="error" role="alert"><p>{renderError}</p><button className="secondary" type="button" onClick={() => setRevision((value) => value + 1)}>{t.retry}</button></div>}
    {loading && <p role="status">{t.loading}</p>}
    {allowed && <>
      {saved && <p className="notice" role="status">{c.sourceSaved}</p>}
      <section className="card"><h2>{editing ? editing.status === "published" ? c.revise : c.editDraft : c.addSource}</h2>
        <form key={editing?.id ?? "new"} ref={formRef} onSubmit={save}><fieldset disabled={busy}>
          <label htmlFor="source-title">{c.sourceTitle}</label><input id="source-title" name="title" minLength={5} maxLength={160} defaultValue={editing?.title ?? ""} required />
          <label htmlFor="source-url">{c.sourceUrl}</label><input id="source-url" name="url" type="url" maxLength={1000} defaultValue={editing?.url ?? ""} required aria-describedby="official-only" />
          <p className="hint" id="official-only">{c.officialOnly}</p>
          <label htmlFor="source-category">{c.category}</label><select id="source-category" name="category" defaultValue={editing?.category ?? "schemes"}>{(["schemes", "rights", "safety", "documents"] as const).map((value) => <option value={value} key={value}>{c[value]}</option>)}</select>
          <label htmlFor="source-content">{c.sourceContent}</label><textarea id="source-content" name="content" lang="en" minLength={30} maxLength={3000} rows={6} defaultValue={editing?.content ?? ""} required />
          <label htmlFor="source-jurisdiction">{c.jurisdiction}</label><input id="source-jurisdiction" name="jurisdiction" minLength={2} maxLength={80} defaultValue={editing?.jurisdiction ?? "India"} required />
          <label htmlFor="source-verified">{c.reviewedOn}</label><input id="source-verified" name="verified_on" type="date" min="2020-01-01" max={indiaDate()} defaultValue={editing?.verified_on ?? indiaDate()} required />
          <div className="actions"><button className="primary" type="submit">{busy ? t.saving : c.sourceSave}</button>{editing && <button className="secondary" type="button" onClick={() => { setEditing(null); submissionId.current = null; }}>{t.cancel}</button>}</div>
        </fieldset></form>
      </section>
      <section className="card"><h2>{c.allSources}</h2><p className="hint">{c.sourceReview}</p>{sources.length === 0 && <p>{c.sourceEmpty}</p>}
        {sources.map((source) => <article className="source-card" key={source.id}><span className="badge">{c[source.status]}</span><h3>{source.title}</h3><a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a><p className="hint">{source.jurisdiction} · {c.verified}: {source.verified_on}</p><p className="user-text" lang="en">{source.content}</p>
          <button className="secondary" type="button" disabled={busy} onClick={() => { setEditing(source); submissionId.current = null; setSaved(false); requestAnimationFrame(() => { formRef.current?.scrollIntoView({ behavior: "smooth" }); document.getElementById("source-title")?.focus(); }); }}>{source.status === "published" ? c.revise : c.editDraft}</button>
        </article>)}
      </section>
    </>}
  </div>;
}
