"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { AuthForm } from "./auth-form";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { browserSupabase } from "@/lib/supabase/browser";
import { featureCopy } from "@/lib/feature-copy";
import { UiIcon } from "./ui-icon";
import { ChoiceSelect } from "./choice-select";
import { ThemeToggle } from "./theme-toggle";
import { LoadingSpinner } from "./loading-spinner";
import { finishPageSwitch, preparePageSwitch } from "@/lib/page-switch";

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
  const { configured, session, loading, authError } = useAuth();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [signoutError, setSignoutError] = useState(false);

  useLayoutEffect(() => {
    finishPageSwitch();
  }, [pathname]);

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
          <Link
            className="brand"
            href="/"
            scroll={false}
            onNavigate={pathname === "/" ? undefined : preparePageSwitch}
          >
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
                  <Link
                    href="/"
                    scroll={false}
                    onNavigate={pathname === "/" ? undefined : preparePageSwitch}
                    className="nav-link"
                    aria-current={pathname === "/" ? "page" : undefined}
                  >
                    <UiIcon name="wallet" size={18} />{t.earnings}
                  </Link>
                  <Link
                    href="/help"
                    scroll={false}
                    onNavigate={pathname === "/help" ? undefined : preparePageSwitch}
                    className="nav-link"
                    aria-current={pathname === "/help" ? "page" : undefined}
                  >
                    <UiIcon name="help" size={18} />{t.getHelp}
                  </Link>
                  <Link
                    href="/complaints"
                    scroll={false}
                    onNavigate={pathname === "/complaints" ? undefined : preparePageSwitch}
                    className="nav-link"
                    aria-current={pathname === "/complaints" ? "page" : undefined}
                  >
                    <UiIcon name="document" size={18} />{t.writeComplaint}
                  </Link>
                </>
              )}
            </nav>
          )}
          <div className="header-actions">
            <div className="language-control">
              <UiIcon name="globe" className="language-icon" size={18} />
              <ChoiceSelect
                id="language-switch"
                label={t.language}
                value={language}
                onChange={(selected) => setLanguage(selected as "en" | "hi" | "pa")}
                options={[
                  { value: "en", label: "English", lang: "en" },
                  { value: "hi", label: "हिन्दी", lang: "hi" },
                  { value: "pa", label: "ਪੰਜਾਬੀ", lang: "pa" },
                ]}
                compact
              />
            </div>
            <ThemeToggle />
            {session && (
              <button className="secondary header-signout" type="button" aria-label={signingOut ? t.signingOut : t.signOut} aria-busy={signingOut} disabled={signingOut} onClick={signOut}>
                {signingOut ? <LoadingSpinner /> : <UiIcon name="logout" size={18} />}
                <span className="signout-label">{signingOut ? t.signingOut : t.signOut}</span>
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
          <div key={`${session.user.id}:${pathname}`} className="page-transition">
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
