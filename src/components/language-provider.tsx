"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type Language } from "@/lib/i18n";

const LanguageContext = createContext<{ language: Language; toggleLanguage: () => void }>({ language: "en", toggleLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rozmitra-language");
      if (saved === "hi" || saved === "en") setLanguage(saved);
    } catch { /* The switch still works when browser storage is unavailable. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function toggleLanguage() {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
    try { localStorage.setItem("rozmitra-language", next); } catch { /* Optional persistence. */ }
  }
  return <LanguageContext.Provider value={{ language, toggleLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: messages[context.language] };
}
