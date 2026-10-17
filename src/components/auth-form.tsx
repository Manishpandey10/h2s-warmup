"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useLanguage } from "./language-provider";
import { browserSupabase } from "@/lib/supabase/browser";
import type { MessageKey } from "@/lib/i18n";
import { LoadingSpinner } from "./loading-spinner";

const credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export function AuthForm({ admin = false }: { admin?: boolean }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success || (mode === "signup" && parsed.data.password.length < 8)) {
      setMessage(mode === "signin" ? "invalidLogin" : "invalidAuth");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const auth = browserSupabase().auth;
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword(parsed.data);
        if (error) {
          setMessage(
            error.code === "email_not_confirmed"
              ? "confirmEmail"
              : error.status === 429
                ? "authRateLimit"
                : "authError",
          );
        }
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const emailRedirectTo = new URL("/login", siteUrl).toString();
        const { data, error } = await auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo },
        });
        if (error) setMessage(error.status === 429 ? "authRateLimit" : "signupError");
        else if (!data.session) setMessage("confirmEmail");
      }
    } catch {
      setMessage("networkError");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card card" aria-labelledby="auth-title">
      <span className="eyebrow">{t.brand}</span>
      <h2 id="auth-title">{t.authTitle}</h2>
      <p className="muted">{t.authIntro}</p>
      {!admin && (
        <div className="segmented" aria-label={t.signIn}>
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={busy}
              onClick={() => {
                setMode(value);
                setMessage(null);
              }}
            >
              {value === "signin" ? t.signIn : t.signUp}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label htmlFor="email">{t.email}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
          <label htmlFor="password">{t.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 8 : 1}
            maxLength={128}
            required
            aria-describedby="password-hint"
          />
          <p className="hint" id="password-hint">
            {mode === "signup" ? t.passwordHint : t.loginPasswordHint}
          </p>
          <button className="primary full" type="submit" aria-busy={busy}>
            {busy && <LoadingSpinner />}
            {busy ? t.wait : mode === "signin" ? t.signIn : t.signUp}
          </button>
        </fieldset>
      </form>
      {message && (
        <p
          role={message === "confirmEmail" ? "status" : "alert"}
          className={message === "confirmEmail" ? "notice" : "error"}
        >
          {t[message]}
        </p>
      )}
      <p className="privacy">{t.private}</p>
    </section>
  );
}
