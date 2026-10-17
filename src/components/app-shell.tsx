"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthForm } from "./auth-form";
import { useLanguage } from "./language-provider";
import { browserSupabase } from "@/lib/supabase/browser";
import { supabaseConfig } from "@/lib/supabase/config";

export function AppShell({
  children,
  loginOnly = false,
  admin = false,
}: {
  children?: ReactNode;
  loginOnly?: boolean;
  admin?: boolean;
}) {
  const { language, toggleLanguage, t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [signoutError, setSignoutError] = useState(false);
  const configured = Boolean(supabaseConfig());

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const auth = browserSupabase().auth;
    auth
      .getSession()
      .then(({ data, error }) => {
        if (mounted) {
          setSession(data.session);
          setAuthError(Boolean(error));
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthError(true);
          setLoading(false);
        }
      });
    const { data: listener } = auth.onAuthStateChange((_event, current) => {
      if (mounted) {
        setSession(current);
        setAuthError(false);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  async function signOut() {
    setSigningOut(true);
    setSignoutError(false);
    try {
      const { error } = await browserSupabase().auth.signOut();
      if (error) setSignoutError(true);
    } catch {
      setSignoutError(true);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              र
            </span>
            <span>
              RozMitra
              <small>
                {language === "hi" ? "हर दिन का साथी" : "A companion for your working day"}
              </small>
            </span>
          </Link>
          <div className="header-actions">
            <button
              className="language-switch"
              type="button"
              onClick={toggleLanguage}
              aria-label={t.language}
              lang={language === "en" ? "hi" : "en"}
            >
              {language === "en" ? "हिन्दी" : "English"}
            </button>
            {session && (
              <button className="secondary" type="button" disabled={signingOut} onClick={signOut}>
                {signingOut ? t.signingOut : t.signOut}
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="container main" tabIndex={-1}>
        {signoutError && (
          <p className="error" role="alert">
            {t.signoutError}
          </p>
        )}
        {!configured ? (
          <section className="card">
            <h1>{t.setupTitle}</h1>
            <p>{t.setupText}</p>
          </section>
        ) : loading ? (
          <p className="notice" role="status">
            {t.loginLoading}
          </p>
        ) : !session ? (
          <>
            {authError && (
              <p className="error" role="alert">
                {t.networkError}
              </p>
            )}
            {admin && (
              <p className="eyebrow">{language === "hi" ? "एडमिन साइन इन" : "Admin sign in"}</p>
            )}
            <AuthForm admin={admin} />
          </>
        ) : (
          <div key={session.user.id}>
            {loginOnly ? (
              <section className="card">
                <h1>{language === "hi" ? "साइन इन हो गया" : "You are signed in"}</h1>
                <Link className="button primary" href={admin ? "/admin" : "/"}>
                  {language === "hi" ? "आगे बढ़ें" : "Continue"}
                </Link>
              </section>
            ) : (
              <>
                <nav
                  className="app-nav"
                  aria-label={language === "hi" ? "मुख्य नेविगेशन" : "Main navigation"}
                >
                  <Link href="/">{t.earnings}</Link>
                  <Link href="/help">{language === "hi" ? "मदद" : "Get help"}</Link>
                  <Link href="/complaints">
                    {language === "hi" ? "शिकायत लिखें" : "Write a complaint"}
                  </Link>
                </nav>
                {children}
              </>
            )}
          </div>
        )}
      </main>
      <footer className="container footer">
        <span>{t.footer}</span>
        <Link href={admin ? "/login" : "/admin/login"}>
          {admin
            ? language === "hi"
              ? "यूज़र साइन इन"
              : "User sign in"
            : language === "hi"
              ? "एडमिन साइन इन"
              : "Admin sign in"}
        </Link>
      </footer>
    </>
  );
}
