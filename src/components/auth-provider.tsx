"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserSupabase } from "@/lib/supabase/browser";
import { supabaseConfig } from "@/lib/supabase/config";

type AuthState = {
  configured: boolean;
  session: Session | null;
  loading: boolean;
  authError: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = Boolean(supabaseConfig());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!configured) return;

    let mounted = true;
    const auth = browserSupabase().auth;
    auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        setSession(data.session);
        setAuthError(Boolean(error));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthError(true);
        setLoading(false);
      });

    const { data: listener } = auth.onAuthStateChange((_event, current) => {
      if (!mounted) return;
      setSession(current);
      setAuthError(false);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  return (
    <AuthContext.Provider value={{ configured, session, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("AuthProvider is missing");
  return state;
}
