"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { browserSupabase } from "@/lib/supabase/browser";
import type { MessageKey } from "@/lib/i18n";

const credentials = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(128) });

export function AuthForm({ admin = false }: { admin?: boolean }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) { setMessage("invalidAuth"); return; }
    setBusy(true); setMessage(null);
    try {
      const auth = browserSupabase().auth;
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword(parsed.data);
        if (error) setMessage("authError");
      } else {
        const { data, error } = await auth.signUp(parsed.data);
        if (error) setMessage("signupError");
        else if (!data.session) setMessage("confirmEmail");
      }
    } catch { setMessage("networkError"); }
    finally { setBusy(false); }
  }

  return <section className="auth-card card" aria-labelledby="auth-title">
    <span className="eyebrow">{t.brand}</span>
    <h2 id="auth-title">{t.authTitle}</h2>
    <p className="muted">{t.authIntro}</p>
    {!admin && <div className="segmented" aria-label={t.signIn}>
      {(["signin", "signup"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value}
        disabled={busy} onClick={() => { setMode(value); setMessage(null); }}>{value === "signin" ? t.signIn : t.signUp}</button>)}
    </div>}
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <label htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        <label htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={8} maxLength={128} required aria-describedby="password-hint" />
        <p className="hint" id="password-hint">{t.passwordHint}</p>
        <button className="primary full" type="submit">{busy ? t.wait : mode === "signin" ? t.signIn : t.signUp}</button>
      </fieldset>
    </form>
    {message && <p role={message === "confirmEmail" ? "status" : "alert"} className={message === "confirmEmail" ? "notice" : "error"}>{t[message]}</p>}
    <p className="privacy">{t.private}</p>
  </section>;
}
