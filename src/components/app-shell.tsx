"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthForm } from "./auth-form";
import { useLanguage } from "./language-provider";
import { browserSupabase } from "@/lib/supabase/browser";
import { supabaseConfig } from "@/lib/supabase/config";
import { featureCopy } from "@/lib/feature-copy";
import { UiIcon } from "./ui-icon";

export function AppShell({
  children,
  loginOnly = false,
  admin = false,
}: {
  children?: ReactNode;
  loginOnly?: boolean;
  admin?: boolean;
}) {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
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
            <span className="brand-mark"><UiIcon name="heart" size={24} /></span>
            <span>
              RozMitra
              <small>
                {t.brandTagline}
              </small>
            </span>
          </Link>
          {session && !loginOnly && (
            <nav className="app-nav" aria-label={t.mainNavigation}>
              {admin ? (
                <Link href="/admin" className="nav-link" aria-current="page">
                  <UiIcon name="document" size={18} />{featureCopy(language).admin}
                </Link>
              ) : (
                <>
                  <Link href="/" className="nav-link" aria-current={pathname === "/" ? "page" : undefined}>
                    <UiIcon name="wallet" size={18} />{t.earnings}
                  </Link>
                  <Link href="/help" className="nav-link" aria-current={pathname === "/help" ? "page" : undefined}>
                    <UiIcon name="help" size={18} />{t.getHelp}
                  </Link>
                  <Link href="/complaints" className="nav-link" aria-current={pathname === "/complaints" ? "page" : undefined}>
                    <UiIcon name="document" size={18} />{t.writeComplaint}
                  </Link>
                </>
              )}
            </nav>
          )}
          <div className="header-actions">
            <UiIcon name="globe" className="language-icon" size={19} />
            <label className="language-control">
              <span className="sr-only">{t.language}</span>
              <select
                className="language-switch"
                aria-label={t.language}
                value={language}
                onChange={(event) => setLanguage(event.target.value as "en" | "hi" | "pa")}
              >
                <option value="en" lang="en">English</option>
                <option value="hi" lang="hi">हिन्दी</option>
                <option value="pa" lang="pa">ਪੰਜਾਬੀ</option>
              </select>
            </label>
            {session && (
              <button className="secondary" type="button" disabled={signingOut} onClick={signOut}>
                <UiIcon name="logout" size={18} />
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
            {admin && <p className="eyebrow">{t.adminSignIn}</p>}
            <AuthForm admin={admin} />
          </>
        ) : (
          <div key={session.user.id}>
            {loginOnly ? (
              <section className="card">
                <h1>{t.signedIn}</h1>
                <Link className="button primary" href={admin ? "/admin" : "/"}>
                  {t.continue}
                </Link>
              </section>
            ) : (
              children
            )}
          </div>
        )}
      </main>
      <footer className="container footer">
        <span>{t.footer}</span>
        <Link href={admin ? "/login" : "/admin/login"}>
          {admin ? t.userSignIn : t.adminSignIn}
        </Link>
      </footer>
    </>
  );
}
